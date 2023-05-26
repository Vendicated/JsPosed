# jsposed

A javascript patching library inspired by Xposed

### Installing

```sh
npm install jsposed

pnpm add jsposed

yarn add jsposed
```

### Usage

#### Basics
Import the Patcher class from jsposed:
```js
import { Patcher } from "jsposed";
```

Create a new instance. The name is used for logging errors and optional (defaults to "JsPosed")
```js
const patcher = new Patcher("MyPatcherName");
```

The patcher will catch all errors thrown by patch callbacks and by default print them with a lot of info.
If you want to use your own logger or do more with the errors, you may pass your own error callback:
```js
const patcher = new Patcher("MyPatcher", (kind, info, error, patch) => {
    console.error("Oh no :( Very bad thing happened while patching", info.methodName);
})
```

#### Patch types
There are three types of patches:
- before: Runs **before** the original method and optionally may skip calling the original method by setting context.result (more info below)
- instead: Runs **instead of** the original method. This will entirely skip the original method and requires you to return your own result if applicable
- after: Runs **after** the original method and thus has access to the result returned by it

You can either use the shortcut methods `patcher.before`, `patcher.instead` and `patcher.after`...:
```js
patcher.before(window, "open", (context) => {
    console.log("before window.open", context.args[0]);
    context.args[0] = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
});

patcher.after(window, "open", (context) => {
    console.log("after window.open", context.result)
})
```

...or if you want to use both before and after more concisely, you may also create your own patch directly:
```js
patcher.patch(window, "open", new Patch({
    before(context) { },
    after(context) { }
}))
```

#### The Patch callback

What all patches have in common is how their callback works:
- The first argument is a context that contains a lot of info about the invoked function and allows you to alter the arguments and result (see table below)
- For convenience and a nicer typescript experience, the arguments passed to the original function are also available as arg 2, 3, ..., n

##### PatchContext

| Field | Description | in before patches | in after patches |
|-------|-------------|--------|-------|
| thisObject | The `this` value of this function call | - | - |
| args | The arguments passed in this function call | Changing this array will change the arguments passed to the original | - |
| result | The result (return value) of this function call | Always unset. Setting it to anything (including undefined) will skip the original function | Always set. Changing it will change what's eventually returned |
| error | The error thrown by the original function | Always unset. Setting it to a non-nullish value will skip the original function and **throw** that value | Might be set if the original function threw an error. Setting it to a non-nullish value will **throw** that value. Resetting it to a nullish value will prevent errors from being thrown |
| resultOrError | Throws context.error if non-nullish, otherwise returns context.result | Always unset | Always set

### Examples

For more examples on real functions, check [tests/index.js](tests/index.js)

```js
const { Patcher } = require("jsposed");

const patcher = new Patcher();

// Replace an argument before a method is called
const unpatch = patcher.before(someObject, "someMethod", (context, arg1) => {
    context.args[0] = "Replace some arg";
});

// Remove that patch again
unpatch.unpatch();

// Skip a method conditionally
patcher.before(someObject, "slap", (context, person) => {
    if (person.name === "Tom") {
        // Hey now, who in their right mind would slap poor Tom

        // Lets skip this method
        context.result = null; // Or some other value, this will be returned to the caller

        // Or maybe you would want to throw an error?
        context.error = new Error("DO NOT THE TOM!!");
    }
});

// Replace a method entirely
patcher.instead(someObject, "someMethod", (context) => {
    context.thisObject.doSomeOtherThing();
})

// Call the original method
// If you really really want to slap Tom, then I guess go ahead...
patcher.callOriginal(someObject.slap, someObject, "Tom");

// Now remove all patches again
patcher.unpatchAll();
```
