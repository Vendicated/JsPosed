import { Patch, PatchPriority, Unpatch } from "./patch";
import PatchInfo from "./PatchInfo";
import { InsteadFn, PatchFn } from "./types";

export const patchInfoSym = Symbol("patchInfo");

function getMethod(obj: any, methodName: String) {
    if (obj == null) throw new Error("obj may not be null or undefined");
    if (typeof methodName !== "string" || !methodName) throw new Error("methodName must be a non empty string");

    const method = obj[methodName as any];
    if (method == null) throw new Error("No such method: " + methodName);
    if (typeof method !== "function") throw new Error(methodName + " is not a function");
    return method;
}

export default class Patcher {
    private _unpatches = [] as Unpatch<any>[];

    public callOriginal<T>(method: (...args: any[]) => T, thisObject: any, ...args: any[]): T {
        if (typeof method !== "function") throw new Error("method must be a function");
        const actual = (method[patchInfoSym as keyof typeof method] as PatchInfo<any>)?.backup ?? method;
        return actual.call(thisObject, ...args);
    }

    public patch<T>(obj: T, methodName: string, patch: Patch<T>) {
        const method = getMethod(obj, methodName);
        let patchInfo = method[patchInfoSym] as PatchInfo<T>;
        if (!patchInfo) {
            patchInfo = new PatchInfo(method);
            // @ts-ignore
            obj[methodName] = patchInfo.makeReplacementFunc();
            // @ts-ignore
            Object.assign(obj[methodName], method);
            // @ts-ignore
            Object.defineProperty(obj[methodName], patchInfoSym, {
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

    public unpatch<T>(obj: T, methodName: string, patch: Patch<T>) {
        const method = getMethod(obj, methodName);
        const patchInfo = method[patchInfoSym] as PatchInfo<T>;
        if (patchInfo) {
            patchInfo.removePatch(patch);
            if (patchInfo.patchCount === 0) {
                // @ts-ignore
                obj[methodName] = patchInfo.backup;
            }
        }
    }

    public unpatchAll() {
        for (const unpatch of this._unpatches) {
            unpatch.unpatch();
        }
        this._unpatches = [];
    }

    public before<T>(obj: T, methodName: string, before: PatchFn<T>, priority = PatchPriority.DEFAULT): Unpatch<T> {
        return this.patch(obj, methodName, new Patch({ before, priority }));
    }

    public instead<T>(obj: T, methodName: string, instead: InsteadFn<T>, priority = PatchPriority.DEFAULT) {
        return this.patch(obj, methodName, new Patch({ instead, priority }));
    }

    public after<T>(obj: any, methodName: string, after: PatchFn<T>, priority = PatchPriority.DEFAULT): Unpatch<T> {
        return this.patch(obj, methodName, new Patch({ after, priority }));
    }

    public inlineReplace(
        obj: any,
        methodName: string,
        replacement: {
            match: string | RegExp;
            replace: string | ((substring: String, ...args: any[]) => string);
        }
    ) {
        const method = getMethod(obj, methodName);
        const code = String(method);
        let matched = false;
        let newCode: string;
        newCode = code.replace(replacement.match, (m, ...args) => {
            matched = true;
            return typeof replacement.replace === "string" ? replacement.replace : replacement.replace(m, ...args);
        });
        if (!matched || code === newCode) throw new Error("Replacement did nothing");
        if (/^.+?\(.*?\)\s*\{/.test(newCode)) {
            newCode = "function " + newCode;
        }
        newCode = "() => " + newCode;
        try {
            const newFunc = eval(newCode)();
            obj[methodName] = newFunc;
        } catch (err: unknown) {
            throw new Error("Failed to compile new function. Code:\n" + newCode + "\n\nError:\n" + err);
        }
    }
}
