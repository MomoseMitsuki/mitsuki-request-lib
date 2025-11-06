# mitsuki-request-lib

## 简介

整个请求库能适配项目开发中遇到的所有请求场景，诸如请求并发、串行、幂等、缓存等。同时包含自动化工具，用于根据接口文档生成请求样板代码。

请求库不仅完全消除了不同框架间重复的请求代码，极大的缩短了接口联调的时间，为业务开发提效30%，同时带来了更高的可维护性。

## 为什么要重复造轮子?

虽然前端具有诸多成熟的请求库，但在实际项目开发中发现，它们很难完全契合实际的开发需求。

**axios**

axios虽然很成熟，但它只是一个基础库，没有提供诸多的上层功能，比如：

1. 请求重试
2. 请求缓存
3. 请求幂等
4. 请求串行
5. 请求并发
6. ...

**VueRequest / SWR**

它们虽然提供的功能很多，但仍然存在诸多问题：

1. 与上层框架过度绑定导致开发场景受限，也无法提供统一的API
2. 成熟度不够，issue的回复也难以做到及时，存在一定风险
3. 它们没有聚合基础请求库，仍然需要手动整合

**除此之外更重要的是**

公共库不包含公司内部制定的协议规范，即便使用公共库，也必须针对它们做二次封装。

**综上，需要自行封装一套适配公司业务的前端请求库**

## 架构

- **request-bus**：开发者自用,利用 core 提供的 inject 和 实现层 的 requestor 封装自定义请求

- **request-core**：提供请求对象接口规格, 提供网络上层控制，比如请求串行、请求并行、请求重试、请求防重等功能

- **request-imp**：提供请求基本功能（xhr/axios/fetch）

## 使用

1. 安装 package.json 里面对应的依赖

2. 引入到你的工程化项目里

```
├─src
│  └─request-lib
│      ├─request-bus
│      ├─request-imp
│      ├─request-core
│      └─request-store
│          └─store-imp
```

3. 在 ```request-bus``` 中书写你的api函数

通过```IIFE闭包```来实现每个请求对象的沙箱环境

```typescript
// request-bus/article.ts
import { requestor } from 'request-imp/request-fetch-imp'
import { inject, useRequestor, createIdempotentRequest } from 'request-core';

inject(requestor)
const req = useRequestor
/**
 * 发布文章
 */
export const publishArticle = (() => {
  const req = createIdempotentRequest();   // 创建一个具有请求幂等功能的请求对象
  return async (article: Article) => {
    return req.post('/api/article', article).then(resp=>resp.json())
  }
})();


/**
 * 获取文章
 */
export const getArticles = (() => {
  return async (page: number, size: number) => {
    return req.get('/api/article', {
      params:{
        page,
        size
      }
    }).then(resp=>resp.json())
  }
})();
```

由于我们使用的是模板模式，当将来如果实现改变时，无须对request-core做任何改动，仅需新增实现并改变依赖即可。

比如，将来如果改为使用 xhr 完成请求，仅需做以下改动：

改变```request-bus```的依赖

```typescript
- import { requestor } from 'request-axios-imp';
+ import { requestor } from 'request-fetch-imp';
inject(requestor);
const req = useRequestor()
```

## 自动化工具

如果上层业务库由于深度绑定公司内部的接口文档，而我们项目中的接口数量非常庞大，为了减少开发和维护成本，我们用node实现了一个自动化工具，

通过解析 apifox openapi v3.0+ 接口标准文档，自动为每个接口生成请求样板代码，并且考虑到某些样板代码可能不符合实际需要，

我们制定了一种可以基于样板代码打补丁的开发方式。这样既减少了开发量，同时也保证了灵活度。

项目地址: https://github.com/MomoseMitsuki/request-template-cli