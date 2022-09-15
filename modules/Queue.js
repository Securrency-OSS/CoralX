class _Queue {
    constructor() {
        this.queue = [];
        this.queueInProgress = false;
    }

    add(fn) {
        this.queue.push(fn);
    }

    toggleQueueProgress() {
        this.queueInProgress = !this.queueInProgress;
    }

    async processQueue() {
        if (this.queue.length === 1) {
            this.toggleQueueProgress();

            const result = await this.queue[0]();

            this.toggleQueueProgress();
            this.queue.shift();

            return result;
        }
        if (!this.queueInProgress) {
            for (const currentFn of this.queue) {
                await currentFn();
            }
            this.queue = [];
        }
    }
}

class Queue {
    static getInstance() {
        if (!this.instance) {
            this.instance = new _Queue();
        }
        return this.instance;
    }
}

module.exports = Queue;
