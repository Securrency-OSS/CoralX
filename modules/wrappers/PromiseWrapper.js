const Config = require('../Config');
const TxManager = require('../TxManager');
const web3Provider = require('../Provider');
const Queue = require('../Queue');

const PromiseWrapper = {
    async all(promises) {
        await Promise.all(promises);
        await Queue.getInstance().processQueue();

        let target = await this.getTargetBlock();        
        await TxManager.waitConfirmations(target);
    },
    async getTargetBlock() {
        return new Promise((resolve, reject) => {
            web3Provider.getProvider().getBlockNumber().then(last => {
                let confirmations = Config.blockConfirmationsForPromiseAll();
                return resolve(last + confirmations);
            }).catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = PromiseWrapper;
