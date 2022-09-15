const fs = require('fs');
const path = require('path');

const Config = require('./Config');

class _Snapshot {
    constructor(web3) {
        this.web3 = web3;
        this.configPath = path.join(Config.getTmpDir(), 'snapShot.json');
        this.config = this.readConfig() || {};
    }

    async takeSnapshot() {
        await new Promise((resolve, reject) => {
            this.web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_snapshot',
                id: new Date().getTime()
            }, (err, snapshot) => {
                if (err) { return reject(err) }

                this.config = snapshot['result'];
                this.writeConfig();
                return resolve(snapshot)
            })
        });
    }

    async revertToSnapshot() {
        await new Promise((resolve, reject) => {
            this.web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_revert',
                params: [this.config],
                id: new Date().getTime()
            }, async (err, result) => {
                if (err) { return reject(err) }

                await this.takeSnapshot();
                return resolve(result)
            })
        });
    }

    writeConfig() {
        const tmpDir = Config.getTmpDir();
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }
        fs.writeFileSync(this.configPath, JSON.stringify(this.config));
    }

    readConfig() {
        if (!fs.existsSync(this.configPath)) {
            return {};
        }
        const config = fs.readFileSync(this.configPath);
        return JSON.parse(config);
    }

    exists() {
        return fs.existsSync(this.configPath);
    }
}

class Snapshot {
    static getInstance(web3 = {}) {
        if (!this.instance) {
            this.instance = new _Snapshot(web3);
        }
        return this.instance;
    }
}

module.exports = Snapshot;
