/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

import { PatchContext } from "./PatchContext";
import { Patcher } from "./Patcher";
import { InsteadFn, PatchFn } from "./types";

export enum PatchPriority {
    MIN = 0,
    DEFAULT = 15,
    MAX = 30
}

function NOOP() { };

export class Patch<T> {
    public before: PatchFn<T>;
    public after: PatchFn<T>;
    public priority: number;

    public constructor(data: Partial<Patch<T>> & { instead?: InsteadFn<T>; }) {
        this.priority = data.priority ?? PatchPriority.DEFAULT;
        if (this.priority < PatchPriority.MIN || this.priority > PatchPriority.MAX) {
            throw new Error("Priority must be between PatchPriority.MIN and PatchPriority.MAX");
        }

        if (data.instead) {
            if (data.after || data.before) {
                throw new Error("Instead patches cannot specify before or after patches.");
            }

            const { instead } = data;
            this.before = (ctx: PatchContext<T>) => {
                ctx.result = instead(ctx);
            };
            this.after = NOOP;
        } else {
            this.before = data.before ?? NOOP;
            this.after = data.after ?? NOOP;
        }
    }
}

export class Unpatch<T> {
    public constructor(private patcher: Patcher, public obj: T, public methodName: string, public patch: Patch<T>) { }

    public unpatch() {
        this.patcher.unpatch(this.obj, this.methodName, this.patch);
    }
}
