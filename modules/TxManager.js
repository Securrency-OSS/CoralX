const web3Provider = require('./Provider');
const Config = require('./Config');

const TxManager = {
    async isTransactionMined(transactionHash) {
        return new Promise((resolve, reject) => {
            web3Provider.getProvider().getTransactionReceipt(transactionHash).then(txReceipt => {
                if (txReceipt !== null && txReceipt.blockNumber)  {
                    return resolve({isMined: true, txReceipt: txReceipt});
                }
                return resolve({isMined: false, txReceipt: {}});
            }).catch(error => {
                reject(error);
            });
        });
    },
    async ensureTransactionMined(transactionHash, interval = null) {
        let self = this;
        return new Promise((resolve, reject) => {
            web3Provider.getProvider().getTransactionReceipt(transactionHash).then(txReceipt => {
                if (txReceipt && txReceipt.blockNumber)  {
                    if (txReceipt.status === 0) {
                        return reject('Transaction is mined but is reverted.\nTx hash: '+ txReceipt.txHash);
                    }

                    let target = txReceipt.blockNumber + Config.blockConfirmationsForTransaction();
                    
                    return self.waitConfirmations(target).then(() => {
                        return resolve({isMined: true, txReceipt: txReceipt});
                    }).catch(error => {
                        reject(error);
                    })
                }
                return setTimeout(() => resolve(
                    this.ensureTransactionMined(transactionHash)),
                    interval || Config.awaitTransactionInterval()
                );
            }).catch(error => {
                reject(error);
            });
        });
    },
    async waitConfirmations(target) {
        if(web3Provider.getNetworkId() === 1337) return;

        return new Promise((resolve, reject) => {
            web3Provider.getProvider().getBlockNumber().then(last => {
                if (last > target) {
                    return resolve(last);
                }
                return setTimeout(() => resolve(
                    this.waitConfirmations(target)),
                    Config.awaitBlockInterval()
                );
            }).catch(error => {
                reject(error);
            });
        });
    },
}

module.exports = TxManager;
