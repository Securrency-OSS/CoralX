const Params = require('../../../Params');

/**
 * params format
 * <name>=<value>:<name>=<value>....
 * should at least one 'name' -> 'value' pair
 * if you need more pairs they sould be separated with :
 */
ParamsOption = {
    validator: (params) => {
        params = ParamsOption.parseParams(params);
        let shareParams = Params.getInstance();
        Object.keys(params).forEach((key) => {
            if (!params[key]) {
                throw new Error(`
                    Invalid value for the '${key}' key.
                `);
            }
            shareParams.add(key, params[key]);
        });
    },
    parseParams: (params) => {
        const pairs = params.split(':');
        let data = {};
        pairs.forEach((pair) => {
            const nameValue = pair.split('=');
            if (nameValue.length !== 2) {
                throw new Error(`
                    Invalid pair '${pair}'.
                `);
            }
            data[nameValue[0]] = nameValue[1];
        });
        return data;
    }
};

module.exports = ParamsOption;
