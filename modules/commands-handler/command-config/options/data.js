module.exports = {
    validator: (data) => {
        if (!data) {
            throw new Error(`
                Please provide some data.
            `);
        }
    }
}
