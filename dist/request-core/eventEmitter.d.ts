declare const eventNames: readonly ["beforeRequest", "responseBody"];
type EventNames = (typeof eventNames)[number];
declare class EventEmitter {
    private listeners;
    on(eventName: EventNames, listener: Function): void;
    emit<T = any>(eventName: EventNames, ...args: any[]): Promise<T | undefined>;
    remove(eventName: EventNames, listener: Function): void;
}
declare const _default: EventEmitter;
export default _default;
