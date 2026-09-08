const path = require("path");
const { resolveCaseInsensitive } = require("./fs-hook.js");

// Certain filename might have some symbols that might confuse decodeURIComponent.
function safeDecodeURIComponent(str) {
    return decodeURIComponent(str.replace(
        /%(?![0-9a-fA-F]{2})/g,
        '%25'
    ));
}

chrome.webRequest.onBeforeRequest.addListener(
    d => {
        const urlObj = new URL(d.url);
        let relativePath = safeDecodeURIComponent(urlObj.pathname);

        // Strip the leading slash so Node treats it as relative to the app root
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }

        // Figure out where the app root is, and what path was originally asked for
        const appRoot = path.resolve(".");
        const requestedAbsPath = path.resolve(relativePath);

        const actualAbsPath = resolveCaseInsensitive(requestedAbsPath);

        if (requestedAbsPath === actualAbsPath) {
            return {};
        }

        const correctedRelativePath = path.relative(appRoot, actualAbsPath);
        const correctedUrlPath = correctedRelativePath.split(path.sep).join('/');

        const newUrl = `chrome-extension://${chrome.runtime.id}/${correctedUrlPath}${urlObj.search}${urlObj.hash}`;

        if (newUrl === d.url) {
            return {};
        }

        return { redirectUrl: newUrl };
    },
    {
        urls: [
            `chrome-extension://${chrome.runtime.id}/*`
        ]
    },
    ["blocking"]
);
