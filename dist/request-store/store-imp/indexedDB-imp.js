import { __awaiter } from 'tslib';

const DB_NAME = "_cache";
const STORE_NAME = "_cache";
const DB_VERSION = 1;
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => {
            const db = req.result;
            db.onversionchange = () => db.close();
            resolve(db);
        };
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
    });
}
let dbPromise = null;
function getDB() {
    if (!dbPromise)
        dbPromise = openDB();
    return dbPromise;
}
function reqToPromise(r) {
    return new Promise((resolve, reject) => {
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
    });
}
const storageStore = {
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getDB();
            const tx = db.transaction(STORE_NAME, "readonly");
            const os = tx.objectStore(STORE_NAME);
            const val = yield reqToPromise(os.get(key));
            return val !== undefined;
        });
    },
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getDB();
            const tx = db.transaction(STORE_NAME, "readonly");
            const os = tx.objectStore(STORE_NAME);
            const val = yield reqToPromise(os.get(key));
            if (val === undefined)
                throw new Error(`Key "${key}" not found in _cache`);
            return val;
        });
    },
    set(key, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const os = tx.objectStore(STORE_NAME);
            const valueToStore = values.length === 1 ? values[0] : values;
            yield reqToPromise(os.put(valueToStore, key));
            yield new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
        });
    },
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const os = tx.objectStore(STORE_NAME);
            yield reqToPromise(os.delete(key));
            yield new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
        });
    },
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const os = tx.objectStore(STORE_NAME);
            yield reqToPromise(os.clear());
            yield new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
        });
    }
};

export { storageStore };
