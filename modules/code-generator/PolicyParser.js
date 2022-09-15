/**
 * Policy parser
 * const numberOfTheRulesSets = PolicyParser.getNumber(policy, PolicyParser.u(1));
 * const processedPolicy = PolicyParser.processRulesSets(policy, numberOfTheRulesSets);
 * console.log(JSON.stringify(processedPolicy, null, 4));
 */
const PP = {
    /**
     * Updates offset
     * @param {uint} shift Offsets shift
     */
    u(shift) {
        if (typeof this.offset === 'undefined') this.offset = 2;
        let old = this.offset;
        this.offset += shift * 2;
        return old;
    },
    /**
     * Cut provided number of bytes from the policy
     * @param {string} policy Policy to be processed
     * @param {uint} o Current offset in the policy
     * @param {uint} numberOfBytes Number of bytes to be selected from the policy
     */
    getFromThePolicy(policy, o, numberOfBytes) {
        let result = "";
        for (let i = 0; i < numberOfBytes; i++) {
            result += policy[o++];
            result += policy[o++];
        }
        return result;
    },
    /**
     * Converts from the hex to the number
     * @param {string} policy Policy to be processed
     * @param {uint} o Current offset in the policy
     */
    getNumber(policy, o) {
        let hexString = this.getFromThePolicy(policy, o, 1);
        return parseInt(hexString, 16);
    },
    /**
     * Starting policy processing from the top level rules sets
     * @param {string} policy Policy to be processed
     */
    processRulesSets(policy, numberOfTheRulesSets) {
        let rulesSets = [];
        let conditions = [];
        for (let i = 0; i < numberOfTheRulesSets; i++) {
            let numberOfTheSubRulesSets = PP.getNumber(policy, PP.u(1));
            if (numberOfTheSubRulesSets > 0) {
                return this.processRulesSets(policy, numberOfTheSubRulesSets);
            }

            let result = this.processRulesSet(policy);
            let hasError = PP.getNumber(policy, PP.u(1));
            let error = "";
            if (hasError) {
                error = this.getFromThePolicy(policy, PP.u(32), 32);
            }
            if (i + 1 < numberOfTheRulesSets) {
                conditions.push(PP.getNumber(policy, PP.u(1)))
            }
            rulesSets.push({
                rulesSetError: error,
                internalOperations: result,
            });
        }

        return {rulesSets: rulesSets, conditions: conditions};
    },
    /**
     * Process particular rules set by current offest index
     * @param {string} policy Policy to be processed
     */
    processRulesSet(policy) {
        return {compareOperations: this.processCompareOperations(policy)};
    },
    /**
     * Process compare operations in the policy by current offset
     * @param {string} policy Policy to be processed
     */
    processCompareOperations(policy) {
        let numberOfTheCompareOperations = PP.getNumber(policy, PP.u(1));
        let operations = [];
        let conditions = [];
        for (let i = 0; i < numberOfTheCompareOperations; i ++) {
            let compareOperationType = PP.getNumber(policy, PP.u(1));
            let property = this.getFromThePolicy(policy, PP.u(32), 32);
            let valueToBeCompared = this.getFromThePolicy(policy, PP.u(32), 32);
            let hasError = PP.getNumber(policy, PP.u(1));
            let error = "";
            if (hasError) {
                error = this.getFromThePolicy(policy, PP.u(32), 32);
            }
            if (i + 1 < numberOfTheCompareOperations) {
                conditions.push(PP.getNumber(policy, PP.u(1)))
            }
            operations.push({
                compareOperationType: compareOperationType,
                property: property,
                valueToBeCompared: valueToBeCompared,
                error: error
            });
        }
        return {operations: operations, conditions: conditions};
    }
}

module.exports = PP;