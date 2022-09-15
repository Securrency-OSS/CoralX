const fs = require('fs');
const path = require('path');

const Command = require('./Command');

class Version extends Command {
    async run() {
        const file = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(file));
        console.log(`
            CoralX v${packageJson.version}
        `);
    }
}

module.exports = Version;
