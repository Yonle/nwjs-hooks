// appendix: certain function such as resolution change might not work properly on some game
// especially with <resizable> being disabled on `package.json`. Even with that enabled doesn't help
// as `canvas` will still be the same size as the window, hardcoded.
nw.Window.get().setResizable(true);

(() => {
  const hooks = [
    "./fs-hook.js",
    "./webrq-hook.js",
  ];

  for (const hook of hooks) {
    require(hook);
  }
})();
