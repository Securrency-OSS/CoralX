const ethers = require('ethersfathom');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
var solc = require('solc');

const Artifact = require('./Artifact');
const Logger = require('./Logger');
const web3Provider = require('./Provider');
const Queue = require('./Queue');
const TxManager = require('./TxManager');
const PolicyGenerator = require('./code-generator/Generator');
const Config = require('./Config');
const Compile = require('./commands-handler/commands/Compile');
const CommandConfig = require('./commands-handler/command-config/CommandConfig');
const ErrorsCounter = require('./ErrorsCounter');

const Deployer = {
    async deploy(...args) {
        const queue = Queue.getInstance();
        return new Promise(async (resolve) => {
            // last parameter merge
            const artifacts = args[0];
            const pureArgs = [...args];

            pureArgs.shift();
            const actionTxHash = Logger.getActionTxHash(
                artifacts.address,
                artifacts.getFileRelativePath(),
                'deploy',
                pureArgs
            );
            if (actionTxHash && actionTxHash.txHash) {
                let isMined = await TxManager.isTransactionMined(actionTxHash.txHash);
                if (!isMined) {
                    await TxManager.ensureTransactionMined(actionTxHash.txHash)
                }
                await artifacts.setAddressFromABI();
                return resolve();
            }

            queue.add((async () => {
                let areOverrides = artifacts.checkOverrides(args[args.length - 1]);
                let txDetails = (areOverrides) ? args[args.length - 1] : {};
                txDetails = await artifacts.updateOverrides(txDetails);

                args[args.length - 1] = txDetails;

                const { address, deployTransaction } = await this.deployContract(...args);
                const txHash = deployTransaction.hash;
                Logger.log(
                    artifacts.address,
                    artifacts.getFileRelativePath(),
                    'deploy',
                    pureArgs,
                    txHash,
                    deployTransaction.nonce
                );

                await TxManager.ensureTransactionMined(txHash);

                await this.updateABI(artifacts, txHash, address);
            }));

            await queue.processQueue();

            return resolve();
        });
    },
    async deployContract(...args) {
        const artifacts = args[0];
        const ABI = artifacts.getTmpABI();
        const bytecode = artifacts.getTmpBytecode();

        args.shift();

        const contract = new ethers.ContractFactory(
            ABI,
            bytecode,
            web3Provider.getWallet()
        );

        let result;
        try {
            result = await contract.deploy(...args);
        } catch (error) {
            ErrorsCounter.increment();
            Logger.printTxError(error, artifacts.getFileRelativePath(), 'deploy');
            return;
        }

        return result;
    },
    async updateABI(artifacts, txHash, address) {
        await artifacts.updateABINetwork(
            await web3Provider.getProvider(),
            txHash,
            address,
        );
    },
    networkId() {
        return web3Provider.getNetworkId();
    },
    preparePolicyTmpDir() {
        const policyName = `${Config.randomString(20)}.sol`;
        const policiesTmp = path.join(Config.getBuildDir(), '/../', 'policies');

        if (!fs.existsSync(policiesTmp)) {
            fs.mkdirSync(policiesTmp);
        }

        const policiesBuild = path.join(policiesTmp, 'build');
        const policiesContracts = path.join(policiesTmp, 'contracts');

        const policyPath = path.join(policiesContracts, policyName);

        if (!fs.existsSync(policiesBuild)) {
            fs.mkdirSync(policiesBuild);
        }

        if (!fs.existsSync(policiesContracts)) {
            fs.mkdirSync(policiesContracts);
        }

        // clean-up policies dir
        // to avoid compilation of the other policies
        rimraf.sync(path.join(policiesContracts, '/*'));
        rimraf.sync(path.join(policiesBuild, '/*'));

        return { policiesBuild, policiesContracts, policyPath };
    },
    async preparePolicyArtifact(policiesBuild, policiesContracts) {
        const compileCommand = new Compile();
        const compileOptions = ['contracts_build_directory', policiesBuild, 'contracts_directory', policiesContracts];
        await compileCommand.run(CommandConfig.getConfig(compileOptions));

        let policyArtifact = { ...Artifact };
        policyArtifact.file = 'PermissionsVerification.sol';
        policyArtifact.setBuildDir(policiesBuild);
        const { ast, abi } = policyArtifact.getAbiFile();

        return { ...policyArtifact, ast, _json: { abi } };
    },
    async deployPolicy(policyRelativePath) {
        const policy = await PolicyGenerator.generate(policyRelativePath);

        const { policiesBuild, policiesContracts, policyPath } = this.preparePolicyTmpDir();

        fs.writeFileSync(
            policyPath,
            policy
        );

        const policyArtifact = await this.preparePolicyArtifact(policiesBuild, policiesContracts);

        const { address } = await this.deployContract(policyArtifact);

        return policyArtifact.at(address);
    },
    async getPolicyByteCode(policyRelativePath) {
        let input = {
            language: 'Solidity',
            sources: {
                'Permissions.sol': {
                    content: await PolicyGenerator.generate(policyRelativePath)
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        var output = JSON.parse(solc.compile(JSON.stringify(input)));

        return `0x${output.contracts['Permissions.sol']['PermissionsVerification'].evm.bytecode.object}`;
    }
}

module.exports = Deployer;
