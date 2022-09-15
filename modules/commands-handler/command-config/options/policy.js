const fs = require('fs');

module.exports = {
    validator: (policy) => {
        if (!fs.existsSync(policy)) {
            let withJS = policy;
            if (!policy.includes('.js')) {
                withJS += '.js';
            }
            if (!fs.existsSync(withJS)) {
                throw new Error(`
                    Policy: '${policy}' doesn't exists
                `);
            }
        }
    }
};
