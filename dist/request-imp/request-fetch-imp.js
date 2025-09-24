import { __awaiter } from 'tslib';
import eventEmitter from '../request-core/eventEmitter.js';

function createFetchRequestor(opts = {}) {
    const { baseURL, defaultHeaders } = opts;
    const request = (url_1, method_1, ...args_1) => __awaiter(this, [url_1, method_1, ...args_1], void 0, function* (url, method, options = {}) {
        const fullUrl = buildUrl(baseURL, url, options.params);
        const config = { url: fullUrl, method, options };
        const cached = yield eventEmitter.emit('beforeRequest', config);
        if (cached)
            return cached;
        const { init, cleanup } = buildInit(method, options, defaultHeaders);
        let resp;
        try {
            resp = yield fetch(fullUrl, init);
        }
        finally {
            cleanup === null || cleanup === void 0 ? void 0 : cleanup();
        }
        const respLike = normalizeResponse(resp);
        yield eventEmitter.emit('responseBody', config, respLike);
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
function buildUrl(base, u, params) {
    const root = base || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const url = new URL(u, root);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v == null)
                return;
            if (Array.isArray(v))
                v.forEach(item => url.searchParams.append(k, String(item)));
            else
                url.searchParams.set(k, String(v));
        });
    }
    return url.toString();
}
function buildInit(method, options, defaultHeaders) {
    const headers = Object.assign(Object.assign({}, (defaultHeaders || {})), (options.headers || {}));
    const body = encodeBody(options.body, headers);
    const { signal, cleanup } = mergeSignalWithTimeout(options.signal, options.timeoutMs);
    const init = {
        method,
        headers,
        body,
        signal,
    };
    return { init, cleanup };
}
function encodeBody(body, headers) {
    if (body == null)
        return undefined;
    if (typeof body === 'string' || body instanceof Blob || body instanceof FormData) {
        return body;
    }
    if (!hasHeader(headers, 'content-type')) {
        headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    return JSON.stringify(body);
}
function hasHeader(h, name) {
    const n = name.toLowerCase();
    return Object.keys(h).some(k => k.toLowerCase() === n);
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
function normalizeResponse(r) {
    return {
        ok: r.ok,
        status: r.status,
        headers: headersToObject(r.headers),
        json: () => r.clone().json(),
        text: () => r.clone().text(),
        toPlain: () => r.clone().json(),
    };
}
function headersToObject(h) {
    const obj = {};
    h.forEach((v, k) => { obj[k] = v; });
    return obj;
}

export { createFetchRequestor };
