export class ObjectRepository<T extends object> {
    #objects: WeakRef<T>[] = [];
    #registry = new FinalizationRegistry<number>((id) => this.#remove(id));
    #index = new WeakMap<T, number>;
    #nextId = 1;

    #remove(id: number) {
        delete this.#objects[id];
    }

    getId(obj: T): number {
        let id = this.#index.get(obj);
        if (typeof id === "number") return id;
        this.#registry.register(obj, id = this.#nextId++);
        this.#index.set(obj, id);
        this.#objects[id] = new WeakRef(obj);
        return id;
    }

    getObject(id: number): T | undefined {
        return this.#objects[id]?.deref();
    }
}
