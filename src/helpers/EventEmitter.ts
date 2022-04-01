export type Arguments<T> = [T] extends [(...args: infer U) => any] ? U : [T] extends [void] ? [] : [T]

export interface IEventEmitter<Events extends object> {
  on<E extends keyof Events>(event: E, listener: Events[E]): this;

  addListener<E extends keyof Events>(event: E, listener: Events[E]): this;

  emit<E extends keyof Events>(event: E, ...args: Arguments<Events[E]>): boolean;

  off<E extends keyof Events>(event: E, listener: Events[E]): this;

  removeAllListeners<E extends keyof Events>(event?: E): this;

  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this;

  hasListener<E extends keyof Events>(event: E, listener: Events[E]): boolean;
}

type Listeners<T extends object> = {
  [K in keyof T]: T[K][];
};

export class EventEmitter<Events extends object> implements IEventEmitter<Events> {
  private listeners: Listeners<Events> = {} as Listeners<Events>;

  addListener<E extends keyof Events>(event: E, listener: Events[E]): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    if (!this.listeners[event].find(l => l === listener)) {
      this.listeners[event].push(listener);
    }
    return this;
  }

  on<E extends keyof Events>(event: E, listener: Events[E]): this {
    return this.addListener(event, listener);
  }

  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this {
    if (!this.listeners[event]) {
      return this;
    }

    this.listeners[event] = this.listeners[event].filter((callback) => callback !== listener);

    return this;
  }

  off<E extends keyof Events>(event: E, listener: Events[E]): this {
    return this.removeListener(event, listener);
  }

  removeAllListeners<E extends keyof Events>(event?: E): this {
    if (!event) {
      this.listeners = {} as Listeners<Events>;
      return this;
    }

    this.listeners[event] = [];
    return this;
  }

  emit<E extends keyof Events>(event: E, ...args: Arguments<Events[E]>): boolean {
    if (!this.listeners[event]) {
      return true;
    }

    for (const listener of this.listeners[event]) {
      // @ts-ignore
      if (listener(...args) === false) {
        return false;
      }
    }

    return true;
  }

  hasListener<E extends keyof Events>(event: E, listener: Events[E]): boolean {
    return this.listeners[event].includes(listener);
  }
}
