const fs = require("fs");
const path = require("path");

const original = {
    accessSync: fs.accessSync,
    existsSync: fs.existsSync,
    statSync: fs.statSync,
    lstatSync: fs.lstatSync,
    readdirSync: fs.readdirSync,
    readFileSync: fs.readFileSync,
    openSync: fs.openSync,
    writeFile: fs.writeFile,
    writeFileSync: fs.writeFileSync,
};

const cache = new Map();

function resolveCaseInsensitive(input) {
    if (typeof input !== "string") return input;
    if (cache.has(input)) return cache.get(input);

    const absolute = path.resolve(input);

    // Don't bother if the exact path already exists.
    try {
        original.statSync(absolute);
        cache.set(input, absolute);
        return absolute;
    } catch {}

    const parsed = path.parse(absolute);

    let current = parsed.root;

    const parts = absolute
        .slice(parsed.root.length)
        .split(path.sep)
        .filter(Boolean);

    for (const part of parts) {
        let entries;

        try {
            entries = original.readdirSync(current);
        } catch {
            return input;
        }

        const wanted = part.toLowerCase();

        const actual = entries.find(
            name => name.toLowerCase() === wanted
        );

        if (!actual)
            return input;

        current = path.join(current, actual);
    }

    cache.set(input, current);

    return current;
}

function hook(name) {
    const fn = original[name];

    fs[name] = function (...args) {
        // Path-based APIs.
        if (
            typeof args[0] === "string" &&
            name !== "writeFile" &&
            name !== "writeFileSync"
        ) {
            args[0] = resolveCaseInsensitive(args[0]);
        }

        // Old Node behavior: coerce unsupported write data to string.
        if (name === "writeFile" || name === "writeFileSync") {
            if (
                typeof args[0] === "string"
            ) {
                args[0] = resolveCaseInsensitive(args[0]);
            }

            if (
                typeof args[1] !== "string" &&
                !Buffer.isBuffer(args[1]) &&
                !ArrayBuffer.isView(args[1])
            ) {
                args[1] = String(args[1]);
            }
        }

        return fn.apply(this, args);
    };
}

for (const name of Object.keys(original)) {
    hook(name);
}

module.exports = {
    clearCache() {
        cache.clear();
    },

    resolveCaseInsensitive
};
