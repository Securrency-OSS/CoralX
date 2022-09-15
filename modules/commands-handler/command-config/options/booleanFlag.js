module.exports = {
    validator: (skipCompile) => {
        if (!['true', 'false'].includes(skipCompile.toLowerCase())) {
            throw new Error(`Invalid flag value. Supported values: 'true' or 'false'`);
        }
    }
};
