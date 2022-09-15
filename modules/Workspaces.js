const fs = require('fs');
const path = require('path');
const { resourceLimits } = require('worker_threads');

const { dynamicRequire } = require('./DynamicRequire');

const PKG_JSON = 'package.json';

class _WorkSpaces {
    constructor() {
        this.baseWorkSpace = '';
        this.baseWorkDir = '';
        this.baseWorkDirFiles = {};
        this.workSpace = '';
        this.workDir = '';
        this.dirLevel = 0;
        this.config = [];
        this.list = [];
    }
    init(workDir) {
        this.updateWorkSpace(workDir);

        this.baseWorkSpace = this.workSpace;
        this.baseWorkDir = this.workDir;

        const dirs = [
            path.join(workDir, PKG_JSON),
            path.join(workDir, '..', PKG_JSON),
            path.join(workDir, '..', '..', PKG_JSON),
        ]
        
        for (let i = 0; i < dirs.length; i++) {
            this.config = this.getWorkSpacesList(dirs[i]);
            this.dirLevel++;

            if (this.config.length != 0) break;
        }

        if (!this.config.length) this.dirLevel = 0;
        
        this.discover(workDir);
    }
    updateWorkSpace(workDir) {
        this.workDir = workDir;
        this.workSpace = this.getWorkSpaceName(path.join(workDir, PKG_JSON));
    }
    resetToBaseWorkSpace() {
        this.workDir = this.baseWorkDir;
        this.workSpace = this.baseWorkSpace;
    }
    getWorkSpace() {
        return this.workSpace;
    }
    getWorkDir() {
        return this.workDir;
    }
    getWorkSpacesList(packageJson) {
        try {
            const pkgJson = dynamicRequire(packageJson);
            return !!pkgJson.workspaces ? pkgJson.workspaces : [];
        } catch(err) {
            return [];
        }
    }
    getWorkSpaceName(packageJson) {
        try {
            const pkgJson = dynamicRequire(packageJson);
            return !!pkgJson.name ? pkgJson.name : '';
        } catch(err) {
            return '';
        }
    }
    discover(workDir) {
        this.discoverPackages(workDir);    
        this.discoverDirectoryStructure(workDir, 'contracts');
    }
    discoverPackages(workDir) {
        const dir = this.getPathShift(workDir);
        if (this.config.length) {
            for (let i = 0; i < this.config.length; i++) {
                let pkg = path.join(dir, this.config[i]);
                if (this.config[i][this.config[i].length-1] == '*') {
                    this.processWildcard(pkg);
                    continue;
                }
                this.processPkg(pkg);
            }
        } else {
            this.processPkg(dir);
        }
    }
    discoverDirectoryStructure(workDir, relativePath) {
        const contractsDir = path.join(workDir, relativePath);
        if (!fs.existsSync(contractsDir)) return;

        const objects = fs.readdirSync(contractsDir, { withFileTypes: true });
        objects.forEach(obj => {
            if (path.extname(obj.name) == '.sol') {
                this.baseWorkDirFiles[obj.name] = (path.join(contractsDir, obj.name)).replace(this.baseWorkDir, '');
            } else {
                this.discoverDirectoryStructure(contractsDir, obj.name);
            }
        });
    }
    processWildcard(dir) {
        const baseDir = dir.replace('*', '');
        const data = fs.opendirSync(baseDir);
        let dirent;
        while ((dirent = data.readSync()) !== null) {
            this.processPkg(path.join(baseDir, dirent.name));
        }
        data.closeSync();
    }
    processPkg(pkg) {
        const pkgName = this.getWorkSpaceName(path.join(pkg, PKG_JSON));
        if (pkgName) {
            this.list.push({path: pkg, name: pkgName});
        }
    }
    getPathShift(workDir) {
        if (this.dirLevel == 0) return workDir;

        let shiftArray = [workDir];
        for (let i = 0; i < this.dirLevel - 1; i++) {
            shiftArray.push('..');
        }

        return path.join(...shiftArray);
    }
    isWorkSpace(artifactPath) {
        let result = this.searchWorkSpace(artifactPath);

        if (!result.status) {
            result = this.searchWorkSpace(path.join(this.workSpace, artifactPath));
        }

        if (!result.status) {
            result = this.searchWorkSpace(path.join(this.workSpace, 'contracts', artifactPath));
        }

        if (!result.status && path.extname(artifactPath) === '.sol' && this.baseWorkDirFiles[artifactPath]) {
            result = this.searchWorkSpace(path.join(this.workSpace, this.baseWorkDirFiles[artifactPath]));
            if (!result.status) {
                console.log(`No found: ${artifactPath}`);

            }
        }

        return result;
    }
    searchWorkSpace(artifactPath) {
        let result = {status: false};
        for (let i = 0; i < this.list.length; i++) {
            let data = {};
            let searchResult = artifactPath.search(this.list[i].name);
            if (searchResult == 0) {
                data.name = this.list[i].name;
                data.pkg = this.list[i].path;
                data.relativePath = artifactPath.substr(this.list[i].name.length+1);
                data.path = path.join(this.list[i].path, data.relativePath);
                data.status = true;

                if (fs.existsSync(data.path)) {
                    return data;
                }
            }
        }
        return result;
    }
}

class WorkSpaces {
    static getInstance() {
        if (!this.instance) {
            this.instance = new _WorkSpaces();
        }
        return this.instance;
    }
}

module.exports = WorkSpaces.getInstance();
