import type { Requestor } from '../request-core/index';
export interface AxiosRequestorOptions {
    baseURL?: string;
    defaultHeaders?: Record<string, string>;
}
export declare function createAxiosRequestor(opts?: AxiosRequestorOptions): Requestor;
