const path = require('path');
const fs = require('fs');

const Engine = require("./engine/Engine");
const Config = require('../Config');

const SOLIDITY_VERSION = ">=0.8.0 <0.9.0";

/**
 * Generates smart contract that represents a policy.
 * Solidity code generates from the previously prepared templates.
 */
const Generator = {
    async generate(policyPathFromConfig) {
        let policyPath = path.join(
            Config.getDirectory(),
            policyPathFromConfig
        );

        const policy = fs.readFileSync(policyPath, { encoding:'utf8' });
        if (!policy) {
            throw new Error("Provided invalid policy. Policy can't be empty");
        }

        return await (new Engine(JSON.parse(policy), SOLIDITY_VERSION)).render();
    }
}

module.exports = Generator;
