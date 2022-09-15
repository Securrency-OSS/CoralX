const chai = require('chai');
const fs = require('fs');
const glob = require('glob');
const Mocha = require('mocha');
const path = require('path');
const rimraf = require('rimraf');
const Web3 = require('web3');

const Command = require('./Command');
const Scenario = require('./Scenario');
const Artifacts = require('../../Artifacts');
const Config = require('../../Config');
const Constants = require('../../Constants');
const Deployer = require('../../Deployer');
const Logger = require('../../Logger');
const Provider = require('../../Provider');
const Snapshot = require('../../Snapshot');
const ErrorsCounter = require('../../ErrorsCounter');

const MOCHA_TIMEOUT = 50000;
const DEPLOYMENT_FOR_TEST = 'migrateAndConfigureForTests';

class Test extends Command {
    constructor() {
        super();
        
        Config.setTmpDir();
        Logger.resetJobModel();

        this.web3 = new Web3(Config.read()['host'])
        this.snapshot = Snapshot.getInstance(this.web3);
    }
    async run(config, directory, supportedCommands) {
        await this.beforeTest(config, supportedCommands);
        await this.defineGloabals();

        const TIMEOUT = this.getTimeOut(config);
        const mocha = new Mocha().timeout(TIMEOUT);

        this.getTestFiles(config, directory)
            .filter((file) => file.includes('.test.js'))
            .forEach((file) => mocha.addFile(file));

        return new Promise(resolve => {
            mocha.run(failures => {
                if (failures > 0) ErrorsCounter.add(failures);
                resolve(failures);
            });
        });
    }
    async beforeTest(config, supportedCommands) {
        await Provider.initializeNetworkId();

        let options = {
            skip_compile: config.options.skip_compile,
            use_snapshot: config.options.use_snapshot
        };

        Config.setPublishFailedTxFlag(config.options.publish_failed_tx === 'true');

        if (config.options.use_snapshot === 'true' && this.snapshot.exists()) {
            this.snapshot.revertToSnapshot();
        } else {
            config.options.use_snapshot = 'false';
        }

        await this.runMigrationAndConfigurations(supportedCommands, options);
        await this.snapshot.takeSnapshot();
        
        Config.setProcessType(Constants.PROCESS_TYPE_TEST);
    }
    async runMigrationAndConfigurations(supportedCommands, options) {
        const scenarioCommand = new Scenario();

        const scenarios = Config.scenarios();
        if (!scenarios[DEPLOYMENT_FOR_TEST]) {
            throw new Error(`Scenario '${DEPLOYMENT_FOR_TEST}' is required for test and is not configureds`);
        }
        
        this.resetTmpDir(options);

        await scenarioCommand.run(
            {
                options: { run: DEPLOYMENT_FOR_TEST },
                commandOptions: [
                    '--skip_compile', options.skip_compile ? 'true' : 'false',
                    '--use_snapshot', options.use_snapshot ? 'true' : 'false'
                ]
            },
            '',
            supportedCommands
        );
    }
    resetTmpDir(options) {
        if (
            (!options.skip_compile || (!!options.skip_compile && options.skip_compile !== 'true')) &&
            (!options.use_snapshot || (!!options.skip_compile && options.use_snapshot !== 'true'))
        ) {
            rimraf.sync(Config.getTmpDir());
        }
    }
    async defineGloabals() {
        global.accounts = await this.web3.eth.getAccounts();
        global.artifacts = Artifacts;
        global.deployer = Deployer;
        global.snapshot = this.snapshot;
        global.assert = chai.assert;
        global.expect = chai.expect;
    }
    getTestFiles(config, directory) {
        const testPath = config.options.path;

        const testsDir = path.join(directory, Config.testsDir());
        const directoryPath = testPath ?  path.join(testsDir, testPath) : testsDir;

        let testFiles = [];
        if (fs.lstatSync(directoryPath).isFile()) {
            testFiles.push(directoryPath);
        } else if (testFiles.length === 0) {
            const directoryContents = glob.sync(`${directoryPath}${path.sep}**${path.sep}*`);
            testFiles = directoryContents.filter(item => fs.statSync(item).isFile()) || [];
        }
        return testFiles;
    }
    getTimeOut(options) {
        if (options.options.params) {
            let params = options.options.params.split('=');
            for (let i = 0; i < params.length; i+=2) {
                if (params[i] == 'TIMEOUT') {
                    return params[i+1];
                }
            }
        }
        return MOCHA_TIMEOUT;
    }
}

module.exports = Test;
