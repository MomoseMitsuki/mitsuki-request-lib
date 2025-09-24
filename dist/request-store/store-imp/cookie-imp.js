import { __awaiter } from 'tslib';

class CookieCacheStore {
    encode(value) {
        return encodeURIComponent(JSON.stringify(value));
    }
    decode(value) {
        if (value == null)
            throw new Error("Value not found");
        return JSON.parse(decodeURIComponent(value));
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return document.cookie.split("; ").some((c) => c.startsWith(`${key}=`));
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const cookies = document.cookie.split("; ");
            for (const c of cookies) {
                const [k, v] = c.split("=");
                if (k === key) {
                    return this.decode(v);
                }
            }
            throw new Error(`Key "${key}" not found`);
        });
    }
    set(key, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = values.length === 1 ? values[0] : values;
            document.cookie = `${key}=${this.encode(value)}; path=/`;
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const cookies = document.cookie.split("; ");
            for (const c of cookies) {
                const [k] = c.split("=");
                document.cookie = `${k}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            }
        });
    }
}
const memoryStore = new CookieCacheStore();

export { memoryStore };
