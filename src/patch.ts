import PatchContext from "./PatchContext";
import Patcher from "./Patcher";
import { InsteadFn, PatchFn } from "./types";

export enum PatchPriority {
    MIN = 0,
    DEFAULT = 15,
    MAX = 30
}

export class Patch<T> {
    public before: PatchFn<T>;
    public after: PatchFn<T>;
    public priority: number;

    public constructor(data: Partial<Patch<T>> & { instead?: InsteadFn<T> }) {
        this.priority = data.priority ?? PatchPriority.DEFAULT;
        if (this.priority < PatchPriority.MIN || this.priority > PatchPriority.MAX) {
            throw new Error("Priority must be between PatchPriority.MIN and PatchPriority.MAX");
        }

        const defaultFn = (ctx: PatchContext<T>) => void 0;

        if (data.instead) {
            if (data.after || data.before) {
                throw new Error("Instead patches cannot specify before or after patches.");
            }

            const { instead } = data;
            this.before = (ctx: PatchContext<T>) => {
                ctx.result = instead(ctx);
            };
            this.after = defaultFn;
        } else {
            this.before = data.before ?? defaultFn;
            this.after = data.after ?? defaultFn;
        }
    }
}

export class Unpatch<T> {
    public constructor(private patcher: Patcher, public obj: T, public methodName: string, public patch: Patch<T>) {}

    public unpatch() {
        this.patcher.unpatch(this.obj, this.methodName, this.patch);
    }
}
