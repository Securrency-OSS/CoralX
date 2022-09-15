const library = `library ComparisonOperations {
    function isEqual(bytes memory value1, bytes memory value2) internal pure returns (PolicyResult) {
        return keccak256(value1) == keccak256(value2) ? PolicyResult.True : PolicyResult.False;
    }
    function convertToUint(bytes memory v1, bytes memory v2) internal pure returns (uint r1, uint r2) {
        assembly {
            r1 := mload(add(v1, 0x20))
            r2 := mload(add(v2, 0x20))
        }
    }
    function convertToInt(bytes memory v1, bytes memory v2) internal pure returns (int r1, int r2) {
        assembly {
            r1 := mload(add(v1, 0x20))
            r2 := mload(add(v2, 0x20))
        }
    }
    function moreThenUint(bytes memory value1, bytes memory value2) internal pure returns (PolicyResult) {
        (uint v1, uint v2) = convertToUint(value1, value2);
        return v1 < v2 ? PolicyResult.True : PolicyResult.False;
    }
    function moreThenInt(bytes memory value1, bytes memory value2) internal pure returns (PolicyResult) {
        (int v1, int v2) = convertToInt(value1, value2);
        return v1 < v2 ? PolicyResult.True : PolicyResult.False;
    }
}`;

module.exports = library;
