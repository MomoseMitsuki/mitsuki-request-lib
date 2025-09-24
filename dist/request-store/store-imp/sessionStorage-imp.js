import { __awaiter } from 'tslib';

const memoryStore = {
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield sessionStorage.getItem(key);
            return JSON.parse(result);
        });
    },
    set(key, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            if (values.length === 1) {
                sessionStorage.setItem(key, JSON.stringify(values[0]));
            }
            else {
                sessionStorage.setItem(key, JSON.stringify(values));
            }
        });
    },
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const keys in sessionStorage) {
                if (keys === key) {
                    return true;
                }
            }
            return false;
        });
    },
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield sessionStorage.removeItem(key);
        });
    },
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield sessionStorage.clear();
        });
    }
};

export { memoryStore };
