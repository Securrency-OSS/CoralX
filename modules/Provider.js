const ethers = require('ethersfathom');

const Config = require('./Config');

const Provider = {
    getProvider() {
        if (!this.provider) {
            const conf = Config.read();
            this.provider = ethers.getDefaultProvider(conf['host']);
        }

        return this.provider;
    },
    getWallet() {
        if (!this.wallet) {
            const conf = Config.read();
            let provider = this.getProvider();
            this.wallet = new ethers.Wallet('0x' + conf['private_key'], provider);
        }
        return this.wallet;
    },
    getSigner(walletAddress) {
        const conf = Config.read();
        const JsonRpcProvider = new ethers.providers.JsonRpcProvider(conf['host']);
        return JsonRpcProvider.getSigner(walletAddress);
    },
    async initializeNetworkId() {
        let provider = this.getProvider();
        let network = await provider.getNetwork();

        this.networkId = network.chainId;
    },
    getNetworkId() {
        return this.networkId;
    }
}

module.exports = Provider;
