import { __awaiter } from 'tslib';
import axios, { AxiosHeaders } from 'axios';
import eventEmitter from '../request-core/eventEmitter.js';

function createAxiosRequestor(opts = {}) {
    const { baseURL, defaultHeaders } = opts;
    const ins = axios.create({
        baseURL,
        headers: defaultHeaders,
    });
    const request = (url_1, method_1, ...args_1) => __awaiter(this, [url_1, method_1, ...args_1], void 0, function* (url, method, options = {}) {
        const fullUrl = buildFullUrl(baseURL, url);
        const configForHook = { url: fullUrl, method, options };
        const cached = yield eventEmitter.emit('beforeRequest', configForHook);
        if (cached)
            return cached;
        const { signal, cleanup } = mergeSignalWithTimeout(options.signal, options.timeoutMs);
        const axCfg = {
            url,
            method: method.toLowerCase(),
            headers: Object.assign(Object.assign({}, (defaultHeaders || {})), (options.headers || {})),
            params: options.params,
            data: options.body,
            signal,
            transitional: { clarifyTimeoutError: true },
        };
        let resp;
        try {
            resp = yield ins.request(axCfg);
        }
        finally {
            cleanup === null || cleanup === void 0 ? void 0 : cleanup();
        }
        const respLike = toResponseLike(resp);
        yield eventEmitter.emit('responseBody', configForHook, respLike);
        return respLike;
    });
    const get = (u, o) => request(u, 'GET', o);
    const del = (u, o) => request(u, 'DELETE', o);
    const head = (u, o) => request(u, 'HEAD', o);
    const opt = (u, o) => request(u, 'OPTIONS', o);
    const post = (u, d, o = {}) => request(u, 'POST', Object.assign(Object.assign({}, o), { body: d }));
    const put = (u, d, o = {}) => request(u, 'PUT', Object.assign(Object.assign({}, o), { body: d }));
    const patch = (u, d, o = {}) => request(u, 'PATCH', Object.assign(Object.assign({}, o), { body: d }));
    return { request, get, delete: del, head, options: opt, post, put, patch };
}
function buildFullUrl(baseURL, path) {
    if (!baseURL)
        return path;
    try {
        return new URL(path, baseURL).toString();
    }
    catch (_a) {
        return `${baseURL === null || baseURL === void 0 ? void 0 : baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    }
}
function mergeSignalWithTimeout(external, timeoutMs) {
    if (!timeoutMs && !external)
        return { signal: external, cleanup: undefined };
    const ac = new AbortController();
    let timer;
    const onExternalAbort = () => ac.abort(external === null || external === void 0 ? void 0 : external.reason);
    if (external)
        external.addEventListener('abort', onExternalAbort);
    if (timeoutMs && timeoutMs > 0) {
        timer = setTimeout(() => ac.abort(new DOMException(`Timeout ${timeoutMs}ms`, 'AbortError')), timeoutMs);
    }
    const cleanup = () => {
        if (external)
            external.removeEventListener('abort', onExternalAbort);
        if (timer)
            clearTimeout(timer);
    };
    return { signal: ac.signal, cleanup };
}
function toResponseLike(r) {
    const data = r.data;
    const ok = r.status >= 200 && r.status < 300;
    return {
        ok,
        status: r.status,
        headers: axiosHeadersToObject(r.headers),
        json: () => __awaiter(this, void 0, void 0, function* () { return data; }),
        text: () => __awaiter(this, void 0, void 0, function* () { return (typeof data === 'string' ? data : JSON.stringify(data)); }),
        toPlain: () => __awaiter(this, void 0, void 0, function* () { return data; }),
    };
}
function axiosHeadersToObject(h) {
    const obj = {};
    if (!h)
        return obj;
    const anyH = h;
    if (typeof AxiosHeaders !== 'undefined' && anyH instanceof AxiosHeaders) {
        anyH.forEach((v, k) => { obj[k] = v; });
        return obj;
    }
    Object.keys(anyH).forEach(k => {
        const v = anyH[k];
        if (Array.isArray(v))
            obj[k] = v.join(', ');
        else
            obj[k] = String(v);
    });
    return obj;
}

export { createAxiosRequestor };
