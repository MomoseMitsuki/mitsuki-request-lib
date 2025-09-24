import { __awaiter } from 'tslib';
import SparkMD5 from 'spark-md5';
import { useCacheStore } from '../request-store/store-core/index.js';
import eventEmitter from './eventEmitter.js';

function wrap(base, wrapRequest) {
    const request = wrapRequest(base.request.bind(base));
    return {
        request,
        get: (u, o) => request(u, 'GET', o),
        delete: (u, o) => request(u, 'DELETE', o),
        head: (u, o) => request(u, 'HEAD', o),
        options: (u, o) => request(u, 'OPTIONS', o),
        post: (u, d, o = {}) => request(u, 'POST', Object.assign(Object.assign({}, o), { body: d })),
        put: (u, d, o = {}) => request(u, 'PUT', Object.assign(Object.assign({}, o), { body: d })),
        patch: (u, d, o = {}) => request(u, 'PATCH', Object.assign(Object.assign({}, o), { body: d })),
    };
}
let req;
function inject(requestor) {
    req = requestor;
}
function useRequestor() {
    return req;
}
function createRetryRequestor(opts = {}, base) {
    var _a, _b, _c;
    const max = Math.max(0, (_a = opts.max) !== null && _a !== void 0 ? _a : 3);
    const b = Math.max(0, (_b = opts.base) !== null && _b !== void 0 ? _b : 300);
    const pred = (_c = opts.shouldRetry) !== null && _c !== void 0 ? _c : ((x) => {
        if (x.err)
            return true;
        const s = x.resp.status;
        return s >= 500 || s === 429;
    });
    const req = base !== null && base !== void 0 ? base : useRequestor();
    return wrap(req, (send) => {
        return (url_1, method_1, ...args_1) => __awaiter(this, [url_1, method_1, ...args_1], void 0, function* (url, method, options = {}) {
            let attempt = 0, lastErr, lastResp;
            while (true) {
                try {
                    const resp = yield send(url, method, options);
                    lastResp = resp;
                    if (!pred({ resp }))
                        return resp;
                    if (resp.ok)
                        return resp;
                }
                catch (err) {
                    lastErr = err;
                    if (!pred({ err }))
                        throw err;
                }
                if (attempt >= max) {
                    if (lastResp)
                        return lastResp;
                    throw lastErr !== null && lastErr !== void 0 ? lastErr : new Error('超出重试次数');
                }
                attempt++;
                const backoff = b * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
                yield new Promise(r => setTimeout(r, backoff));
            }
        });
    });
}
function normalizeOptions(opts) {
    var _a, _b;
    const duration = Math.max(0, (_a = opts.duration) !== null && _a !== void 0 ? _a : 0);
    const toPlain = (_b = opts.toPlain) !== null && _b !== void 0 ? _b : ((resp) => __awaiter(this, void 0, void 0, function* () {
        if (typeof resp.toPlain === 'function')
            return resp.toPlain();
        try {
            return yield resp.json();
        }
        catch (_a) {
            return undefined;
        }
    }));
    return {
        key: opts.key,
        persist: !!opts.persist,
        duration,
        isValid: opts.isValid,
        toPlain,
    };
}
function responseFromCached(data, status = 299) {
    return {
        ok: true,
        status,
        json: () => __awaiter(this, void 0, void 0, function* () { return data; }),
        text: () => __awaiter(this, void 0, void 0, function* () { return JSON.stringify(data); }),
    };
}
function createCacheRequestor(cacheOptions) {
    const options = normalizeOptions(cacheOptions);
    const store = useCacheStore(options.persist);
    const req = useRequestor();
    const dataKeyOf = (k) => `${k}#data`;
    const tsKeyOf = (k) => `${k}#ts`;
    eventEmitter.on('beforeRequest', (config) => __awaiter(this, void 0, void 0, function* () {
        const k = options.key(config);
        const dk = dataKeyOf(k);
        const tk = tsKeyOf(k);
        const hasData = yield store.has(dk);
        if (!hasData)
            return;
        if (options.isValid) {
            const ok = yield Promise.resolve(options.isValid(k, config));
            if (!ok) {
                yield Promise.allSettled([store.delete(dk), store.delete(tk)]);
                return;
            }
            const cached = yield store.get(dk);
            if (cached !== undefined) {
                return responseFromCached(cached, 299);
            }
            return;
        }
        // duration 时间检查
        if (options.duration > 0) {
            const hasTs = yield store.has(tk);
            if (!hasTs) {
                yield Promise.allSettled([store.delete(dk), store.delete(tk)]);
                return;
            }
            const ts = yield store.get(tk);
            const fresh = (Date.now() - ts) <= options.duration;
            if (!fresh) {
                yield Promise.allSettled([store.delete(dk), store.delete(tk)]);
                return;
            }
        }
        const cached = yield store.get(dk).catch(() => undefined);
        if (cached !== undefined) {
            return responseFromCached(cached, 299);
        }
    }));
    // 成功写入缓存
    eventEmitter.on('responseBody', (config, resp) => __awaiter(this, void 0, void 0, function* () {
        if (!(resp && resp.ok))
            return;
        const k = options.key(config);
        const dk = dataKeyOf(k);
        const tk = tsKeyOf(k);
        const plain = yield options.toPlain(resp);
        if (plain === void 0)
            return;
        yield store.set(dk, plain);
        yield store.set(tk, Date.now());
    }));
    return req;
}
// 请求幂等
// url + headers + body -> hash
function hashRequest(opt) {
    const spark = new SparkMD5;
    spark.append(opt.url);
    if (opt.headers) {
        const keys = Object.keys(opt.headers);
        for (const key of keys) {
            spark.append(key);
            spark.append(opt.headers[key]);
        }
    }
    if (opt.body)
        spark.append(opt.body);
    return spark.end();
}
// hash 作为键
function createIdempotentRequestor() {
    return createCacheRequestor({
        key: hashRequest,
        persist: false
    });
}
// 请求串行
function createSerialRequestor(key, base) {
    const chains = new Map();
    const req = base !== null && base !== void 0 ? base : useRequestor();
    return wrap(req, (send) => {
        return (url, method, options) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const k = key(url, method, options);
            const prev = (_a = chains.get(k)) !== null && _a !== void 0 ? _a : Promise.resolve();
            let proceed;
            const current = new Promise(r => (proceed = r));
            chains.set(k, prev.then(() => current));
            yield prev;
            try {
                return yield send(url, method, options);
            }
            finally {
                proceed();
                if (chains.get(k) === current)
                    chains.delete(k);
            }
        });
    });
}
// 请求并发
function createParallelRequestor(limit = 6, base) {
    const req = base !== null && base !== void 0 ? base : useRequestor();
    let active = 0;
    const q = [];
    const acquire = () => new Promise(res => {
        if (active < limit) {
            active++;
            res();
        }
        else {
            q.push(() => {
                active++;
                res();
            });
        }
    });
    const release = () => {
        active--;
        const n = q.shift();
        if (n)
            n();
    };
    return wrap(req, (send) => {
        return (url, method, options) => __awaiter(this, void 0, void 0, function* () {
            yield acquire();
            try {
                return yield send(url, method, options);
            }
            finally {
                release();
            }
        });
    });
}

export { createCacheRequestor, createIdempotentRequestor, createParallelRequestor, createRetryRequestor, createSerialRequestor, inject, useRequestor };
