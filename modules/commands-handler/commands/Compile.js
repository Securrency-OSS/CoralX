const fs = require('fs');

const Command = require('./Command');
const appConfig = require('../../Config');
const WorkSpace  = require('../../Workspaces');

const WorkflowCompile = require('@truffle/workflow-compile');
const Config = require('@truffle/config');

class Compile extends Command {
    async run(config) {
        const workspace = WorkSpace.isWorkSpace(config.options.path || '');

        let options = {};
        options.contracts_build_directory = appConfig.getBuildContractsDir(workspace);
        options.working_directory = workspace.pkg;

        if (
            (!!config.options.skip_compile && config.options.skip_compile === 'true') ||
            (!!config.options.use_snapshot && config.options.use_snapshot === 'true')
        ) {
            if (fs.existsSync(options.contracts_build_directory)) return;
        }

        const compileConfig = Config.detect(options, appConfig.configFile());
        const compilationOutput = await WorkflowCompile.compile(compileConfig);

        return await WorkflowCompile.save(compileConfig, compilationOutput);
    }
}

module.exports = Compile;
