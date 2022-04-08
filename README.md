# jsposed

A javascript patching library inspired by Xposed

### Installing

```sh
npm install jsposed

pnpm install jsposed

yarn add jsposed
```

### Examples

For more examples on real functions, check [tests/index.js](tests/index.js)

```js
const Patcher = require("jsposed");

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