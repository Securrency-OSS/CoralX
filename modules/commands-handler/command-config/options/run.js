const Config = require('../../../Config');

module.exports = {
    validator: (scenario) => {
        const configFile = Config.readConfigFile();
        if (!configFile.scenarios[scenario]) {
            let supported = Object.keys(configFile.scenarios);
            throw new Error(`
                Invalid scenario. Scenario: '${scenario}' not found in the config file.
                Supported scenrious: ${supported.join()}.
            `);
        }
    }
};
