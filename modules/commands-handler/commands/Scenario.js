const Config = require('../../Config');
const Command = require('./Command');
const CommandConfig = require('../command-config/CommandConfig');

class Scenario extends Command {
    async run(scenarioConfig, ditectory, supportedCommands) {
        const configFile = Config.readConfigFile();
        const commands = configFile.scenarios[scenarioConfig.options.run];

        for (let i = 0; i < commands.length; i++) {
            let commandsToRun = commands[i];
            if (!!scenarioConfig.commandOptions) {
                commandsToRun = commandsToRun.concat(scenarioConfig.commandOptions);
            }
            await this.runCommand(commandsToRun, supportedCommands);
        }
    }
    async runCommand(args, supportedCommands) {
        if (!supportedCommands[args[0]]) {
            throw new Error(`
                Command "${args[0]}" not found.
            `);
        }

        const command = new supportedCommands[args[0]]();
        const commandConfig = CommandConfig.getConfig(
            args.slice(1),
            command.getRequiredOptions(),
        );

        await command.run(commandConfig, Config.getDirectory());
    }
    getRequiredOptions() {
        return ['run'];
    }

}

module.exports = Scenario;
