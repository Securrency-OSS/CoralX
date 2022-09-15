const crypto = require('crypto');
global.crypto = crypto.webcrypto;

const CoralXApp = require('./modules/CoralXApp');
const ErrorsCounter = require('./modules/ErrorsCounter');

global.fetch = require('node-fetch').default;

async function f() {
    try {
        await CoralXApp.process(process.argv.slice(2), process.cwd());
        process.exit(ErrorsCounter.errorsCount() > 0 ? 1 : 0);
    } catch(err) {
        console.log(err);
        process.exit(1);
    }   
}

f();
