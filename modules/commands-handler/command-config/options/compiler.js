const {SUPPORTED_COMPILERS} = require('../../../Constants');

module.exports = {
    validator: (compiler) => {
        if (!SUPPORTED_COMPILERS.includes(compiler)) {
            throw new Error(`
                Invalid compiler. Compiler: '${compiler}' is not supported.
                Supported compilers: ${SUPPORTED_COMPILERS.join()}.
            `);
        }
    }
};
