const structs = `
/**
* @notice Data types
*/
enum DataType {
    None,
    Uint,
    Int,
    String,
    Boolean,
    Bytes32
}

/**
* @notice Policy result
*/
enum PolicyResult {
    Pending,
    True,
    False
}

/**
* @notice Internal values struct
*/
struct Value {
    bytes[] value;
    uint timestamp;
}
`;

module.exports = structs;