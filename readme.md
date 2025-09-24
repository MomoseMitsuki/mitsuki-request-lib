# Mitsuki-request-lib

## 特性

- 传输层可插拔：`fetch / axios / xhr` 任意实现
- 统一取消模型：`AbortSignal` + `timeoutMs`
- 中间件的能力：**重试、缓存、幂等、串行、并发限流**
- TypeScript 友好：稳定的 `Requestor` 接口与 `ResponseLike`

---

## 快速开始

### 1) 安装依赖

```powershell
pnpm install
```

### 2) xhr/axios/fetch 实现层

**fetch**

```typescript
import { inject } from "./request-core";
import { createFetchRequestor } from "./request-fetch-imp";

inject(
  createFetchRequestor({
    baseURL: "https://api.example.com",
    defaultHeaders: { "X-Client": "web" },
  })
);
```

**axios**

```typescript
import { inject } from "./request-core";
import { createAxiosRequestor } from "./request-axios-imp";

inject(
  createAxiosRequestor({
    baseURL: "https://api.example.com",
    defaultHeaders: { "X-Client": "web" },
  })
);
```

**XMLHttpRequest**

```typescript
import { inject } from "./request-core";
import { createXHRRequestor } from "./request-xhr-imp";

inject(
  createXHRRequestor({
    baseURL: "https://api.example.com",
    withCredentials: true,
  })
);
```

### 3) 上层功能 service

```typescript
import {
  useRequestor,
  createRetryRequestor,
  createCacheRequestor,
  createSerialRequestor,
  createParallelRequestor,
  createIdempotentRequestor,
} from "./request-core";

const base = useRequestor();

const req = createCacheRequestor({
  key: ({ url, method, options }) =>
    `${method}:${url}?${JSON.stringify(options?.params || {})}`,
  duration: 60_000,
  persist: true,
})(
  createSerialRequestor(
    (url) => new URL(url, "http://x").pathname,
    createParallelRequestor(
      8,
      createRetryRequestor({ max: 3, base: 300 }, base)
    )
  )
);

// 发起请求
const users = await req
  .get("/users", { params: { page: 1 } })
  .then((r) => r.json());
```

> 说明：`createCacheRequestor(options)` 返回一个**工厂**（或你项目里的实现直接返回 `Requestor`），上面示例展示装饰器组合的典型顺序。若你的实现已直接返回 `Requestor`，把上一段改为链式传入 `base` 即可（你已有这类实现）。

---

## 架构

### 三层架构

- **request-imp**：提供请求基本功能（xhr/axios/fetch）
- **request-core**：提供网络上层控制，比如请求串行、请求并行、请求重试、请求防重等功能
- **request-bus**：开发者自用,利用 core 提供的 inject 和 实现层 的 createRequestor 封装自定义请求

我们基于DIP（Dependence Inversion Principle，依赖倒置原则），彻底将`request-core`和请求的实现解耦，而`typescript`的类型系统让这一切的落地成为了可能。

同时也满足软件设计的开闭原则（对修改关闭，对新增开放）

### 改变实现层

```typescript
- import { requestor } from 'request-axios-imp';
+ import { requestor } from 'request-fetch-imp';
inject(requestor);
```

### 核心接口

```typescript
// request-core
export interface Requestor {
  request(url: string, method: Method, options?: RequestOptions): Promise<ResponseLike>;
  get/delete/head/options/post/put/patch(...)
}

export interface ResponseLike {
  ok: boolean; status: number; headers?: Record<string,string>;
  json<T=any>(): Promise<T>;
  text(): Promise<string>;
  toPlain?<T=any>(): Promise<T>; // 可选：供缓存层使用
}

export interface RequestOptions {
  headers?: Record<string,string>;
  params?: Record<string, any>;
  body?: any;
  signal?: AbortSignal;   // 统一取消
  timeoutMs?: number;     // 统一超时（装饰器处理）
  [k: string]: any;       // 透传元信息
}
```

## 上层功能使用

### 1) 请求重试 `createRetryRequestor(options, base?)`

- **示例**

  ```
  const req = createRetryRequestor({ max: 3, base: 300 });
  ```

### 2) 请求缓存 `createCacheRequestor(options)`

- **存储接口**

  ```typescript
  // request-store
  export interface CacheStore {
    has(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T>;
    set<T>(key: string, ...values: Array<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  }
  ```

- **选项**

  - `key(config)`: 生成缓存键
  - `persist`: 使用持久化仓库（由 `useCacheStore(persist)` 决定）
  - `duration`: TTL（ms）。如提供 isValid 则忽略
  - `isValid(key, config)`: 自定义有效性（版本/租户/场景）
  - `toPlain(resp)`: 提取可缓存的纯数据（默认 `resp.json()`）

- **行为**

  - 使用缓存 → `beforeRequest` 返回 `ResponseLike(status=299)` 短路
  - 响应 2xx → `responseBody` 写入缓存（双键：`<key>#data` 与 `<key>#ts`）

- **示例**

  ```typescript
  const req = createCacheRequestor({
    key: ({ url, method, options }) =>
      `${method}:${url}?${JSON.stringify(options?.params || {})}`,
    duration: 60000,
    persist: true,
  });
  ```

### 3) 请求幂等 `createIdempotentRequestor()`

- 利用缓存实现“相同请求不重复提交”（可设置短 TTL 或只做在途合并）

- **默认 key 生成**（若不用 `spark-md5`）：

  - 请求方法 + url + 请求头 + 请求体 组成 key 键，内部使用 createCacheRequestor 进行缓存，实现请求的幂等

- **示例**

  ```typescript
  const req = createIdempotentRequestor(); // 内部使用 createCacheRequestor({ persist:false })
  ```

### 4) 请求串行 `createSerialRequestor(key, base?)`

- 按 `key(url, method, options)` 对请求排队，**同 key 顺序执行**，不同 key 并发

- **示例：按 pathname 串行**

  ```typescript
  const req = createSerialRequestor((url) => new URL(url, "http://x").pathname);
  ```

### 5) 请求并发限流 `createParallelRequestor(limit = 6, base?)`

- 全局/实例级信号量：限制同时在途请求数

- **示例**

  ```typescript
  const req = createParallelRequestor(8);
  ```

---

## 错误与返回

- `ResponseLike.ok`：是否 2xx
- `ResponseLike.status`：HTTP 状态码
- `json()/text()`：**可重复读取**（fetch 适配器使用 `clone()`，axios/xhr 适配器基于内存数据）
- 重试判定默认：**网络/超时/5xx/429**；可通过 `shouldRetry` 自定义

---

## Mitsuki-store-lib

默认持久化存储在 localStorage
非持久化存储在 sessionStorage 内

可在 request-store/index 内更改导入，使用其他存储方案（内存、cookie。indexedDB）

同样使用 DIP 依赖倒置原则，新增存储方案只需要 新增 xxx-imp.ts 实现并导入即可



