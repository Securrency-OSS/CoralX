# CoralX
A simple tool for Ethereum smart contracts deployment and testing that provides next capabilities:

* Built-in smart contract compilation (Module from the [Truffle](https://github.com/trufflesuite/truffle)).
* Automated contract testing with Mocha and Chai.
* Scriptable framework for the smart contracts deployment and configuration.
* Network management for deploying to many public & private networks.

## Install

### NPM
```
$ npm install -g coral-x
```

### Local on MacOS/Linux

```bash

# Install nodejs:

$ sudo apt install nodejs

# Install npm:

$ sudo apt install npm

# Install local node dependencies:

$ npm install

# Run build step to generate artifacts

$ npm run build

# Run link step for access to local registry

$ npm link

# Permission Distribution folder

$ chmod +x ./dist/coralX.build.js

```

## Usage
In the smart contracts project you can run:

### Compile
```
$ coralX compile
```
There are no additional options for the command configuration yet.

### Execute
```
$ coralX execute
```
Executes script in the prepared context. Scripts can do smart contracts deployment, perform calls to the smart contracts, do any custom logic

Supports next options:

+ `--path`: a relative path where the script is located
```
// this command will execute scripts in the scripts/migrations folder
--path scripts/migrations
Example:
$ coralX execute --path scripts/migrations
```
+ `--params`: a custom input parameters for the scripts
```
// --params issuer=0xA3E48...7bA4a,issuerPropertyId=0x1bea5a...a8de
// you can access this parameters in the script via `params`
// params = {issuer: 0xA3E48...7bA4a, issuerPropertyId: 0x1bea5a...a8de}

// in the script
module.exports = async (_, params) => {};

Example:
$ coralX execute --path scripts/custom/add-system-role.js --params issuer=0xA3E48...7bA4a,issuerPropertyId=0x1bea5a...a8de
```
+ `--network`: a target network specification (by default localhost)
```
// you need to specifi network from the coralX-config
-- network ropsten

Example:
$ coralX execute --path scripts/migrations --network ropsten
```
+ `--output`: if script returns something it will be saved into the apropriate
file in the build/custom-scripts-output folder
```
Example:
$ coralX execute --path scripts/custom/white-list-setup.js --network ropsten --output
```
### Scenario
```
$ coralX scenario
```
Executes scenario from the coralX-config.js file.

Supports next options:

+ `--run`: specifies scenarion that will be executed
```
Scenario example:
deployRopsten: [
        ['execute', '--path', 'scripts/migrations/compliance-upgradability', '--network', 'ropsten'],
        ['execute', '--path', 'scripts/migrations/tokens-creation-service', '--network', 'ropsten'],
        ['execute', '--path', 'scripts/migrations/asset-composer', '--network', 'ropsten'],
        ['execute', '--path', 'scripts/configurations', '--network', 'ropsten'],
        ['execute', '--path', 'scripts/asset-composer', '--network', 'ropsten'],
        ['execute', '--path', 'scripts/custom/white-list-setup.js', '--network', 'ropsten'],
      ]
```
```
Example:
$ coralX scenario --run deployRopsten
```

### Test
```
$ coralX test
```
Designed to run smart contracts test with Mocha and Chai

Requires additional configuration in the coralX-config.js. 
+ Before each execution it will run scenario `migrateAndConfigureForTests`. The smart contract build that will be created during this scenario will be used during tests.
+ It is required to specify in the coralX-config.js tests directory: `testsDir: path.join("scripts", "tests")`

Supports next options:

+ `--skip_compile true`: designed to skip smart contracts compilation each time when you are running tests. Very often we are working on tests without any changes from the smart contracts side and we do not need to do a compilation. Specifying this flag coralX will compile smart contracts once and will use the prepared build for all next tests.
+ `--use_snapshot true`: designed to skip execution of the scenario `migrateAndConfigureForTests` each time when you are running tests. Very often we are working on tests without any changes from the smart contracts and migrations/configurations side and we don't need to repeat these steps each time. Specifying this flag coralX will execute `migrateAndConfigureForTests` once and will create a snapshot. Next time when you will run tests with this flag coralX will revert the blockchain state to the snapshot.
+ `--publish_failed_tx true`: with this option, coralX will publish all transactions that will fail and log their tx hash. The tx hash can be used for debugging.
+ `--path`: provides the possibility to specify a particular directory for tests execution
```
Example:
$ coralX test --path asset-composer --skip_compile true --use_snapshot true

// if we configured testsDir:scripts/tests, command above will execute test in the scripts/tests/asset-composer folder
```
### Functions finder
```
coralX fnFinder
```
Allows to find a function by smart contract address and method signature

Supports next options:
+ `--path`: directory where abi files are located
+ `--data`: data parameter in the next format `<smart_contract_address>::<method_signature>` where `<smart_contract_address>` is a smart contract address and `method_signature` signature of the method to be finded

Example:
```
coralX fnFinder --path <build_folder_path> --data <smart_contract_address>::<method_signature>
coralX fnFinder --path <build_folder_path> --data <method_signature>
```