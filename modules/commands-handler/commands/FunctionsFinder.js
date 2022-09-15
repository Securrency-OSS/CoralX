const path = require('path');
const fs = require('fs');
const web3 = require('web3');

const Command = require('./Command');
const Provider = require('../../Provider');

class FunctionsFinder extends Command {
    async run(config) {
        const buildDir = config.options.path;

        const data = config.options.data.split('::');
        if (!web3.utils.isAddress(data[0])) {
            return await this.findBySig(data[0], buildDir)
        }
        return await this.findBySigAndAddress(data, buildDir);
    }
    async findBySig(sig, buildDir) {
        if (sig.length != 10) {
            throw new Error(`
                Invalid method signature
                Expecting: <address>::<sig>    
            `);
        }

        let self = this;
        return new Promise(() => {
            fs.readdir(buildDir, (error, files) => {
                if (error) {
                    throw new Error(
                        `Could not list the directory. Error: ${error}`
                    );
                }
            
                files.forEach(function (file, _) {
                    const filePath = path.join(buildDir, file);
                    const json = JSON.parse(fs.readFileSync(filePath));
                    
                    const method = self.findMethod(json, sig);
                    if (method) {
                        console.log(`
                            00000 Component found: ${json.contractName}
                            Method fould: ${method}
                        `);
                    }
                });
            });
        });
    }
    async findBySigAndAddress(data, buildDir) {
        this.validateInputs(data);

        await Provider.initializeNetworkId();
        const networkId = Provider.getNetworkId();

        const address = data[0];
        const sig = data[1];

        let self = this;
        return new Promise(() => {
            fs.readdir(buildDir, (error, files) => {
                if (error) {
                    throw new Error(
                        `Could not list the directory. Error: ${error}`
                    );
                }
            
                files.forEach(function (file, _) {
                    const filePath = path.join(buildDir, file);
                    const json = JSON.parse(fs.readFileSync(filePath));
                    
                    if (!Object.keys(json.networks).length == 0 && json.networks[networkId]) {
                        if (json.networks[networkId].address == address) {
                            const method = self.findMethod(json, sig);
                            console.log(`
                                Component found: ${json.contractName}
                                Method fould: ${method}
                            `);
                            process.exit(0);
                        }
                    }
                });
            });
        });
    }
    validateInputs(data) {
        if (!data[0] || !data[1]) {
            throw new Error(`
                Invalid data format.
                Expecting: <address>::<sig>
            `);
        }
        if (!web3.utils.isAddress(data[0])) {
            throw new Error(`
                Invalid address
                Expecting: <address>::<sig>    
            `);
        }
        if (data[1].length != 10) {
            throw new Error(`
                Invalid method signature
                Expecting: <address>::<sig>    
            `);
        }
    }
    findMethod(json, sig) {
        let f;
        json.abi.forEach((item) => {
            if (item.type == 'function') {
                const params = [];
                item.inputs.forEach((element) => {
                    params.push(element.type);
                });
                
                const fn = `${item.name}(${params.join(',')})`;
                const gSig = (web3.utils.keccak256(fn)).substr(0, 10);
                
                if (sig == gSig) {
                    f = fn;
                    return;
                }
            }
        });
        return f;
    }
}

module.exports = FunctionsFinder;
