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

    access: fs.access,
    stat: fs.stat,
    lstat: fs.lstat,
    readdir: fs.readdir,
    readFile: fs.readFile,
    open: fs.open,

    appendFile: fs.appendFile,
    appendFileSync: fs.appendFileSync,

    writeFile: fs.writeFile,
    writeFileSync: fs.writeFileSync,

    mkdir: fs.mkdir,
    mkdirSync: fs.mkdirSync,

    rm: fs.rm,
    rmSync: fs.rmSync,
    rmdir: fs.rmdir,
    rmdirSync: fs.rmdirSync,

    unlink: fs.unlink,
    unlinkSync: fs.unlinkSync,

    rename: fs.rename,
    renameSync: fs.renameSync,

    copyFile: fs.copyFile,
    copyFileSync: fs.copyFileSync,

    link: fs.link,
    linkSync: fs.linkSync,

    symlink: fs.symlink,
    symlinkSync: fs.symlinkSync,

    realpath: fs.realpath,
    realpathSync: fs.realpathSync,

    readlink: fs.readlink,
    readlinkSync: fs.readlinkSync,

    chmod: fs.chmod,
    chmodSync: fs.chmodSync,
    chown: fs.chown,
    chownSync: fs.chownSync,
    lchown: fs.lchown,
    lchownSync: fs.lchownSync,

    utimes: fs.utimes,
    utimesSync: fs.utimesSync,
    lutimes: fs.lutimes,
    lutimesSync: fs.lutimesSync,

    truncate: fs.truncate,
    truncateSync: fs.truncateSync,

    createReadStream: fs.createReadStream,
    createWriteStream: fs.createWriteStream,
};

const cache = new Map();
const dirCache = new Map();

function resolveCaseInsensitive(input) {
    if (typeof input !== "string")
        return input;

    if (cache.has(input))
        return cache.get(input);

    const absolute = path.resolve(input);

    // Don't bother if the exact path exists.
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
            entries = dirCache.get(current);

            if (!entries) {
                entries = new Map();

                for (const name of original.readdirSync(current)) {
                    const key = name.toLowerCase();

                    if (!entries.has(key))
                        entries.set(key, name);
                }

                dirCache.set(current, entries);
            }
        } catch {
            return input;
        }

        const actual = entries.get(part.toLowerCase());

        if (!actual)
            return input;

        current = path.join(current, actual);
    }

    cache.set(input, current);

    return current;
}

/*
 * Which arguments are filesystem paths for each API.
 *
 * Example:
 *
 *   rename(oldPath, newPath, callback)
 *          ^       ^
 *          0       1
 *
 *   symlink(target, path, callback)
 *                    ^
 *                    1
 */
const pathArguments = {
    access: [0],
    accessSync: [0],

    existsSync: [0],

    stat: [0],
    statSync: [0],

    lstat: [0],
    lstatSync: [0],

    readdir: [0],
    readdirSync: [0],

    readFile: [0],
    readFileSync: [0],

    open: [0],
    openSync: [0],

    appendFile: [0],
    appendFileSync: [0],

    writeFile: [0],
    writeFileSync: [0],

    mkdir: [0],
    mkdirSync: [0],

    rm: [0],
    rmSync: [0],

    rmdir: [0],
    rmdirSync: [0],

    unlink: [0],
    unlinkSync: [0],

    rename: [0, 1],
    renameSync: [0, 1],

    copyFile: [0, 1],
    copyFileSync: [0, 1],

    link: [0, 1],
    linkSync: [0, 1],

    symlink: [1],
    symlinkSync: [1],

    realpath: [0],
    realpathSync: [0],

    readlink: [0],
    readlinkSync: [0],

    chmod: [0],
    chmodSync: [0],

    chown: [0],
    chownSync: [0],

    lchown: [0],
    lchownSync: [0],

    utimes: [0],
    utimesSync: [0],

    lutimes: [0],
    lutimesSync: [0],

    truncate: [0],
    truncateSync: [0],

    createReadStream: [0],
    createWriteStream: [0],
};

function hook(name) {
    const fn = original[name];

    fs[name] = function (...args) {
        const paths = pathArguments[name];

        if (paths) {
            for (const index of paths) {
                if (typeof args[index] === "string") {
                    args[index] = resolveCaseInsensitive(args[index]);
                }
            }
        }

        /*
         * Old Node.js compatibility:
         *
         * fs.writeFile(path, data, ...)
         * fs.writeFileSync(path, data, ...)
         *
         * Older versions coerced unsupported data values to strings.
         */
        if (name === "writeFile" || name === "writeFileSync") {
            const data = args[1];

            if (
                typeof data !== "string" &&
                !Buffer.isBuffer(data) &&
                !ArrayBuffer.isView(data)
            ) {
                args[1] = String(data);
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
        dirCache.clear();
    },

    resolveCaseInsensitive
};