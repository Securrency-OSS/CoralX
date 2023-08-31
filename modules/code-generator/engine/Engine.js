const whiskers = require("whiskers"); // https://github.com/gsf/whiskers.js
const interfaces = require("./templates/interfaces");
const structs = require("./templates/structs");
const template = require("./templates/main");
const library = require("./templates/library");

const getExternalCallsTotalFn = require("./templates/functions/getExternalCallsTotal");
const supportsInterfaceFn = require("./templates/functions/supportsInterface");

const artifacts = require("../../Artifacts");

const RulesSetsGenerator = require("./modules/RulesSetsGenerator");

/**
 * Generates smart contract that represents a policy.
 * Solidity code generates from the previously prepared templates.
 */
class Engine {
  /**
   * Defines some counters and starts policy code generation
   * @param {object} policy Policy converted from the raw bytes to the object via Policy Parser module
   * @param {string} solidityVersion Example: >=0.8.0 <0.9.0. Will be added at the top of the file
   */
  constructor( policy, solidityVersion ) {
    this.policy = policy;
    this.solidityVersion = solidityVersion;
    this.rulesSetsGenerator = new RulesSetsGenerator(
      // rulesSets List of the rules sets with all the details about it in the policy
      this.policy.rulesSets,
      // List of the conditions for rules sets (rulesSet1 || rulesSet2 && rulesSet3) = [||, &&]
      this.policy.conditions
    );
  }

  /**
   * Render a main template
   */
  async render() {
    const ComplianceOracle = artifacts.require("./registry-layer/compliance-oracle/ComplianceOracle.sol");

    return whiskers.render(template, {
      verifyFnBody: await this.rulesSetsGenerator.render(),
      internalFunctions: this.rulesSetsGenerator.renderInternalFunctionsList(),
      library: library,
      solidityVersion: this.solidityVersion,
      contractName: "PermissionsVerification",
      complianceOracleAddress: ComplianceOracle.address,
      interfaces: whiskers.render(interfaces),
      structs: whiskers.render(structs),
      getExternalCallsTotalFn: getExternalCallsTotalFn.render(),
      supportsInterfaceFn: supportsInterfaceFn.render(),
    });
  }

  async renderFrontend( complianceOracleAddress ) {
    return whiskers.render(template, {
      verifyFnBody: await this.rulesSetsGenerator.render(true),
      internalFunctions: this.rulesSetsGenerator.renderInternalFunctionsList(),
      library: library,
      solidityVersion: this.solidityVersion,
      contractName: "PermissionsVerification",
      complianceOracleAddress: complianceOracleAddress,
      interfaces: whiskers.render(interfaces),
      structs: whiskers.render(structs),
      getExternalCallsTotalFn: getExternalCallsTotalFn.render(),
      supportsInterfaceFn: supportsInterfaceFn.render(),
    });
  }
}

module.exports = Engine;
