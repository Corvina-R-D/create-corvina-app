
export default class SessionStorageMock {
    private _storage: Map<string, string>;

    constructor() {
        this._storage = new Map<string, string>()
    }

    get length(): number {
        return this._storage.size;
    }

    getItem(key: string): string | null {
        return this._storage.get(key) || null
    }

    setItem(key: string, value: string): void {
        this._storage.set(key, value)
    }

    removeItem(key: string): void {
        this._storage.delete(key)
    }

    key(index: number): string | null {
        throw new Error("Not yet implemented");
    }

    clear(): void {
        throw new Error("Not yet implemented");
    }
}