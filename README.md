# CoralX

[![npm](https://img.shields.io/npm/v/coral-x-fe.svg)](https://www.npmjs.com/package/coral-x-fe)
[![npm](https://img.shields.io/npm/dm/coral-x-fe.svg)](https://www.npmjs.com/package/coral-x-fe)
[![GitHub Discussions](https://img.shields.io/static/v1?label=Join&message=Discussions&color=3fe0c5)](https://github.com/Securrency-OSS/CoralX/discussions)

## Table of contents

- [CoralX](#coralx)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Install](#install)
  - [Quick start](#quick-start)
    - [coralX-config.js](#coralx-configjs)
    - [coralX-scenarios.js](#coralx-scenariosjs)
    - [Compilation](#compilation)
    - [Scenario file structures](#scenario-file-structures)
    - [Tests](#tests)
  - [Contributing](#contributing)
  - [Advanced Usage](#advanced-usage)
    - [Execute](#execute)
    - [Scenario](#scenario)
    - [Test](#test)
    - [Skip compilation](#skip-compilation)
    - [Skip already executed transactions](#skip-already-executed-transactions)
    - [Publish failed transactions](#publish-failed-transactions)
    - [Specify path](#specify-path)
    - [Functions finder](#functions-finder)
  - [Contributors:](#contributors)
  - [License](#license)

## Overview

A simple tool for Solidity smart contracts deployment and testing that provides next capabilities:

- [x] Built-in smart contract compilation (Module from the [Truffle](https://github.com/trufflesuite/truffle)).
- [x] Automated contract testing with Mocha and Chai.
- [x] Scriptable framework for the smart contracts deployment and configuration.
- [x] Network management for deploying to many public & private networks.

CoralX features plan:
- [ ] Init script
- [ ] Console log from Solidity code
- [ ] Bundled local development blockchain server
- [ ] Multiple compiler versions support
- [ ] ... any good ideas are welcome!

CoralX is designed to be used for the development of big projects.
It was tested on a project with 400+ smart contracts and long setup scripts.

It has functionality for saving the state of the deployment, so if it fails on some step - it is possible to continue it from the moment it ended.

CoralX is also designed to make it possible to deploy a smart contract to the network with any address prefixes (originally, it was made to support [XDC network](https://explorer.xinfin.network/) with `xdc` prefix instead of `0x`, but it may be used with any networks prefixes).

## Install

```sh
# Install nodejs:

$ sudo apt install nodejs

# Install npm:

$ sudo apt install npm

# Install CoralX
$ npm install -g coral-x-fe
```

## Quick start

In your project you need to create 2 files: coralX-config.js and coralX-scenarios.js.

### coralX-config.js
```sh
$ touch coralX-config.js
```

This file contains local coralX configuration: networks, compiler, scenarios, etc.

Example:
```js
const fs = require("fs");
const path = require("path");

module.exports = {
  networks: {
    development: {
      host: "http://127.0.0.1:8545",
    },
    mainnet: {
      host: "https://mainnet.infura.io/v3/YOUR_API_KEY",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: "0x3b9aca00",
    },
    gorli: {
      host: "https://goerli.infura.io/v3/YOUR_API_KEY",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: "0x3b9aca00",
    },
    xdc: {
      host: "https://rpc.xinfin.network",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: "0x3b9aca00",
    },
    apothem: {
      host: "https://rpc.apothem.network",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: "0x3b9aca00",
    },
    fromEnv: {
      host: process.env.ETH_HOST, // export ETH_HOST=...
      private_key: process.env.ETH_PK, // export ETH_PK=...
      gasPrice: process.env.GAS_PRICE, // export GAS_PRICE=...
    },
  },
  compilers: {
    solc: {
      version: "^0.8.0",
    },
  },
  scenarios: require("./coralX-scenarios"),
  testsDir: path.join("scripts", "tests"),
}
```

Please configure private key you will use for deployments:
```sh
$ echo -n "PRIVATE_KEY" > privateKey
```

### coralX-scenarios.js
```
$ touch coralX-scenarios.js
```

This file contains scenarios for deployment.
Scenario `migrateAndConfigureForTests` is default one and used in tests deployments flow.

In the example below you can see how the deployment scenarios may be described.

Each step in scenarios is the execution of coralX command:
```sh
$ coralX execute --path PATH --network NETWORK
```

In scenarios this command is described as:
```
['execute', '--path', 'PATH', '--network', 'NETWORK']
```

Example:
```js
module.exports = {
  deployMainnet: [
    ['execute', '--path', 'scripts/migrations', '--network', 'mainnet'],
    ['execute', '--path', 'scripts/configurations', '--network', 'mainnet'],
    ['execute', '--path', 'scripts/custom', '--network', 'mainnet'],
  ],
  deployGorli: [
    ['execute', '--path', 'scripts/migrations', '--network', 'gorli'],
    ['execute', '--path', 'scripts/configurations', '--network', 'gorli'],
    ['execute', '--path', 'scripts/custom', '--network', 'gorli'],
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations', '--network', 'apothem'],
    ['execute', '--path', 'scripts/configurations_xdc', '--network', 'apothem'],
    ['execute', '--path', 'scripts/custom_xdc', '--network', 'apothem'],
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations', '--network', 'xdc'],
    ['execute', '--path', 'scripts/configurations_xdc', '--network', 'xdc'],
    ['execute', '--path', 'scripts/custom_xdc', '--network', 'xdc'],
  ],
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations'],
    ['execute', '--path', 'scripts/configurations'],
    ['execute', '--path', 'scripts/tests_configurations'],
  ],
}
```

### Compilation

Run:

```sh
$ coralX compile
```

### Scenario file structures

Example of smart contract deployment (used proxy patterned smart contracts where Implementation address is constructor argument for Proxy smart contract: `constructor(address implementation`)):

```
const Proxy = artifacts.require('./Proxy.sol');
const Implementation = artifacts.require('./Implementation.sol');

module.exports =  async function(deployer) {
    // Deploying Implementation smart contract
    await deployer.deploy(Implementation, { gas: 25000000 });
    await deployer.deploy(Proxy, Implementation.address, { gas: 1000000 });
};
```

Example of calling deployed smart contract for initialization:

```
const Proxy = artifacts.require('./Proxy.sol');
const IImplementationInterface = artifacts.require('./IImplementationInterface.sol');

module.exports =  async function(deployer) {
    const proxy = await IImplementationInterface.at(Proxy.address);

    await proxy.initialize(..., { gas: 120000000 });
};
```

### Tests

CoralX isn't bundled with a local development blockchain server.
We recommend you install [ganache](https://github.com/trufflesuite/ganache) for this:

```sh
$ npm install -g ganache-cli
```

And run it with predefined accounts

```sh
$ ganache-cli -m "YOUR_MNEMONIC" --gasLimit 12500000
```

We recommend to use `./scripts/tests` folder for tests. It is configurable as `testsDir` in coralX-config.js

Test file has following structure:
```js
describe('Test cases set', () => {

    before(async () => {
        
    });

    describe("Test case", async() => {

    });
});
```

Test semantics is the same as scenarios.

## Contributing

We are welcoming your contribution. To get started you need to fork the repo, clone it and run:

```sh
# Install dependencies

$ npm install

# Run build step to generate artifacts

$ npm run build

# Run link step for access to local registry

$ npm link

# Permission for distribution folder

$ chmod +x ./dist/coralX.build.js
```

Please make pull requests against `dev`.

## Advanced Usage

### Execute

```
$ coralX execute
```
Executes script in the prepared context. Scripts can do smart contracts deployment, perform calls to the smart contracts, do any custom logic

Supports next options:

+ `--path`: a relative path where the script is located
```
// this command will execute scripts in the specified folder
--path PATH
Example:
$ coralX execute --path scripts/migrations
```
+ `--params`: a custom input parameters for the scripts
```
// --params issuer=0xA3E48...7bA4a,issuerPropertyId=0x1bea5a...a8de
// you can access these parameters in the script via `params`
// params = {issuer: 0xA3E48...7bA4a, issuerPropertyId: 0x1bea5a...a8de}

// in the script
module.exports = async (_, params) => {};

Example:
$ coralX execute --path scripts/custom/add-system-role.js --params issuer=0xA3E48...7bA4a,issuerPropertyId=0x1bea5a...a8de
```
+ `--network`: a target network specification (by default localhost)
```
// you need to specify network from the coralX-config.js
-- network gorli

Example:
$ coralX execute --path scripts/migrations --network gorli
```
+ `--output`: if script returns something it will be saved into the appropriate
file in the build/custom-scripts-output folder
```
Example:
$ coralX execute --path scripts/custom/white-list-setup.js --network gorli --output
```
### Scenario
```
$ coralX scenario
```
Executes scenario from the coralX-config.js file.

Supports next options:

+ `--run`: specifies scenario that will be executed
```
Scenario example:
deployGorli: [
    ["execute", "--path", "scripts/migrations", "--network", "gorli"],
    ["execute", "--path", "scripts/configurations", "--network", "gorli"],
    ["execute", "--path", "scripts/custom/some-setup-script.js", "--network", "gorli"],
    ]
```
```
Example:
$ coralX scenario --run deployGorli
```

### Test
```
$ coralX test
```
Designed to run smart contracts test with Mocha and Chai

Requires additional configuration in the coralX-config.js. 
+ Before each execution it will run scenario `migrateAndConfigureForTests`. The smart contract build that will be created during this scenario will be used during tests.
+ It is required to specify in the coralX-config.js tests directory: `testsDir: path.join("scripts", "tests")`

### Skip compilation

`--skip_compile true`: designed to skip smart contracts compilation each time when you are running tests. Very often we are working on tests without any changes from the smart contracts side and we do not need to do a compilation. Specifying this flag coralX will compile smart contracts once and will use the prepared build for all next tests.

### Skip already executed transactions

`--use_snapshot true`
When running tests:
Designed to skip execution of the scenario `migrateAndConfigureForTests` each time when you are running tests. Very often we are working on tests without any changes from the smart contracts and migrations/configurations side and we don"t need to repeat these steps each time. Specifying this flag coralX will execute `migrateAndConfigureForTests` once and will create a snapshot. Next time when you will run tests with this flag coralX will revert the blockchain state to the snapshot.

When running deployment:
Designed to skip execution of already executed successful transaction.

### Publish failed transactions
a
`--publish_failed_tx true`: with this option, coralX will publish all transactions that will fail and log their tx hash. The tx hash can be used for debugging.

### Specify path

`--path`: provides the possibility to specify a particular directory for tests execution
```
Example:
$ coralX test --path test_file.js --skip_compile true --use_snapshot true

// if we configured testsDir:scripts/tests, command above will execute test in the scripts/tests/test_file.js
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

## Contributors:

- Ihor Yermakov (https://github.com/IhorYermakovSecurrency)
- Denis Slaschilin (https://github.com/DenisSlaschilinDevPro)
- Anton Grigorev (https://github.com/BaldyAsh)
- Zachary Short (https://github.com/ztshort)

## License

[MIT](./LICENSE)
