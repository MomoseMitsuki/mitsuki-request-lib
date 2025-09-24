import { __awaiter } from 'tslib';

class EventEmitter {
    constructor() {
        this.listeners = {
            "beforeRequest": new Set(),
            "responseBody": new Set()
        };
    }
    on(eventName, listener) {
        this.listeners[eventName].add(listener);
    }
    emit(eventName, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const listener of this.listeners[eventName]) {
                const res = yield listener(...args);
                if (res !== undefined)
                    return res;
            }
            return undefined;
        });
    }
    remove(eventName, listener) {
        this.listeners[eventName].delete(listener);
    }
}
var eventEmitter = new EventEmitter();

export { eventEmitter as default };
