/* Basically WeakSet<T> without membership testing, but iterable */
export class LiveCollection<T extends object> {
    /* upper bound for live object count */
    get sizeBound() { return this.#sizeBound; }
    #sizeBound = 0;

    get generation() { return this.#generation; }
    #generation = 0;

    private readonly items: Map<number, WeakRef<T>> = new Map<number, WeakRef<T>>;
    private readonly registry = new FinalizationRegistry((idx: number) => {
        --this.#sizeBound;
        this.items.delete(idx);
        ++this.#generation;
    });

    add(t: T) {
        this.registry.register(t, this.#sizeBound);
        this.items.set(this.#sizeBound++, new WeakRef(t));
        ++this.#generation;
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for(const ref of this.items.values()) {
            const t = ref.deref();
            if (t) yield t;
        }
    }
}
