/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

import { PatchContext } from "./PatchContext";
import { PatchInfo } from "./PatchInfo";
import { Patch } from "./patch";

export type Func = (...args: any[]) => any;
export type PatchFn<T> = (ctx: PatchContext<T>, ...args: any[]) => void;
export type InsteadFn<T> = (ctx: PatchContext<T>, ...args: any[]) => any;
export type OnPatchError = <T>(kind: "before" | "after", info: PatchInfo<T>, err: any, patch: Patch<T>) => void;
