
const path = require('path');
const fs = require('fs');
const Module = require('module');
const vm = require('vm');

const { dynamicRequire } = require('../DynamicRequire');
const Artifacts = require('../Artifacts');
const PromiseWrapper = require('./PromiseWrapper');
const Params = require('../Params');

const RequireWrapper = {
    async require(file, options) {
        const fn = this.requireWithContext(file, options);

        const unRunnable = !fn || !fn.length || fn.length === 0;

        if (unRunnable) {
            const msg = `Script '${file}' invalid or does not take any parameters`;
            console.error(msg);
            process.exit(0);
        }
        try {
            const sharedParams = Params.getInstance();
            return await fn(options.context.deployer, sharedParams.getObj());
        } catch (error) {
            console.log(`ERROR HANDLING: ${file}`);
            console.error(error);
        }
    },
    requireFile(file, options) {
        if (path.isAbsolute(file)) {
            file += '.js';
        }
        return this.requireWithContext(file, options);
    },
    requireWithContext(file, options) {
        options = options || {};

        const source = fs.readFileSync(file, 'utf8');

        // Modified from truffle
        // Modified from here: https://gist.github.com/anatoliychakkaev/1599423
        const m = new Module(file);

        let context = {
            __dirname: path.dirname(file),
            __filename: file,
            Buffer,
            console,
            exports,
            global,
            process,
            module: m,
            artifacts: Artifacts,
            Promise: PromiseWrapper,
            require: (pkgPath) => {
                // Simulate a full require function for the file.
                pkgPath = pkgPath.trim();

                // If absolute, just require.
                if (path.isAbsolute(pkgPath)) {
                    return this.requireFile(pkgPath, options);
                }

                // If relative, it's relative to the file.
                if (pkgPath[0] === '.') {
                    return this.requireFile(path.join(path.dirname(file), pkgPath), options);
                } else {
                    // Not absolute, not relative, must be a globally or locally installed module.
                    // Try local first.
                    // Here we have to require from the node_modules directory directly.

                    let moduleDir = path.dirname(file);
                    while (true) {
                        try {
                            return dynamicRequire(path.join(moduleDir, 'node_modules', pkgPath));
                        } catch (e) {
                            // Ignore.
                        }
                        const oldModuleDir = moduleDir;
                        moduleDir = path.join(moduleDir, '..');
                        if (moduleDir === oldModuleDir) break;
                    }

                    if (pkgPath === 'fs') return fs;
                    // Try global, and let the error throw.
                    return dynamicRequire(pkgPath);
                }
            }
        };

        // Now add contract names.
        Object.keys(options.context || {}).forEach(key => {
            context[key] = options.context[key];
        });

        const old_cwd = process.cwd();

        process.chdir(path.dirname(file));

        const script = vm.createScript(source, file);
        script.runInNewContext(context);

        process.chdir(old_cwd);

        return m.exports;
    },
}

module.exports = RequireWrapper;
