import { memoryStore } from '../store-imp/sessionStorage-imp.js';
import { storageStore } from '../store-imp/localStorage-imp.js';

function useCacheStore(isPersist) {
    if (isPersist) {
        return createStorageStore();
    }
    else {
        return createMemoryStore();
    }
}
function createMemoryStore() {
    return memoryStore;
}
function createStorageStore() {
    return storageStore;
}

export { useCacheStore };
