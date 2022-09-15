const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const Command = require('./Command');
const Config = require('../../Config');
const Constants = require('../../Constants');
const Deployer = require('../../Deployer');
const FileHash = require('../../FileHash');
const Logger = require('../../Logger');
const Provider = require('../../Provider');
const Snapshot = require('../../Snapshot');
const WorkSpace = require('../../Workspaces');
const RequireWrapper = require('../../wrappers/RequireWrapper');

class Execute extends Command {
    async run(config, directory) {
        let pathToProcess = config.options.path;
        let dirToProcess = directory;

        const workspace = WorkSpace.isWorkSpace(pathToProcess);
        if (workspace.status) {
            pathToProcess = workspace.relativePath;
            dirToProcess = workspace.pkg;
            WorkSpace.updateWorkSpace(workspace.pkg);
        }
        
        if (
            config.options.use_snapshot === 'true' &&
            fs.existsSync(Config.getJobLogsDir(workspace))
        )  {
            WorkSpace.resetToBaseWorkSpace();
            return;
        }

        this.cleanUpJobLogs(workspace);

        if (!!config.options.network) {
            Config.network = config.options.network;
        }
        if (!!config.options.pk) {
            Config.pk = config.options.pk;
        }

        for (let i = 0; i < config.handlers.beforeAll.length; i++) {
            await config.handlers.beforeAll[i](pathToProcess);
        }

        await this.process(
            path.join(dirToProcess, pathToProcess),
            config
        );

        WorkSpace.resetToBaseWorkSpace();
    }
    cleanUpJobLogs(workspace) {
        const dir = Config.getJobLogsDir(workspace);
        if (fs.existsSync(dir)) {
            rimraf.sync(dir);
        }
    }
    getFiles(directoryPath) {
        let files = [];
        if (fs.existsSync(directoryPath)) {
            if (directoryPath.includes('.js')) {
                files.push(path.parse(directoryPath).base);
                directoryPath = path.dirname(directoryPath);
            } else if (fs.lstatSync(directoryPath).isDirectory()) {
                files = fs.readdirSync(directoryPath);
            }
        } else if (!directoryPath.includes('.js')) {
            directoryPath += '.js';
            files.push(path.parse(directoryPath).base);
            directoryPath = path.dirname(directoryPath);
        }

        return {files: files, directoryPath: directoryPath};
    }
    async beforeFileHandling(currentFile, obj) {
        for (let i = 0; i < obj.handlers.beforeFile.length; i++) {
            if (!await obj.handlers.beforeFile[i](currentFile, obj)) return false;
        }
        return true;
    }
    async process(directoryPath, obj) {
        //passing directoryPath and callback function
        let preparedFiles = this.getFiles(directoryPath);
        let files = preparedFiles.files;
        directoryPath = preparedFiles.directoryPath;

        await Provider.initializeNetworkId();

        const wallet = await Provider.getWallet();
        const fileHash = new FileHash();
        const processType = Config.getProcessType();

        let results = {};
        for (let i = 0; i < files.length; i++) {
            const currentFile = files[i];

            if (currentFile === 'common') continue;

            Config.setCurrentMigration(currentFile);
            Logger.resetJobModel();

            if (!await this.beforeFileHandling(currentFile, obj)) break;
            console.log(currentFile);

            const options = {
                context: {
                    web3: web3,
                    accounts: [wallet.address],
                    deployer: Deployer,
                }
            };

            if (processType === Constants.PROCESS_TYPE_MIGRATIONS) {
                fileHash.addFileHash();
            }

            results[currentFile] = await RequireWrapper.require(path.join(directoryPath, currentFile), options);
        }

        obj.handlers.afterAll.forEach(async (handler) => {
            await handler(results)
        });
    }
    /**
     * Returns a list of the required options
     */
    getRequiredOptions() {
        return ['path'];
    }
}

module.exports = Execute;
