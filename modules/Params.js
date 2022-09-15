/**
 * Share params memory
 */
class _Params {
    constructor() {
        this.data = {};
    }

    add(key, value) {
        if (this.data[key]) {
            throw new Error(`
                '${key}' key is not empty.
            `);
        }
        this.data[key] = value;
    }
    
    get(key) {
        return this.data[key];
    }

    getObj() {
        return {...this.data};
    }
}

class Params {
    static getInstance() {
        if (!this.instance) {
            this.instance = new _Params();
        }
        return this.instance;
    }
}

module.exports = Params;
