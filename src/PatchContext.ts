export default class PatchContext<T> {
    private _result: any = null;
    private _error: any = null;
    _returnEarly = false;

    public constructor(public readonly thisObject: T, public args: any) {}

    public get result() {
        return this._result;
    }

    public set result(result: any) {
        this._result = result;
        this._error = null;
        this._returnEarly = true;
    }

    public get error() {
        return this._error;
    }

    public set error(err: any) {
        this._error = err;
        this._result = null;
        this._returnEarly = true;
    }

    public get resultOrError() {
        const error = this._error;
        if (error !== null) throw error;
        return this._result;
    }
}
