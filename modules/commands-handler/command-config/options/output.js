const path = require('path');
const fs = require('fs');

const Config = require('../../../Config');
const SCRIPTS_OUTPUT = 'custom-scripts-output';

module.exports = {
    afterAll: (results) => {
        const buildDir = path.join(Config.getBuildDir(), SCRIPTS_OUTPUT);

        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir);
        }

        const files = Object.keys(results);

        files.forEach(file => {
            let fileWithExtension = file;
            if (file.includes('.js')) {
                fileWithExtension = file.replace('.js', '.json');
            } else {
                fileWithExtension += '.json';
            }
    
            const filePath = path.join(buildDir, fileWithExtension);
    
            fs.writeFileSync(
                filePath,
                JSON.stringify(results[file], null, 4)
            );
        });
    }
};
