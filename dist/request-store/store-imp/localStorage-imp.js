import { __awaiter } from 'tslib';

const storageStore = {
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield localStorage.getItem(key);
            return JSON.parse(result);
        });
    },
    set(key, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            if (values.length === 1) {
                localStorage.setItem(key, JSON.stringify(values[0]));
            }
            else {
                localStorage.setItem(key, JSON.stringify(values));
            }
        });
    },
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const keys in localStorage) {
                if (keys === key) {
                    return true;
                }
            }
            return false;
        });
    },
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield localStorage.removeItem(key);
        });
    },
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield localStorage.clear();
        });
    }
};

export { storageStore };
