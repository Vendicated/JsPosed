/*
 * JsPosed, a Javascript patching library inspired by Xposed
 * Copyright (c) 2022 Vendicated
 * Licensed under the Open Software License version 3.0
 */

const assert = require("assert/strict");
const { Patcher, PatchPriority } = require("..");

const obj = {
    add(x, y) {
        return x + y;
    },
    addAndMultiplyBy12(x, y) {
        let sum = x + y;
        sum *= 12;
        return sum;
    },
    getAdd() {
        return this.add;
    }
};
obj.add.someProp = "hello";

/**
 * @param {(patcher: Patcher) => void} task
 */
function stage(task) {
    const patcher = new Patcher();
    task(patcher);
    patcher.unpatchAll();
}

assert.equal(obj.add(1, 2), 3);

// TEST INSTEAD
stage(patcher => {
    patcher.instead(obj, "add", (_) => 42);
    assert.equal(obj.add(1, 2), 42);
    // TEST RESTORES PROPS
    assert.equal(obj.add.someProp, "hello");
});

// TEST PATCHING
stage(patcher => {
    patcher.before(obj, "add", (param) => (param.args[0] = 42));
    assert.equal(obj.add(1, 2), 44);
    patcher.after(obj, "add", (param) => (param.result *= 2));
    assert.equal(obj.add(1, 2), 88);
});

// SHOULD NOT BREAK 'this'
stage(patcher => {
    patcher.before(obj, "getAdd", (_) => _);
    assert.equal(obj.getAdd(), obj.add);
});

// TEST CALL ORIGINAL
stage(patcher => {
    patcher.instead(obj, "add", (param) => 42);
    assert.equal(patcher.callOriginal(obj.add, obj, 1, 2), 3);
});

// TEST UNPATCHALL
stage(patcher => {
    patcher.instead(obj, "add", (param) => 42);
    patcher.unpatchAll();
    assert.equal(obj.add(1, 2), 3);
});

// TEST THROW
stage(patcher => {
    patcher.after(obj, "add", (param) => (param.error = new Error("test")));
    assert.throws(() => obj.add(1, 2), { message: "test" });
});

// TEST PRIORITY
stage(patcher => {
    patcher.instead(obj, "add", (param) => 1);
    patcher.instead(obj, "add", (param) => 2, PatchPriority.MAX);
    patcher.instead(obj, "add", (param) => 3);
    assert.equal(obj.add(1, 2), 2);
});

// TEST CUSTOM ERROR HANDLER
stage(patcher => {
    let passedTest = false;

    const patcherWithCustomError = new Patcher("j", (kind, info, err) => {
        passedTest = true;
    });

    patcherWithCustomError.before(obj, "add", param => {
        throw new Error();
    });

    obj.add(1, 2);
    assert(passedTest);

    patcherWithCustomError.unpatchAll();
});
