type ReactiveMapChangeInfo<K, V> =
  | { type: "set"; key: K; value: V }
  | { type: "update"; key: K; value: V; prevValue: V }
  | { type: "delete"; key: K; prevValue: V }
  | { type: "clear" };

export class ReactiveMap<K, V> extends Map<K, V> {
  private listeners: Set<(info: ReactiveMapChangeInfo<K, V>) => void> =
    new Set();

  set(key: K, value: V): this {
    const hadKey = this.has(key);
    const prevValue = hadKey ? this.get(key) : undefined;
    super.set(key, value);

    if (hadKey) {
      this.notifyListeners({
        type: "update",
        key,
        value,
        prevValue: prevValue as V,
      });
    } else {
      this.notifyListeners({ type: "set", key, value });
    }
    return this;
  }

  delete(key: K): boolean {
    const hadKey = this.has(key);
    const prevValue = hadKey ? this.get(key) : undefined;
    const result = super.delete(key);
    if (result) {
      this.notifyListeners({ type: "delete", key, prevValue: prevValue as V });
    }
    return result;
  }

  clear(): void {
    super.clear();
    this.notifyListeners({ type: "clear" });
  }

  subscribe(
    listener: (info: ReactiveMapChangeInfo<K, V>) => void,
    signal?: AbortSignal
  ) {
    this.listeners.add(listener);
    if (signal) {
      const abortHandler = () => {
        this.listeners.delete(listener);
        signal.removeEventListener("abort", abortHandler);
      };
      signal.addEventListener("abort", abortHandler);
    }
  }

  private notifyListeners(info: ReactiveMapChangeInfo<K, V>) {
    for (const listener of this.listeners) {
      listener(info);
    }
  }
}
