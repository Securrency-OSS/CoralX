const SUPPORTED_OPTIONS = {
    path: require('./options/path'),
    network: require('./options/network'),
    version: require('./options/version'),
    output: require('./options/output'),
    compiler: require('./options/compiler'),
    policy: require('./options/policy'),
    params: require('./options/params'),
    contracts_directory: require('./options/contractsDirectory'),
    contracts_build_directory: require('./options/contractsDirectory'),
    run: require('./options/run'),
    skip_compile: require('./options/booleanFlag'),
    use_snapshot: require('./options/booleanFlag'),
    publish_failed_tx: require('./options/booleanFlag'),
    data: require('./options/data'),
}

const OPTION_PREFIX = '--';

const CommandConfig = {
    getConfig(options, requiredOptions) {
        const result = this.prepareOptions(options);
        this.checkRequired(result, requiredOptions);

        return result;
    },
    prepareOptions(options) {
        let result = {options: {}, handlers: {beforeFile: [], beforeAll: [], afterAll: []}};
        for (let i = 0; i < options.length; i++) {
            const option = options[i].replace(OPTION_PREFIX, '');
            const optionHandler = SUPPORTED_OPTIONS[option];
            if (!optionHandler) {
                throw new Error(`Unsupported option: '${option}'`);
            }

            if (!!optionHandler.validator) {
                const value = options[i+1];
                if (!value) {
                    throw new Error(`Missed value for the '--${option}' option`);
                }

                result.options[option] = value;
                optionHandler.validator(value);
                i++;
            }

            if (!!optionHandler.beforeFile) {
                result.handlers.beforeFile.push(optionHandler.beforeFile);
            }

            if (!!optionHandler.beforeAll) {
                result.handlers.beforeAll.push(optionHandler.beforeAll);
            }

            if (!!optionHandler.afterAll) {
                result.handlers.afterAll.push(optionHandler.afterAll);
            }
        }
        return result;
    },
    checkRequired(result, required) {
        if (!required) return;

        let missedArgs = [];
        let filtered = Object.keys(result.options);
        for (let i = 0; i < required.length; i++) {
            if (!filtered.includes(required[i].replace(OPTION_PREFIX, ''))) {
                missedArgs.push(required[i]);
            }
        }

        if (!!missedArgs.length) {
            throw new Error(`
                Required options are missed: ${missedArgs.join()}
            `);
        }
    }
}

module.exports = CommandConfig;
