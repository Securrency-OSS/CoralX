const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const Constants = require('./Constants');
const { dynamicRequire } = require('./DynamicRequire');
const WorkSpaces = require('./Workspaces');

const CONFIG_FILENAME = 'coralX-config.js';
const TMP_DIRNAME = 'CoralX';

const Config = {
    read() {
        const configFile = this.readConfigFile();

        const network = this.network || 'development';
        if (!configFile.networks[network]) {
            throw new Error(`Invalid network. Network: "${network}" not found in the config file`)
        }
        
        const configFileNetwork = configFile.networks[network];

        const private_key = this.pk || configFileNetwork.private_key;
        if (!private_key) {
            throw new Error('Private key is not found.')
        }
        const host = configFileNetwork.host;

        return {private_key, host};
    },
    scenarios() {
        const configFile = this.readConfigFile();
        if (!configFile['scenarios']) {
            throw new Error(`scenarios are not configured`);
        }

        return configFile['scenarios'];
    },
    readConfigFile() {
        return dynamicRequire(path.join(this.getDirectory(), CONFIG_FILENAME));
    },
    setCurrentMigration(migration) {
        this.currentMigration = migration;
    },
    getCurrentMigration() {
        return this.currentMigration;
    },
    setDirectory(directory) {
        this.directory = directory;
    },
    // configuration || migration
    setProcessType(type) {
        this.processType = type;
    },
    getProcessType() {
        return this.processType;
    },
    getDirectory() {
        if (!this.directory) {
            throw Error('directory is not set...');
        }
        return this.directory;
    },
    getBuildDir(workSpace) {
        let directory = this.getTmpDir() || this.getDirectory();
        if (workSpace.status && this.getTmpDir()) {
            const arr = workSpace.name.split('/');
            directory = path.join(directory, path.join(...arr));
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
        } else if (workSpace.name != WorkSpaces.baseWorkSpace) {
            directory = workSpace.pkg;
        }

        this.buildDir = path.join(directory, 'build');

        return this.buildDir;
    },
    setTmpDir() {
        const tmpDir = path.join(os.tmpdir(), TMP_DIRNAME);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        this.tmpDir = tmpDir;
    },
    getTmpDir() {
        return this.tmpDir || '';
    },
    deleteTmpDir() {
        rimraf.sync(this.tmpDir);
    },
    getBuildContractsDir(wSpace) {
        return path.join(this.getBuildDir(wSpace), 'contracts');
    },
    getJobLogsDir(wSpace) {
        return path.join(this.getBuildDir(wSpace), 'job-logs');
    },
    getProcessLogDir(wSpace) {
        return path.join(this.getJobLogsDir(wSpace), this.processType);
    },
    getTestDir(wSpace) {
        return path.join(this.getBuildDir(wSpace), Constants.PROCESS_TYPE_TEST);
    },
    getJobLogPath(wSpace) {
        return path.join(this.getProcessLogDir(wSpace), `${this.currentMigration}.json`);
    },
    awaitTransactionInterval() {
        return 5000;
    },
    awaitBlockInterval() {
        return 10000;
    },
    blockConfirmationsForPromiseAll() {
        return 3;
    },
    blockConfirmationsForTransaction() {
        return 2;
    },
    awaitNewEpochVerification() {
        return 5000;
    },
    setPublishFailedTxFlag(flag) {
        this.publishFailedTxFlag = flag;
    },
    publishFailedTx() {
        return this.publishFailedTxFlag;
    },
    // just for debugging
    timeWithSeconds() {
        function msToTime(s) {
            // Pad to 2 or 3 digits, default is 2
          const pad = (n, z = 2) => ('00' + n).slice(-z);
          return pad((s%3.6e6)/6e4 | 0) + ':' + pad((s%6e4)/1000|0) + '.' + pad(s%1000, 3);
        }
        
        // Current hh:mm:ss.sss UTC
        return msToTime(new Date() % 8.64e7);
    },
    randomString(length) {
        let result           = '';
        const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
    },
    configFile() {
        return CONFIG_FILENAME;
    },
    testsDir() {
        const configFile = this.readConfigFile();
        if (!configFile['testsDir']) {
            throw new Error(`testsDir is not configured`);
        }

        return configFile['testsDir'];
    }
}

module.exports = Config;
