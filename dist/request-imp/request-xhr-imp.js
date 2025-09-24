import { __awaiter } from 'tslib';
import eventEmitter from '../request-core/eventEmitter.js';

function createXHRRequestor(opts = {}) {
    const { baseURL, defaultHeaders, withCredentials } = opts;
    const request = (url_1, method_1, ...args_1) => __awaiter(this, [url_1, method_1, ...args_1], void 0, function* (url, method, options = {}) {
        const fullUrl = buildUrl(baseURL, url, options.params);
        const configForHook = { url: fullUrl, method, options };
        const cached = yield eventEmitter.emit('beforeRequest', configForHook);
        if (cached)
            return cached;
        const { signal, cleanup } = mergeSignalWithTimeout(options.signal, options.timeoutMs);
        const respLike = yield new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, fullUrl, true);
            xhr.withCredentials = !!withCredentials;
            // 超时处理
            if (options.timeoutMs && options.timeoutMs > 0)
                xhr.timeout = options.timeoutMs;
            // 绑定取消
            const onAbort = () => xhr.abort();
            if (signal)
                signal.addEventListener('abort', onAbort);
            // 请求头
            const headers = Object.assign(Object.assign({}, (defaultHeaders || {})), (options.headers || {}));
            const body = encodeBody(options.body, headers);
            for (const [k, v] of Object.entries(headers))
                xhr.setRequestHeader(k, v);
            xhr.onload = () => {
                var _a;
                cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                if (signal)
                    signal.removeEventListener('abort', onAbort);
                const status = xhr.status === 1223 ? 204 : xhr.status; // IE 历史坑，保险处理
                const rawText = (_a = xhr.responseText) !== null && _a !== void 0 ? _a : '';
                const ok = status >= 200 && status < 300;
                const resp = {
                    ok,
                    status,
                    headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
                    json: () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            return JSON.parse(rawText);
                        }
                        catch (_a) {
                            return rawText;
                        }
                    }),
                    text: () => __awaiter(this, void 0, void 0, function* () { return rawText; }),
                    toPlain: () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            return JSON.parse(rawText);
                        }
                        catch (_a) {
                            return rawText;
                        }
                    }),
                };
                resolve(resp);
            };
            xhr.onerror = () => {
                cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                if (signal)
                    signal.removeEventListener('abort', onAbort);
                reject(new Error('Network error'));
            };
            xhr.ontimeout = () => {
                cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                if (signal)
                    signal.removeEventListener('abort', onAbort);
                reject(new DOMException(`Timeout ${options.timeoutMs}ms`, 'AbortError'));
            };
            xhr.onabort = () => {
                cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                if (signal)
                    signal.removeEventListener('abort', onAbort);
                reject(new DOMException('Aborted', 'AbortError'));
            };
            xhr.send(body);
        });
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
function encodeBody(body, headers) {
    if (body == null)
        return null;
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
function parseResponseHeaders(raw) {
    const out = {};
    if (!raw)
        return out;
    raw.trim().split(/[\r\n]+/).forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            out[key] = val;
        }
    });
    return out;
}

export { createXHRRequestor };
