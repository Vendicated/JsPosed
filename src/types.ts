/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

import PatchContext from "./PatchContext";

export type Func = (...args: any[]) => any;
export type PatchFn<T> = (ctx: PatchContext<T>, ...args: any[]) => void;
export type InsteadFn<T> = (ctx: PatchContext<T>, ...args: any[]) => any;
