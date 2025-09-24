export interface Requestor {
    request(url: string, method: Method, options?: RequestOptions): Promise<ResponseLike>;
    get(url: string, options?: RequestOptions): Promise<ResponseLike>;
    delete(url: string, options?: RequestOptions): Promise<ResponseLike>;
    head(url: string, options?: RequestOptions): Promise<ResponseLike>;
    options(url: string, options?: RequestOptions): Promise<ResponseLike>;
    post(url: string, data?: any, options?: RequestOptions): Promise<ResponseLike>;
    put(url: string, data?: any, options?: RequestOptions): Promise<ResponseLike>;
    patch(url: string, data?: any, options?: RequestOptions): Promise<ResponseLike>;
}
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export interface ResponseLike {
    ok: boolean;
    status: number;
    headers?: Record<string, string>;
    json<T = any>(): Promise<T>;
    text(): Promise<string>;
    toPlain?<T = any>(): Promise<T>;
}
export interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
    signal?: AbortSignal;
    timeoutMs?: number;
    [key: string]: any;
}
export declare function inject(requestor: Requestor): void;
export declare function useRequestor(): Requestor;
export interface RetryOptions {
    max?: number;
    base?: number;
    shouldRetry?(respOrErr: {
        resp?: ResponseLike;
        err?: any;
    }): boolean;
}
export declare function createRetryRequestor(opts?: RetryOptions, base?: Requestor): Requestor;
export interface CacheRequestorOptions {
    key: (config: any) => string;
    persist?: boolean;
    duration?: number;
    isValid?: (key: string, config: any) => boolean | Promise<boolean>;
    toPlain?: (resp: ResponseLike) => Promise<any>;
}
export declare function createCacheRequestor(cacheOptions: CacheRequestorOptions): Requestor;
export declare function createIdempotentRequestor(): Requestor;
export declare function createSerialRequestor(key: (url: string, method: Method, options?: RequestOptions) => string, base?: Requestor): Requestor;
export declare function createParallelRequestor(limit?: number, base?: Requestor): Requestor;
