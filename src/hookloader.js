// appendix: certain function such as resolution change might not work properly on some game
// especially with <resizable> being disabled on `package.json`. Even with that enabled doesn't help
// as `canvas` will still be the same size as the window, hardcoded.
nw.Window.get().setResizable(true);

// Some Windows-targeted applications expect LOCALAPPDATA.
// Provide a Linux fallback using XDG_DATA_HOME.
if (!process.env.LOCALAPPDATA && process.platform === "linux") {
  process.env.LOCALAPPDATA =
    process.env.XDG_DATA_HOME ||
    require("path").join(process.env.HOME, ".local", "share");
}


(() => {
  const hooks = [
    "./fs-hook.js",
    "./webrq-hook.js",
  ];

  for (const hook of hooks) {
    require(hook);
  }
})();
