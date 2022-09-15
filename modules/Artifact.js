const fs = require('fs');
const path = require('path');
const ethers = require('ethersfathom');

const Config = require('./Config');
const Constants = require('./Constants');
const Logger = require('./Logger');
const web3Provider = require('./Provider');
const Queue = require('./Queue');
const TxManager = require('./TxManager');
const ErrorsCounter = require('./ErrorsCounter');

const Artifact = {
    getFileRelativePath() {
        return this.file;
    },
    getFileName() {
        let extension = path.extname(this.file);
        return path.basename(this.file, extension);
    },
    getAbiFile() {
        return JSON.parse(fs.readFileSync(this.getBuildPathWithExtension('.json'), 'utf8'));
    },
    getTmpABI() {
        const { abi } = this.getAbiFile();
        return abi;
    },
    getNetworkFromABI() {
        const abiFile = this.getAbiFile();
        const networkId = web3Provider.getNetworkId();

        return abiFile && abiFile.networks && abiFile.networks[networkId];
    },
    getAddressFromABI() {
        const networkById = this.getNetworkFromABI();

        return networkById && networkById.address;
    },
    getTmpBytecode() {
        const { bytecode } = this.getAbiFile();
        return bytecode;
    },
    getBuildPathWithExtension(ext) {
        const extension = path.extname(this.file);
        const file = this.getComponentNameABI(extension);
        const rootPath = path.join(this.getBuildDirPath(), file);
        return path.format({
            root: rootPath,
            name: '',
            ext: ext
        });
    },
    getBuildDirPath() {
        return this.buildDir ? this.buildDir : Config.getBuildContractsDir(this.workSpace);
    },
    getComponentNameABI(extension) {
        if (!this.fileName) {
            this.fileName = path.basename(this.file, extension);
        }
        return this.fileName;
    },
    setBuildDir(path) {
        this.buildDir = path;
    },
    setAddressFromABI() {
        this.address = this.getAddressFromABI();
    },
    setContractInstance(address, abi, provider) {
        this.contractInstance = new ethers.Contract(
            address,
            abi,
            provider
        );
    },
    setContractWithSigner(address, abi, signer) {
        this.contractWithSigner = new ethers.Contract(
            address,
            abi,
            signer
        );
    },
    buildPrototype() {
        this.prototypedObj = {};
        this.prototypeFn('address', null, null);

        const abi = this.getTmpABI();
        abi.forEach(item => {
            if (item.type && item.type === 'function') {
                this.prototypeFn(item.name, item.stateMutability);
            }
        });
    },
    prototypeFn(method, stateMutability) {
        this.prototypedObj.__proto__ = [method];
        this.prototypedObj.address =
            this.prototypedObj[method] = async (...args) => {
                const queue = Queue.getInstance();
                let contract = await this.getContract();

                if (method === 'address') {
                    return contract.address;
                }

                if (['view', 'pure'].includes(stateMutability)) {
                    return contract.callStatic[method](...args);
                } else {
                    return new Promise(async (resolve, reject) => {
                        const areOverrides = this.checkOverrides(args[args.length - 1]);
                        let txDetails = (areOverrides) ? args[args.length - 1] : {};
                        const data = Logger.getActionTxHash(
                            this.address,
                            this.getFileRelativePath(),
                            method,
                            args
                        );

                        if (data && data.txHash) {
                            await TxManager.ensureTransactionMined(data.txHash);
                            return resolve({ hash: data.txHash, nonce: data.nonce });
                        }

                        contract = await this.getContractWithSigner(txDetails.from);

                        queue.add(async () => {
                            let result, receipt;
                            try {
                                txDetails = await this.updateOverrides(txDetails);
                                args.push(txDetails);

                                // something wrong with gas calculation
                                // gas limit calculated with estimateGas
                                // Gas Limit: 838,732 (tx failed)
                                // https://kovan.etherscan.io/tx/0xcd6b170f80d665ec1d719fe570298b8fe4826348b9fda3a323522fa6e64a8724
                                // the same tx published via metamask
                                // https://kovan.etherscan.io/tx/0x8c152438428083faa0d2b90e40b4e88ad59d3cabe76d4a672a89a68befe9fc64
                                // Gas Limit: 839,467
                                //
                                // adding 5% gas more to get around this problem
                                let gas;
                                if (Config.getProcessType() === Constants.PROCESS_TYPE_TEST && Config.publishFailedTx()) {
                                    try {
                                        gas = await contract.estimateGas[method](...args);
                                    } catch (error) {
                                        args[args.length - 1].gasLimit = '8000000';
                                        const tx = await contract.populateTransaction[method](...args);
                                        const signer = !txDetails.from ? web3Provider.getWallet() : web3Provider.getSigner(txDetails.from);
                                        await signer.sendTransaction(tx);

                                        return reject(error);
                                    }
                                } else {
                                    gas = await contract.estimateGas[method](...args);
                                }

                                gas = gas.add(gas.div(100).mul(5));
                                args[args.length - 1].gasLimit = gas.toString();

                                const tx = await contract.populateTransaction[method](...args);

                                const signer = !txDetails.from ? web3Provider.getWallet() : web3Provider.getSigner(txDetails.from);
                                result = await signer.sendTransaction(tx);

                                receipt = await TxManager.ensureTransactionMined(result.hash, 100);
                            } catch (error) {
                                if (Config.getProcessType() === Constants.PROCESS_TYPE_TEST) {
                                    if (Config.publishFailedTx()) {
                                        const keys = Object.keys(error.error.data);
                                        console.log(`Failed tx hash: ${keys[0]}`);
                                    }
                                    return reject(error);
                                } else {
                                    ErrorsCounter.increment();
                                    Logger.printTxError(error, this.getFileRelativePath(), method, this.address);

                                    console.log('Provided args: ');
                                    console.log(args, '\n');

                                    return;
                                }
                            }

                            if (Config.getProcessType() !== Constants.PROCESS_TYPE_TEST) {
                                Logger.log(
                                    this.address,
                                    this.getFileRelativePath(),
                                    method,
                                    args,
                                    result.hash,
                                    result.nonce
                                );
                            }

                            return receipt;
                        });

                        const receipt = await queue.processQueue();

                        return !receipt ? resolve() : resolve(receipt.txReceipt);
                    });
                }
            };
    },
    checkOverrides(txDetails) {
        let areOverrides = false;
        if (txDetails !== null && typeof txDetails === 'object') {
            Object.entries(txDetails).forEach(([key, value]) => {
                if (Constants.TX_OVERRIDES.includes(key)) {
                    areOverrides = true;
                }
            });
        }

        return areOverrides;
    },
    async updateOverrides(args = []) {
        let updated = {};
        Object.entries(args).forEach(([key, value]) => {
            if (key !== 'gas') {
                updated[key] = value;
            } else {
                updated.gasLimit = value;
            }
        });

        if (!updated.from) {
            const wallet = web3Provider.getWallet();
            updated.nonce = await wallet.getTransactionCount("pending");
        } else {
            let provider = web3Provider.getProvider();
            updated.nonce = await provider.getTransactionCount(updated.from, "pending");
        }

        return updated;
    },
    async deployed() {
        if (!this.prototypedObj) {
            this.buildPrototype();
        }

        return this.prototypedObj;
    },
    async getContract() {
        if (!this.contractInstance) {
            const provider = web3Provider.getProvider();

            this.setContractInstance(
                this.address || this.getAddressFromABI(),
                this.getTmpABI(),
                provider
            );
        }
        return this.contractInstance;
    },
    async getContractWithSigner(walletAddress) {
        const { contractWithSigner } = this;
        const contractWithSignerAddress = contractWithSigner && contractWithSigner.signer._address;

        if (contractWithSignerAddress !== walletAddress) {
            const provider = web3Provider.getProvider();

            await provider.getNetwork();

            const wallet = web3Provider.getWallet();
            const address = walletAddress || await wallet.getAddress();

            const signer = walletAddress ? web3Provider.getSigner(address) : provider.getSigner(address);
            const contractAddress = contractWithSigner.address || this.getAddressFromABI();

            this.setContractWithSigner(contractAddress, this.getTmpABI(), signer);
        }
        return this.contractWithSigner;
    },
    async at(address) {
        const artifact = { ...this };

        const provider = web3Provider.getProvider();
        const wallet = web3Provider.getWallet();
        const wAddress = await wallet.getAddress();
        const signer = provider.getSigner(wAddress);

        artifact.setContractWithSigner(address, this.getTmpABI(), signer);
        artifact.address = address;

        let instance = await artifact.deployed();
        instance.address = address;

        return instance;
    },
    async updateABINetwork(provider, txHash, address) {
        const abiFile = this.getAbiFile();
        const { chainId } = await provider.getNetwork();

        abiFile['networks'][chainId] = {
            'address': address,
            'transactionHash': txHash,
        };

        fs.writeFileSync(
            this.getBuildPathWithExtension('.json'),
            JSON.stringify(abiFile, null, 4)
        );

        this.address = address;
    }
}

module.exports = Artifact;
