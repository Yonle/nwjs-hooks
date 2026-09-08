# nwjs-hooks

Compatibility hooks for [NW.js](https://nwjs.io/) applications.

`nwjs-hooks` provides small runtime compatibility hooks for applications whose filesystem and resource handling rely on behavior commonly found on Windows or older Node.js/NW.js environments.

The hooks currently address:

* Case-insensitive filesystem access
* Case-insensitive Chromium/NW.js resource requests
* Legacy `fs.writeFile()` data coercion
* A Linux fallback for `LOCALAPPDATA`
* Window resizing behavior for applications with hardcoded canvas dimensions

## Installation

Download the repository as a ZIP file from GitHub:

**Code → Download ZIP**

Extract the downloaded archive.

Copy the JavaScript files into the web directory of your NW.js application.

For example, if the application has this structure:

```text
my-app/
├── package.json
└── www/
    ├── index.html
    ├── js/
    ├── img/
    └── ...
```

copy the hook files into `www/`:

```text
my-app/
├── package.json
└── www/
    ├── index.html
    ├── hookloader.js
    ├── fs-hook.js
    ├── webrq-hook.js
    ├── js/
    ├── img/
    └── ...
```

Do not place the extracted repository directory itself inside `www/`. Copy the JavaScript files from the repository into the application's web directory.

The hooks must be loaded before the application itself.

At the very beginning of the main HTML file, before the application's other scripts, add:

```html
<script type="text/javascript">require("./hookloader.js");</script>
```

For example:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <script type="text/javascript">require("./hookloader.js");</script>

    <script src="js/libs/pixi.js"></script>
    <script src="js/rpg_core.js"></script>
    <script src="js/main.js"></script>
</head>
<body>
</body>
</html>
```

Loading `hookloader.js` first is important because it installs the compatibility hooks before the application begins accessing files and resources.

## Hooks

* **fs-hook:** Hooks selected Node.js `fs` operations and resolves filesystem paths case-insensitively. It covers both synchronous and asynchronous filesystem APIs, including common operations for reading, writing, creating, removing, renaming, copying, linking, and accessing files. It also restores legacy behavior where unsupported `fs.writeFile()` data values were implicitly coerced to strings.

* **webrq-hook:** Hooks NW.js/Chromium `chrome.webRequest` resource requests and redirects local `chrome-extension://` resource URLs when their requested path differs in capitalization from the file stored on disk. This covers browser-side resources such as images, audio, scripts, and other files loaded through NW.js's resource system.

* **hookloader:** Loads the compatibility hooks and applies additional environment-level compatibility behavior before the application starts. It enables window resizing and provides a Linux fallback for `LOCALAPPDATA` when the variable is not already defined.

## Why both filesystem and resource hooks are needed

NW.js applications can access resources through different layers.

A JavaScript plugin may directly use Node.js:

```js
require("fs").readdirSync("Languages");
```

while normal HTML5 resources may be requested through Chromium:

```js
image.src = "img/pictures/Embers.png";
```

These operations do not use the same resource path.

On a case-sensitive filesystem:

```text
languages/
Embers.png
```

are different from:

```text
Languages/
embers.png
```

`fs-hook.js` handles Node.js filesystem access, while `webrq-hook.js` handles Chromium resource requests.

## Case-insensitive resolution

The filesystem hook performs a case-insensitive lookup when an exact path does not exist.

For example:

```text
www/Languages/
```

can resolve to:

```text
www/languages/
```

Similarly, a Chromium request such as:

```text
chrome-extension://<application-id>/www/img/pictures/Embers.png
```

can be redirected when the actual file on disk uses different capitalization.

The hooks do not rename files or modify the filesystem. They resolve the existing path at runtime.

## Legacy `fs.writeFile()` compatibility

Older Node.js versions accepted a wider range of values for the `data` argument of `fs.writeFile()` and could implicitly coerce unsupported values to strings.

Newer Node.js versions reject unsupported data types.

For example, older application code may contain:

```js
fs.writeFile(file, 0, callback);
```

The `fs-hook` compatibility layer converts unsupported values to their string representation while leaving supported values unchanged.

Supported values such as these are not converted:

```js
"hello"
Buffer.from("hello")
new Uint8Array(...)
new DataView(...)
```

This behavior is intended for applications that were written against older Node.js behavior.

## `LOCALAPPDATA` fallback

Some Windows-oriented applications expect the `LOCALAPPDATA` environment variable to exist.

When running on Linux, `hookloader.js` provides a fallback when `LOCALAPPDATA` is not already defined.

The fallback uses:

```text
$XDG_DATA_HOME
```

when available, otherwise:

```text
~/.local/share
```

An existing `LOCALAPPDATA` value is preserved.

## Window resizing

`hookloader.js` also explicitly enables NW.js window resizing:

```js
nw.Window.get().setResizable(true);
```

This can help applications that implement their own resolution handling or have canvas dimensions tied directly to the window size.

For some applications, enabling the NW.js `resizable` manifest option alone may not be sufficient.

## Scope

`nwjs-hooks` is intended as a compatibility layer for existing NW.js applications.

It does not modify the application's source code and does not require application resources to be renamed.

The hooks are especially useful for applications that were developed with assumptions about:

* case-insensitive filesystems
* older Node.js filesystem behavior
* Windows-specific environment variables
* NW.js window behavior

## Limitations

Case-insensitive lookup cannot perfectly reproduce a filesystem where two files differ only by case:

```text
Foo.png
foo.png
```

There is no unambiguous case-insensitive match for such a path. The resolver will use the first matching entry it encounters.

Applications may also use APIs or resource mechanisms that are not covered by the hooks.

The filesystem hook only operates on the APIs it explicitly wraps. File descriptor-based operations, for example, do not perform path resolution because they operate on already-open file descriptors rather than filesystem paths.

For these reasons, `nwjs-hooks` should be considered a compatibility layer rather than a complete emulation of Windows filesystem or runtime behavior.

## Compatibility

`nwjs-hooks` is designed for NW.js applications with Node.js integration and access to Chromium's `chrome.webRequest` API.

Behavior may vary between NW.js versions because NW.js bundles specific versions of Chromium and Node.js.

## License

See the repository's license file for licensing information.
