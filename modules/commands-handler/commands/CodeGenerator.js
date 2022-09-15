const Command = require('./Command');
const Generator = require('../../code-generator/Generator');
const Provided = require('../../Provider');

/**
 * @fileoverview The policy code generator command
 * @namespace coralXCommands CoralX commands
 */
class CodeGenerator extends Command {
    /**
     * Run command
     * @param {object} config Command configurations
     */
    async run(config) {
        await Provided.initializeNetworkId();
        Generator.generate(config.options.policy);
    }
    /**
     * Returns a list of the required options
     */
    getRequiredOptions() {
        return ['policy'];
    }
}

module.exports = CodeGenerator;
