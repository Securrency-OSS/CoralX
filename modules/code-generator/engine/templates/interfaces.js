const interfaces = `
/**
* @title Compliance oracle storage getters interface
*/
interface IComplianceOracle {
    /**
    * @notice Requests attestation property
    * @notice if property has external data source
    * @param propertyId [required] Property unique identifier
    * @param inputKeys [optional] Values keys that can be provided with transaction
    * @param inputKeysValues [optional] Values by keys that can be provided with transaction
    * @param callbackAddress [required] Address where result will be send
    * @param externalCallsSession [optional] Current external calls session (if empty and value has policy source - a new one will be generated)
    * @return valueDataType Data type of the property value
    * @return value Value of the property
    * @return isNull Boolean flag - true if value is Null
    * @return errorCode Error code for policy type
    * @return requestId External calls session id or external call id. Session id generated if needed (existing external calls and empty input session id)
    */
    function requestValue(
        bytes32 propertyId,
        bytes32[] calldata inputKeys,
        bytes32[] calldata inputKeysValues,
        address callbackAddress,
        bytes32 externalCallsSession
    )
        external
        payable
        returns (
            DataType valueDataType,
            Value memory value,
            bool isNull,
            string memory errorCode,
            bytes32 requestId
        );
}

interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * \`interfaceId\`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
* @title Interface of the policy
*/
interface IPolicy {
    /**
    * @notice Verify policy and returns a result
    * @param inputKeys [optional] Values keys that can be provided with transaction
    * @param inputKeysValues [optional] Values by keys that can be provided with transaction
    * @param callbackAddress [required] Address where result will be send
    * @param externalCallsSession [optional] Current external calls session (if empty and value has policy source - a new one will be generated)
    */
    function verifyPolicy(
        bytes32[] calldata inputKeys,
        bytes32[] calldata inputKeysValues,
        address callbackAddress,
        bytes32 externalCallsSession
    )
        external
        returns (PolicyResult, string memory);

    /**
    * @return number of external calls (includes subpolicy) in policy
    */
    function getExternalCallsTotal() external view returns (uint);
}`;

module.exports = interfaces;