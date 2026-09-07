# nwjs-hooks

Compatibility hooks for [NW.js](https://nwjs.io/) applications.

`nwjs-hooks` provides small runtime hooks intended to improve compatibility of applications whose resource paths or filesystem access assume case-insensitive behavior, such as applications originally developed and tested primarily on Windows.

The hooks operate at two different layers:

* Node.js filesystem APIs
* Chromium/NW.js resource requests

## Installation

Download the repository as a ZIP file from GitHub:

**Code → Download ZIP**

Extract the downloaded archive.

Copy the JavaScript hook files into the web directory of your NW.js application.

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

Do not place the extracted repository directory itself inside `www/`. Copy the required `.js` files from the repository into the web directory.

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

Loading `hookloader.js` first is important because it installs the hooks before the application begins accessing files and resources.

## Hooks

* **fs-hook:** Hooks selected Node.js `fs` operations and resolves filesystem paths case-insensitively. This allows code requesting paths such as `Languages/` to locate an actual directory named `languages/` on a case-sensitive filesystem.
* **webrq-hook:** Hooks NW.js/Chromium `chrome.webRequest` resource requests and can redirect `chrome-extension://` resource URLs to the correctly cased path found on disk. This applies to browser-side resources such as images, audio, scripts, and other files loaded through NW.js's resource system.

## Why both hooks are needed

NW.js applications can access resources through more than one mechanism.

A JavaScript plugin may directly use Node.js:

```js
require("fs").readdirSync("Languages");
```

while normal HTML5 resources may be loaded by Chromium:

```js
image.src = "img/pictures/Embers.png";
```

These two operations are handled by different layers.

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

`fs-hook.js` addresses Node.js filesystem access, while `webrq-hook.js` addresses browser resource requests.

## Case-insensitive resolution

The filesystem hook performs a case-insensitive lookup when an exact path does not exist.

For example, an application requesting:

```text
www/Languages/
```

can resolve to:

```text
www/languages/
```

Likewise, a browser request such as:

```text
chrome-extension://<application-id>/www/img/pictures/Embers.png
```

can be redirected when the actual file on disk uses different capitalization.

## Scope

`nwjs-hooks` is intended as a compatibility layer for existing NW.js applications. It does not modify the application's source files or require resources to be renamed.

It is particularly useful for applications containing inconsistent filename capitalization between their code and packaged resources.

The hooks do not make the underlying filesystem case-insensitive. They only alter how selected application requests are resolved.

## Limitations

Case-insensitive filesystems can technically contain names that differ only by case:

```text
Foo.png
foo.png
```

A case-insensitive lookup cannot distinguish these names. The resolver therefore cannot reproduce the behavior of a genuinely case-sensitive filesystem in this situation.

Applications may also use APIs or resource mechanisms that are outside the hooks' coverage.

For this reason, the hooks should be considered a compatibility mechanism rather than a complete filesystem emulation layer.

## Compatibility

This project is designed for NW.js applications with Node.js integration and access to Chromium's `chrome.webRequest` API.

Behavior may vary between NW.js versions because NW.js bundles its own Chromium and Node.js versions.

## License

See the repository's license file for licensing information.
