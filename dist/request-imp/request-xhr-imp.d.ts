import type { Requestor } from '../request-core/index';
export interface XHRRequestorOptions {
    baseURL?: string;
    defaultHeaders?: Record<string, string>;
    withCredentials?: boolean;
}
export declare function createXHRRequestor(opts?: XHRRequestorOptions): Requestor;
