const ethers = require('ethersfathom');
const fs = require('fs');

const Config = require('./Config');
const WorkSpace = require('./Workspaces');
const Constants = require('./Constants');

const Logger = {
    getActionTxHash(address, contract, action, args) {
        this.updateArgs(args);

        const key = this.getActionKey(address, contract, action, args);

        return this.getFromJobModel(key);
    },
    log(address, contract, action, args, txHash, nonce) {
        this.getJob();
        this.updateArgs(args);

        const key = this.getActionKey(address, contract, action, args);

        this.jobModel[key] = {
            interface: contract,
            address: address,
            action: action,
            args: JSON.stringify(args),
            txHash: txHash,
            nonce: nonce,
        };

        this.saveJob();
    },
    getActionKey(address, contract, action, args) {
        let dataForKey = [];
        if (action !== 'deploy') {
            dataForKey.push(address);
        }
        dataForKey.push(JSON.stringify(args));
        dataForKey.push(contract);
        dataForKey.push(action);

        let dataForHash = '';
        dataForKey.forEach(element => {
            dataForHash += element;
        })

        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataForHash));
    },
    getFromJobModel(key) {
        this.getJob();

        return this.jobModel[key];
    },
    resetJobModel() {
        this.jobModel = {};
    },
    getJob() {
        const workSpace = WorkSpace.isWorkSpace('');
        if (Object.keys(this.jobModel).length === 0 && this.isJobLogDirExists() && this.isJobLogPathExists()) {
            const job = JSON.parse(fs.readFileSync(Config.getJobLogPath(workSpace), 'utf8'));
            this.jobModel = job ? job : {};
        }

        this.jobModel = this.jobModel || {};
    },
    saveJob() {
        const workSpace = WorkSpace.isWorkSpace('');
        if (!this.isJobLogDirExists()) fs.mkdirSync(Config.getProcessLogDir(workSpace), { recursive: true });

        fs.writeFileSync(
            Config.getJobLogPath(workSpace),
            JSON.stringify(this.jobModel, null, 4)
        );
    },
    printTxError(error, contract, action, address) {
        if (Config.getProcessType() === Constants.PROCESS_TYPE_TEST) return;

        const { code, reason, operation, body, requestBody } = error;

        console.log(`Interface: ${contract}\nAction: ${action}\n`);

        if (address) {
            console.log(`Address: ${address}\n`)
        }

        if (code) {
            console.log('Error code: ', code);
        }

        if (reason) {
            console.log('Reason: ', reason);
        }

        if (operation) {
            console.log('operation: ', operation);
        }

        if (body) {
            console.log('\n data: ', this.prettifyText(body));
        }

        if (requestBody) {
            console.log('\n requestBody: ', this.prettifyText(requestBody));
        }

        if (!(code && body && requestBody) && action != 'deploy') {
            console.log(error);
        }

        console.log('\n');
    },
    updateArgs(args) {
        const lastArg = args[args.length - 1];

        if (typeof lastArg === 'object' && !Array.isArray(lastArg)) {
            args.pop()
        }
    },
    isJobLogDirExists() {
        const workSpace = WorkSpace.isWorkSpace('');
        return fs.existsSync(Config.getProcessLogDir(workSpace));
    },
    isJobLogPathExists() {
        const workSpace = WorkSpace.isWorkSpace('');
        return fs.existsSync(Config.getJobLogPath(workSpace));
    },
    prettifyText(text) {
        return JSON.stringify(JSON.parse(text), null, 4);
    },
}

module.exports = Logger;
