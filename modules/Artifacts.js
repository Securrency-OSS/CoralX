const path = require('path');

const Artifact = require('./Artifact');
const WorkSpace = require('./Workspaces');
const Config = require('./Config');

const Artifacts = {
    require(file) {
        this.artifacts = this.artifacts || {};
        let currentArtifact = this.artifacts[file];

        if (!currentArtifact) {
            let workspace = WorkSpace.isWorkSpace(file);
            if (!workspace.status) {
                if (path.extname(file) !== '.sol') {
                    file += '.sol'
                    workspace = WorkSpace.isWorkSpace(file);
                }
            }

            Artifact.file = workspace.path;
            Artifact.workSpace = workspace;

            currentArtifact = {...Artifact};
            if (workspace.status) currentArtifact.setBuildDir(path.join(
                Config.getBuildDir(workspace),
                'contracts'
            ));
            
            currentArtifact.setAddressFromABI();

            const {ast, abi} = currentArtifact.getAbiFile();
            currentArtifact = {...currentArtifact, ast, _json: {abi}};
        }

        return currentArtifact;
    },
    getAddressFromABI(fileName) {
        const currentArtifact = {...Artifact, fileName};
        return currentArtifact.getAddressFromABI();
    },
    async initializeInterfaceAt(interfaceName, contract) {
        if (path.extname(interfaceName) !== '.sol') interfaceName += '.sol';
        
        let contractAddress = contract;
        if (!web3.utils.isAddress(contract)) {
            if (path.extname(contract) !== '.sol') contract += '.sol';
            contractAddress = (this.require(contract)).address;
        }
        const interfaceInstance = this.require(interfaceName);

        return await interfaceInstance.at(contractAddress);
    }
}

module.exports = Artifacts;
