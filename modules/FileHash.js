const fs = require('fs');
const ethers = require('ethersfathom');

const Config = require('./Config');
const WorkSpace = require('./Workspaces');

class FileHash {
    constructor() {
        this.fileHashes = {};
    }

    addFileHash() {
        this.fileHashes[Config.getCurrentMigration()] = this.getFileHash();
    }

    isHashChanged() {
        return this.fileHashes[Config.getCurrentMigration()] !== this.getFileHash();
    }

    getFileHash() {
        const workSpace = WorkSpace.isWorkSpace('');
        const filePath = Config.getJobLogPath(workSpace);
        return fs.existsSync(filePath) ? ethers.utils.keccak256(fs.readFileSync(filePath)) : '';
    }
}

module.exports = FileHash;
