const Config = require('../../../Config');

module.exports = {
    validator: (network) => {
        const configFile = Config.readConfigFile();
        if (!configFile.networks[network]) {
            let supported = Object.keys(configFile.networks);
            throw new Error(`
                Invalid network. Network: '${network}' not found in the config file.
                Supported networks: ${supported.join()}.
            `);
        }
    }
};
