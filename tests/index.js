const assert = require("assert/strict");
const { Patcher } = require("..");
const { PatchPriority } = require("../dist/patch");

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

const patcher = new Patcher();

assert.equal(obj.add(1, 2), 3);

// TEST INSTEAD
const unpatch = patcher.instead(obj, "add", (_) => 42);
assert.equal(obj.add(1, 2), 42);
// TEST RESTORES PROPS
assert.equal(obj.add.someProp, "hello");
unpatch.unpatch();

// TEST PATCHING
patcher.before(obj, "add", (param) => (param.args[0] = 42));
assert.equal(obj.add(1, 2), 44);
patcher.after(obj, "add", (param) => (param.result *= 2));
assert.equal(obj.add(1, 2), 88);

// SHOULD NOT BREAK 'this'
patcher.before(obj, "getAdd", (_) => _);
assert.equal(obj.getAdd(), obj.add);

// TEST CALL ORIGINAL
assert.equal(patcher.callOriginal(obj.add, obj, 1, 2), 3);

// TEST INLINE REPLACE
assert.equal(obj.addAndMultiplyBy12(1, 2), 3 * 12);
patcher.inlineReplace(obj, "addAndMultiplyBy12", {
    match: /\*= (\d+)/,
    replace: (_, x) => "*= " + x * 2
});
assert.equal(obj.addAndMultiplyBy12(1, 2), 3 * 12 * 2);

// TEST UNPATCHALL
patcher.unpatchAll();
assert.equal(obj.add(1, 2), 3);
// TODO: Unpatch this as well
assert.equal(obj.addAndMultiplyBy12(1, 2), 3 * 12 * 2);

// TEST THROW
patcher.after(obj, "add", (param) => (param.error = new Error("test")));
assert.throws(() => obj.add(1, 2), { message: "test" });

// TEST PRIORITY
patcher.unpatchAll();
patcher.instead(obj, "add", (param) => 1);
patcher.instead(obj, "add", (param) => 2, PatchPriority.MAX);
patcher.instead(obj, "add", (param) => 3);
assert.equal(obj.add(1, 2), 2);
