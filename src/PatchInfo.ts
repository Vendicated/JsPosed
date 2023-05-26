/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

import { Patch } from "./patch";
import { PatchContext } from "./PatchContext";
import type { Patcher } from "./Patcher";
import { Func } from "./types";

export class PatchInfo<T> {
    public patches = [] as Patch<T>[];

    public constructor(
        public readonly patcher: Patcher,
        public readonly targetObject: T,
        public readonly methodName: string,
        public readonly original: Func
    ) { }

    public get patchCount() {
        return this.patches.length;
    }

    public addPatch(patch: Patch<T>) {
        if (this.patches.includes(patch)) return false;
        this.patches.push(patch);
        this.patches.sort((a, b) => b.priority - a.priority);
        return true;
    }

    public removePatch(patch: Patch<T>) {
        const idx = this.patches.indexOf(patch);
        if (idx === -1) return false;
        this.patches.splice(idx, 1);
        return true;
    }

    public makeReplacementFunc() {
        const _this = this;
        return function (this: any, ...args: any[]) {
            return _this._callback(this, ...args);
        };
    }

    private _callback(thisObject: any, ...args: any[]) {
        const { patches } = this;

        if (!patches.length)
            return this.original.call(thisObject, ...args);

        const ctx = new PatchContext(thisObject, args);

        let idx = 0;
        do {
            try {
                patches[idx].before(ctx, ...ctx.args);
            } catch (err: any) {
                this.patcher.handleError("before", this, err, patches[idx]);

                ctx.result = null;
                ctx._returnEarly = false;
                continue;
            }

            if (ctx._returnEarly) {
                idx++;
                break;
            }
        } while (++idx < patches.length);

        if (!ctx._returnEarly) {
            try {
                ctx.result = this.original.call(ctx.thisObject, ...ctx.args);
            } catch (err: any) {
                ctx.error = err;
            }
        }

        idx--;
        do {
            const lastResult = ctx.result;
            const lastError = ctx.error;

            try {
                patches[idx].after(ctx, ...ctx.args);
            } catch (err: any) {
                this.patcher.handleError("after", this, err, patches[idx]);

                if (lastError !== null) {
                    ctx.error = lastError;
                } else {
                    ctx.result = lastResult;
                }
            }
        } while (--idx >= 0);

        return ctx.resultOrError;
    }
}
