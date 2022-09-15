const config = require('./Config');
const Web3 = require('web3');

const CommandConfig = require('./commands-handler/command-config/CommandConfig');
const SUPPORTED_COMMANDS = require('./commands-handler/commands/SupportedCommands');
const WorkSpaces = require('./Workspaces');

const CoralXApp = {
    async process(args, directory) {
        if (!SUPPORTED_COMMANDS[args[0]]) {
            throw new Error(`
                Command "${args[0]}" not found.
            `);
        }
        config.setDirectory(directory);
        global.web3 = new Web3(config.read()['host']);

        WorkSpaces.init(directory);

        const command = new SUPPORTED_COMMANDS[args[0]]();
        const commandConfig = CommandConfig.getConfig(
            args.slice(1),
            command.getRequiredOptions(),
        );

        await command.run(commandConfig, directory, SUPPORTED_COMMANDS);
    }
}

module.exports = CoralXApp;
