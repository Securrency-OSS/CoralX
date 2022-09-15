const getExternalCallsTotal = require("./code-generator/engine/templates/functions/getExternalCallsTotal");

class ErrorsCounter {
    static add(number) {
        this.errors += number;
    }
    static increment() {
        this.errors++;
    }
    static errorsCount() {
        return this.errors;
    }
}

ErrorsCounter.errors = 0;

module.exports = ErrorsCounter;
