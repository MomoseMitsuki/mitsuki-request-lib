import { __awaiter } from 'tslib';

class MapCacheStore {
    constructor() {
        this.map = new Map();
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.map.has(key);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.map.has(key)) {
                throw new Error(`Key "${key}" not found`);
            }
            return this.map.get(key);
        });
    }
    set(key, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            if (values.length === 1) {
                this.map.set(key, values[0]);
            }
            else {
                this.map.set(key, values);
            }
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            this.map.delete(key);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            this.map.clear();
        });
    }
}
const memoryStore = new MapCacheStore();

export { memoryStore };
