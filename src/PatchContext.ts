/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

export default class PatchContext<T> {
    private _result: any = null;
    private _error: any = null;
    _returnEarly = false;

    public constructor(public readonly thisObject: T, public args: any) {}

    /**
     * Get the result. Null in beforePatch
     */
    public get result() {
        return this._result;
    }

    /**
     * Set the result.
     * If called in a beforePatch, this skips the original method
     */
    public set result(result: any) {
        this._result = result;
        this._error = null;
        this._returnEarly = true;
    }

    /**
     * Get the error thrown by the original method, if any
     */
    public get error() {
        return this._error;
    }

    /**
     * Set the error. The method will throw this.
     * If called in a beforePatch, this skips the original method
     */
    public set error(err: any) {
        this._error = err;
        this._result = null;
        this._returnEarly = true;
    }

    /**
     * If error is not null, throw it. Otherwise, return the result
     */
    public get resultOrError() {
        const error = this._error;
        if (error !== null) throw error;
        return this._result;
    }
}
