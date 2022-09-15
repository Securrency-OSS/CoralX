const compare = require('./compare');

const rulesSet = {
    functionName() {
        return `processRulesSet`;
    },
    firstCondition() { return `(result, condError, requestId) = ${compare.functionName()}{i}(
                inputKeys,
                inputKeysValues,
                externalCallsSession
            );
            if (result == PolicyResult.False) {
                error = condError;
            }`},
    orCondition() { return `(result, condError, requestId) = ${compare.functionName()}{i}(
            inputKeys,
            inputKeysValues,
            externalCallsSession
        );
        if (result == PolicyResult.False) {
            {childTmpl}
        }
    `},
    andCondition() { return `(result, condError, requestId) = ${compare.functionName()}{i}(
            inputKeys,
            inputKeysValues,
            externalCallsSession
        );
        if (result == PolicyResult.True) {
            {childTmpl}
        }
    `},
    firstRulesSetCondition() { return `(result, condError) = ${this.functionName()}{i}(
            inputKeys,
            inputKeysValues,
            externalCallsSession
        );
        if (result == PolicyResult.False) {
            error = condError;
        }`},
    orRulesSetCondition() { return `(result, condError) = ${this.functionName()}{i}(
                inputKeys,
                inputKeysValues,
                externalCallsSession
            );
            if (result == PolicyResult.False) {
                {childTmpl}
            }
    `},
    andRulesSetCondition() {return `(result, condError) = ${this.functionName()}{i}(
            inputKeys,
            inputKeysValues,
            externalCallsSession
        );
        if (result == PolicyResult.True) {
            {childTmpl}
        }
    `},
    errorTemplate() { return`if (result == PolicyResult.False && bytes(condError).length == 0) {
            {if rulesSetError}
            error = "{rulesSetError}";
            {else}
            error = "";
            {/if}
        } else if (result == PolicyResult.False) {
            error = condError;
        }
    `},
    rulesSetWithErrorTemplate() { return `
    /**
    * @notice Process rules set
    */
    function ${this.functionName()}{rulesSetNumber}(
        bytes32[] memory inputKeys,
        bytes32[] memory inputKeysValues,
        bytes32 externalCallsSession
    )
        internal
        returns (PolicyResult result, string memory error)
    {
        string memory condError;
        bytes32 requestId;
        
        {comparations}
        ${this.errorTemplate()}

        return (result, error);
    }
    {functionsList}`;
    },
    rulesSetWithoutErrorTemplate() { return `
    /**
    * @notice Process rules set
    */
    function ${this.functionName()}{i}{rulesSetNumber}(
        bytes32[] memory inputKeys,
        bytes32[] memory inputKeysValues,
        bytes32 externalCallsSession
    )
        internal
        returns (PolicyResult result, string memory error)
    {
        string memory condError;
        bytes32 requestId;
        {comparations}

        return (result, error);
    }
    {functionsList}`;
    }
}

module.exports = rulesSet;