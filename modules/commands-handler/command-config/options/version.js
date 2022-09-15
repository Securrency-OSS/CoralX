module.exports = {
    validator: (value) => {
        let regExpTemplate = /^\d\.\d\.\d+$/gmi;
        if (regExpTemplate.exec(value) === null) {
            throw new Error(`
                Invalid version: ${value},
                expected: ${regExpTemplate}
            `);
        }
    },
    beforeFile: (file, obj) => {
        let file_version = file.match(/\d+/g).join('');
        let v = obj.options.version.match(/\d+/g).join('');

        return file_version <= v;
    }
};
