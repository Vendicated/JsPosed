/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

import { Patch, PatchPriority, Unpatch } from "./patch";
import { PatchInfo } from "./PatchInfo";
import { InsteadFn, OnPatchError, PatchFn } from "./types";

const patchInfoSym = Symbol.for("jsposed.patchInfo");

function getMethod(obj: any, methodName: String) {
    if (obj == null)
        throw new Error("obj may not be null or undefined");

    const method = obj[methodName as any];
    if (method == null)
        throw new Error("No such method: " + methodName);

    if (typeof method !== "function")
        throw new Error(methodName + " is not a function");

    return method;
}

export class Patcher {
    /**
     * @param name A custom error for this patcher. This will be used for logging errors
     * @param handleError A custom error handler. If not specified, `console.error` will be used to print the following info:
     *          - patcher name (defaults to "JsPosed")
     *          - method name
     *          - the caught error
     *          - the patch callback that threw this error
     */
    public constructor(
        public readonly name = "JsPosed",
        handleError?: OnPatchError
    ) {
        if (handleError)
            this.handleError = handleError;
    }

    public handleError<T>(kind: "before" | "after", info: PatchInfo<T>, err: any, patch: Patch<T>) {
        console.error(
            `[Patcher<${this.name}>] Error in ${kind} patch of method "${info.methodName}"\n`,
            err,
            "\nFaulty Callback:",
            patch[kind]
        );
    }

    private _unpatches = [] as Unpatch<any>[];

    /**
     * Call the original method, bypassing all patches
     * @param method The method to call
     * @param thisObject The `this` to call the method with
     * @param args The arguments to pass to the method
     * @returns Result of the method
     */
    public callOriginal<T>(method: (...args: any[]) => T, thisObject: any, ...args: any[]): T {
        if (typeof method !== "function")
            throw new Error("method must be a function");

        const actual = (method[patchInfoSym as keyof typeof method] as PatchInfo<any>)?.original ?? method;
        return actual.call(thisObject, ...args);
    }

    /**
     * Patch a method
     * @param obj Object holding the method
     * @param methodName Name of the method
     * @param patch Patch
     * @returns Unpatch
     */
    public patch<T>(obj: T, methodName: string, patch: Patch<T>) {
        const method = getMethod(obj, methodName);
        let patchInfo = method[patchInfoSym] as PatchInfo<T>;
        if (!patchInfo) {
            patchInfo = new PatchInfo(this, obj, methodName, method);

            const replacement = (obj as any)[methodName] = patchInfo.makeReplacementFunc();
            Object.defineProperties(replacement, Object.getOwnPropertyDescriptors(method));
            Object.defineProperty(replacement, patchInfoSym, {
                value: patchInfo,
                enumerable: false,
                writable: true,
                configurable: true
            });
        }

        patchInfo.addPatch(patch);
        const unpatch = new Unpatch(this, obj, methodName, patch);
        this._unpatches.push(unpatch);
        return unpatch;
    }

    /**
     * Remove a patch
     * @param obj Object holding the method
     * @param methodName Method name
     * @param patch Patch to remove
     */
    public unpatch<T>(obj: T, methodName: string, patch: Patch<T>) {
        const method = getMethod(obj, methodName);
        const patchInfo = method[patchInfoSym] as PatchInfo<T>;
        if (patchInfo) {
            patchInfo.removePatch(patch);
            if (patchInfo.patchCount === 0) {
                (obj as any)[methodName] = patchInfo.original;
            }
        }
    }

    /**
     * Remove all patches
     */
    public unpatchAll() {
        for (const unpatch of this._unpatches) {
            unpatch.unpatch();
        }
        this._unpatches = [];
    }

    /**
     * Add a patch that will run before the original method
     * @param obj Object holding the method
     * @param methodName Method name
     * @param before Patch
     * @param priority Patch priority
     * @returns
     */
    public before<T>(obj: T, methodName: string, before: PatchFn<T>, priority = PatchPriority.DEFAULT): Unpatch<T> {
        return this.patch(obj, methodName, new Patch({ before, priority }));
    }

    /**
     * Add a patch that will run instead of the original method
     * @param obj Object holding the method
     * @param methodName Method name
     * @param instead Patch
     * @param priority Patch priority
     * @returns
     */
    public instead<T>(obj: T, methodName: string, instead: InsteadFn<T>, priority = PatchPriority.DEFAULT) {
        return this.patch(obj, methodName, new Patch({ instead, priority }));
    }

    /**
     * Add a patch that will run after the original method
     * @param obj Object holding the method
     * @param methodName Method name
     * @param after Patch
     * @param priority Patch priority
     * @returns
     */
    public after<T>(obj: any, methodName: string, after: PatchFn<T>, priority = PatchPriority.DEFAULT): Unpatch<T> {
        return this.patch(obj, methodName, new Patch({ after, priority }));
    }
}
