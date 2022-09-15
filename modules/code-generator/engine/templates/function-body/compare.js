const compare = {
    functionName() {
        return `compareOperation`;
    },
    compareOperationTemplate() { return`
    /**
    * @notice Compare operation
    */
    function ${compare.functionName()}{i}(
        bytes32[] memory inputKeys,
        bytes32[] memory inputKeysValues,
        bytes32 externalCallsSession
    )
        internal
        returns (
            PolicyResult res{i},
            string memory error,
            bytes32 requestId{i}
        )
    {
        Value memory value{i};
        string memory errorCode{i};
        bool isNull{i};
        (, value{i}, isNull{i}, errorCode{i}, requestId{i}) = IComplianceOracle(_complianceOracle).requestValue(
            bytes32(0x{propertyId}),
            inputKeys,
            inputKeysValues,
            address(this),
            externalCallsSession
        );

        {compareOperationValueToCompare}
        {compareOperationResult}
        if (res{i} == PolicyResult.False) {
            {if error}
            error = "{error}";
            {else}
            error = "";
            {/if}
            
        }
        return (res{i}, error, requestId{i});
    }`;
    },
    compareOperationValueToCompare1Bytes() { return `bytes memory valueToCompare{i} = new bytes(1);
        valueToCompare{i} = hex"{valueToCompare}";
        `;
    },
    compareOperationValueToCompare32Bytes() { return `bytes memory valueToCompare{i} = new bytes(32);
        valueToCompare{i} = hex"{valueToCompare}";
        `;
    },
    compareOperationResultTemplate() {return `
        if (value{i}.value.length == 0) {
            {if notEqual}
            PolicyResult r = PolicyResult.True;
            {else}
            PolicyResult r = PolicyResult.False;
            {/if}
            {if error}
            return (
                r,
                "{error}",
                requestId{i}
            );
            {else}
            return (
                r,
                "",
                requestId{i}
            );
            {/if}
        }

        {if notEqual}
        res{i} = valueToCompare{i}.{compareOperation}(value{i}.value[0]) == PolicyResult.True ? PolicyResult.False : PolicyResult.True;
        {else}
        res{i} = valueToCompare{i}.{compareOperation}(value{i}.value[0]);
        {/if}
        `;
    },
    compareOperationMoreLessTemplate() {return `
        if (value{i}.value.length == 0) {
            return (
                PolicyResult.False,
                "Can't compare an empty value",
                requestId{i}
            );
        }

        {if less}
        res{i} = valueToCompare{i}.{compareOperation}(value{i}.value[0]) == PolicyResult.True ? PolicyResult.False : PolicyResult.True;
        {else}
        res{i} = valueToCompare{i}.{compareOperation}(value{i}.value[0]);
        {/if}
    `}
};

module.exports = compare;