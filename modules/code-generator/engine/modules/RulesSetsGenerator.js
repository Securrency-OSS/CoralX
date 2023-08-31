
const whiskers = require("whiskers"); // https://github.com/gsf/whiskers.js

const rulesSetTemplates = require("../templates/function-body/rulesSet");
const internalFunctionsTemplate = require("../templates/function-body/internalFunctionsList");
const ConditionsGenerator = require("./ConditionsGenerator");

class RulesSetsGenerator {
    /**
     * @param {array} rulesSets List of the rules sets with all the details about it in the policy
     * @param {array} conditions List of the conditions for rules sets (rulesSet1 || rulesSet2 && rulesSet3) = [||, &&]
     */
    constructor(rulesSets, conditions) {
        this.compareOperationsCount = 0;
        this.rulesSetsCount = 0;
        this.templates = [];
        this.rulesSets = rulesSets;
        this.conditions = conditions;
        this.conditionsGenerator = new ConditionsGenerator();
    }

    /**
     * Render internal functions
     */
    renderInternalFunctionsList() {
        return whiskers.render(internalFunctionsTemplate, {
            functions: this.templates,
        });
    }

    /**
     * Generates solidity code for the provided list of rules sets
     */
    async render(renderFrontend = false) {
        for (let i = 0; i < this.rulesSets.length; i++) {
            this.templates.push(
                await this.generateRulesSet(
                    this.rulesSets[i].internalOperations.compareOperations,
                    this.rulesSets[i].rulesSetError,
                    renderFrontend
                )
            );
            this.rulesSetsCount++;
        }
        
        let verifyFnBody = ``;
        for (let j = 0; j < this.templates.length; j++) {
            // Depending on the condition will be generated different logic
            // it will avoid execution of the conditions that are not required 
            // for the verification because of the policy structure
            // Example:
            // (rulesSet1 && rulesSet2 || rulesSet3)
            // if rulesSet1 == true and rulesSet2 == true execution of the rulesSet3
            // condition is not required we should skip it.
            let index = this.rulesSetsCount - j - 1;
            if (j === 0) {
                // render first condition
                verifyFnBody = whiskers.render(rulesSetTemplates.firstRulesSetCondition(), {
                    i: index,
                });
                continue;
            }
            if (this.conditions[j - 1]) {
                const tmpl = this.conditions[j-1] == 1 ? rulesSetTemplates.andRulesSetCondition() : rulesSetTemplates.orRulesSetCondition();
                verifyFnBody = whiskers.render(tmpl, {
                    i: index,
                    childTmpl: verifyFnBody,
                });
            } else {
                throw new Error('Invalid policy rules sets configuration');
            }
        }

        return verifyFnBody;
    }
    /**
     * Generates solidity code for the provided list of the rules set conditions
     * @param {array} conditions List of the conditions that preset in the rules set. Example: (KYC == true && inBlackList == false)
     * @param {string} error Rules set error message from the policy (can be empty) 
     */
    async generateRulesSet(conditions, error, renderFrontend = false) {
        let templates = [];
        let count = conditions.operations.length;
        
        // render conditions functions
        for (let i = 0; i < count; i++) {
            templates.push(
                await this.conditionsGenerator.render(conditions.operations[i], renderFrontend)
            );
            this.compareOperationsCount++;
        }

        // render rules set body
        let comparations = ``;
        for (let j = 0; j < count; j++) {
            // Depending on the compare operation type will be generated different logic
            // it will avoid execution of the conditions that are not required 
            // for the verification because of the policy structure
            // Example:
            // (KYC == true || verifiedInvestor == true)
            // if KYC == true, verifiedInvestor condition is not required we should skip it.
            if (j === 0) {
                // render first condition
                comparations = whiskers.render(rulesSetTemplates.firstCondition(), {
                    i: this.compareOperationsCount - j - 1,
                });
                continue;
            }
            if (conditions.conditions[j-1]) {
                const tmpl = conditions.conditions[j-1] == 1 ? rulesSetTemplates.andCondition() : rulesSetTemplates.orCondition();
                comparations = whiskers.render(tmpl, {
                    i: this.compareOperationsCount - j - 1,
                    childTmpl: comparations,
                });
            } else {
                throw new Error('Invalid policy conditions configuration for the rules set');
            }
        }

        let functionsListTmpl = whiskers.render(internalFunctionsTemplate, {
            functions: templates,
        });

        let rulesSetTmpl;
        if (error) {
            rulesSetTmpl = whiskers.render(rulesSetTemplates.rulesSetWithErrorTemplate(), {
                rulesSetNumber: this.rulesSetsCount,
                comparations: comparations,
                rulesSetError: error,
                functionsList: functionsListTmpl,
            });
        } else {
            rulesSetTmpl = whiskers.render(rulesSetTemplates.rulesSetWithoutErrorTemplate(), {
                rulesSetNumber: this.rulesSetsCount,
                comparations: comparations,
                functionsList: functionsListTmpl,
            });
        }

        return rulesSetTmpl;
    }
}

module.exports = RulesSetsGenerator;
