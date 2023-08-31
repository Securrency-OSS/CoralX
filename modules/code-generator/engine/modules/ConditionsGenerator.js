const whiskers = require("whiskers"); // https://github.com/gsf/whiskers.js

const artifacts = require("../../../Artifacts");
const compareTemplates = require("../templates/function-body/compare");

class ConditionsGenerator {
    constructor() {
        this.compareOperationsCount = 0;
        this.supportedDataType = {
            uint: 1,
            int: 2,
            string: 3,
            boolean: 4,
            bytes32: 5,
        }
        this.supportedCompareOperations = {
            equal: 1,
            notEqual: 2,
            less: 3,
            more: 4,
        }
    }
    /**
     * Returns an instance of the Compliance Oracle
     */
    async getComplianceOracle() {
        if (!this.CO) {
            this.CO = await artifacts.initializeInterfaceAt("IComplianceOracleProperties", "ComplianceOracle");
        }
        return this.CO;
    }
    /**
     * Returns a property details from the compliance oracle
     * @param {string} property Property identifier without hex prefix
     */
    async getProperty(property) {
        const CO = await this.getComplianceOracle();

        let propertyDetails;
        try {
            propertyDetails = await CO.getProperties([`0x${property}`]);
        } catch (error) {
            throw new Error(`Code Generator. Unexisting property in the policy: ${property}`);
        }

        return propertyDetails;
    }
    /**
     * Returns a property data type
     * 1 - uint
     * 2 - int
     * 3 - string
     * 4 - boolean
     * 5 - bytes32
     * 
     * @param {string} property Property identifier without hex prefix
     */
    async getPropertyDataType(property) {
        const propertyDetails = await this.getProperty(property);
        return propertyDetails[0][0].dataType;
    }
    /**
     * Generates soldity code for the particular compare oparation. Example: (KYC == true)
     * @param {object} operation Compare operation details
     */
    async render(operation, renderFrontend = false) {
        let propertyDataType;
        if (renderFrontend) {
          propertyDataType = operation.type
        } else {
          propertyDataType = await this.getPropertyDataType(operation.property);
        }
        const compareOperationsCount = this.compareOperationsCount;
        let valueToCompareTpl = await this.compareOpVCompareGeneration(
            propertyDataType,
            operation.valueToBeCompared,
            compareOperationsCount
        );
        let resultTpl = await this.compareOpResGeneration(
            operation.compareOperationType,
            compareOperationsCount,
            operation.error,
            propertyDataType
        );

        this.compareOperationsCount++;
        return whiskers.render(compareTemplates.compareOperationTemplate(), {
            i: compareOperationsCount,
            propertyId: operation.property,
            compareOperationValueToCompare: valueToCompareTpl,
            compareOperationResult: resultTpl,
            error: operation.error
        });
    }
    /**
     * Generates peace of the solidity code that will describe a value for comparison
     * @param {string} dataType Value data type (depends on it will be different logic)
     * @param {string} valueToCompare Value to be compared
     * @param {number} i Index of the current operation (provides uniqueness for solidity variables)
     */
    async compareOpVCompareGeneration(dataType, valueToCompare, i) {
        switch(dataType) {
            case this.supportedDataType.boolean:
                let value = valueToCompare ? '01' : '00';
                return whiskers.render(
                    compareTemplates.compareOperationValueToCompare1Bytes(),
                    {valueToCompare: value, i: i}
                );
            case this.supportedDataType.uint || this.supportedDataType.int || this.supportedDataType.bytes32:
                return whiskers.render(
                    compareTemplates.compareOperationValueToCompare32Bytes(),
                    {valueToCompare: valueToCompare, i: i}
                );
            default:
                throw new Error(`Unsupported data type: "${dataType}"`);
        }
    }
    /**
     * Compare operation result solidity code generation
     * @param {number} compareOperationType (1 - equal, 2 - or, 3 - more equal, 4 - less equal)
     * @param {number} i Index of the current operation (provides uniqueness for solidity variables)
     * @param {string} error Compare operation error (can be empty)
     * @param {number} propertyDataType A property data type
     */
    async compareOpResGeneration(compareOperationType, i, error, propertyDataType) {
        switch (compareOperationType) {
            case this.supportedCompareOperations.equal:
                return whiskers.render(
                    compareTemplates.compareOperationResultTemplate(),
                    { compareOperation: 'isEqual', i: i, error: error, notEqual: false }
                );
            case this.supportedCompareOperations.notEqual:
                return whiskers.render(
                    compareTemplates.compareOperationResultTemplate(),
                    { compareOperation: 'isEqual', i: i, error: error, notEqual: true }
                );
            case this.supportedCompareOperations.more:
                if (propertyDataType == this.supportedDataType.int) {
                    return whiskers.render(
                        compareTemplates.compareOperationMoreLessTemplate(),
                        { compareOperation: 'moreThenInt', i: i, error: error, less: false }
                    );
                }

                return whiskers.render(
                    compareTemplates.compareOperationMoreLessTemplate(),
                    { compareOperation: 'moreThenUint', i: i, error: error, less: false }
                );
            case this.supportedCompareOperations.less:
                if (propertyDataType == this.supportedDataType.int) {
                    return whiskers.render(
                        compareTemplates.compareOperationMoreLessTemplate(),
                        { compareOperation: 'moreThenInt', i: i, error: error, less: true }
                    );
                }

                return whiskers.render(
                    compareTemplates.compareOperationMoreLessTemplate(),
                    { compareOperation: 'moreThenUint', i: i, error: error, less: true }
                );
            default:
                throw new Error(`Unsupported operation type: "${compareOperationType}" for the data type: ${propertyDataType}`);
        }
    }
}

module.exports = ConditionsGenerator;
