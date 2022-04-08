import PatchContext from "./PatchContext";

export type Func = (...args: any[]) => any;
export type PatchFn<T> = (ctx: PatchContext<T>, ...args: any[]) => void;
export type InsteadFn<T> = (ctx: PatchContext<T>, ...args: any[]) => any;
