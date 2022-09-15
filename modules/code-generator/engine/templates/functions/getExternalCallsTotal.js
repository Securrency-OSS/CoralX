const whiskers = require("whiskers");

const template = `
    /**
     * @return externalCalls Number of the external calls (includes subpolicy) in policy
     */
    function getExternalCallsTotal() external pure override returns (uint externalCalls) {
        return {externalCallsNumber};
    }`;

module.exports = {
    render() {
        return whiskers.render(template, { externalCallsNumber: 0 });
    }
};
