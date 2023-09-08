const template = `
// Copyright SECURRENCY INC.
// SPDX-License-Identifier: MIT
pragma solidity {solidityVersion};
{structs}
{library}
{interfaces}

/**
 * Auto generated policy for Securrency rules engine
 */
contract {contractName} is IERC165, IPolicy {
    // Define libraries
    using ComparisonOperations for *;
    // Compliance oracle address
    address internal _complianceOracle;
    // session -> condition number -> is verified
    mapping(bytes32 => mapping(uint => PolicyResult)) internal _conditionsVerified;

    constructor(address complianceOracle) {
        _complianceOracle = complianceOracle;
    }
    
    {supportsInterfaceFn}
    {getExternalCallsTotalFn}

    /**
    * @notice Verify policy and returns a result
    * @param inputKeys [optional] Values keys that can be provided with transaction
    * @param inputKeysValues [optional] Values by keys that can be provided with transaction
    * @param externalCallsSession [optional] Current external calls session (if empty and value has policy source - a new one will be generated)
    */
    function verifyPolicy(
        bytes32[] calldata inputKeys,
        bytes32[] calldata inputKeysValues,
        address, //callbackAddress
        bytes32 externalCallsSession
    )
        external
        override
        returns (PolicyResult result, string memory error)
    {
        string memory condError;
        {verifyFnBody}
        return (result, error);
    }
    {internalFunctions}
}`;

module.exports = template;