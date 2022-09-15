const fs = require('fs');
const path = require('path');

const Config = require('../../../Config');
const Constants = require('../../../Constants');
const WorkSpace = require('../../../Workspaces');

pathOption = {
    validator: (pathToExecute) => {
        pathOption.tryToVerifyPath(pathToExecute, false);
    },
    tryToVerifyPath(pathToExecute, isTest) {
        try {
            pathOption.verifyPath(pathToExecute);
        } catch (error) {
            if (isTest) {
                throw new Error(error);
            }
            pathOption.tryToVerifyPath(path.join(Config.testsDir(), pathToExecute), true);
        }
    },
    verifyPath(pathToExecute) {
        const workspace = WorkSpace.isWorkSpace(pathToExecute);
        pathToExecute = workspace.status ? workspace.path : pathToExecute;

        if (!fs.existsSync(pathToExecute)) {
            let withJS = pathToExecute;
            if (!pathToExecute.includes('.js')) {
                withJS += '.js';
            }
            if (!fs.existsSync(withJS)) {
                throw new Error(`
                    Nothing to execute.
                    '${pathToExecute}' doesn't exists
                `);
            }
        } else if (fs.lstatSync(pathToExecute).isDirectory()) {
            let files = fs.readdirSync(pathToExecute);
            if (files.length === 0) {
                throw new Error(`
                    Nothing to execute.
                    Directory '${pathToExecute}' is empty.
                `);
            }
        }
    },
    beforeAll: (pathToExecute) => {
        if (pathToExecute.includes('migrations')) {
            Config.setProcessType(Constants.PROCESS_TYPE_MIGRATIONS);
        } else if (pathToExecute.includes('configuration')) {
            Config.setProcessType(Constants.PROCESS_TYPE_CONFIGURATIONS);
        } else {
            Config.setProcessType(Constants.PROCESS_TYPE_CUSTOM_SCRIPT);
        }
    }
};

module.exports = pathOption;
