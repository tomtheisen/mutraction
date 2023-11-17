/* Basically WeakSet<T> without membership testing, but iterable */
export class LiveCollection<T extends object> {
    /* upper bound for live object count */
    get sizeBound() { return this.#sizeBound; }
    #sizeBound = 0;

    private readonly items: WeakRef<T>[] = [];
    private readonly registry = new FinalizationRegistry((idx: number) => {
        this.#sizeBound--;
        delete this.items[idx];
    });

    add(t: T) {
        this.registry.register(t, this.#sizeBound);
        this.items[this.#sizeBound++] = new WeakRef(t);
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for(const ref of this.items) {
            const t = ref.deref();
            if (t) yield t;
        }
    }
}
