export interface CacheStore {
    has(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T>;
    set<T>(key: string, ...values: Array<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare function useCacheStore(isPersist: boolean): CacheStore;
