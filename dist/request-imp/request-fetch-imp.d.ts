import type { Requestor } from '../request-core/index';
export interface FetchRequestorOptions {
    baseURL?: string;
    defaultHeaders?: Record<string, string>;
}
export declare function createFetchRequestor(opts?: FetchRequestorOptions): Requestor;
