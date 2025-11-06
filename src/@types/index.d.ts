interface ResponseLike {
	ok: boolean;
	status: number;
	headers?: Record<string, string>;
	json<T = any>(): Promise<T>;
	text(): Promise<string>;
	toPlain<T = any>(): Promise<T>;
}

interface RequestOptions {
	params?: Record<string, any>;
	headers?: Record<string, string>;
	pathname?: string;
	url?: string;
	method?: string;
	body?: any;
}

interface CacheOptions {
	duration: number;
	persist: boolean;
	key: (config: RequestOptions) => string;
	isVaild?: (key: string, config: RequestOptions) => Promise<boolean>;
}
