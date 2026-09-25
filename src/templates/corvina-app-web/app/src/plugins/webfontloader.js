/**
 * plugins/webfontloader.js
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

export async function loadFonts() {
  const webFontLoader = await import(
    /* webpackChunkName: "webfontloader" */ "webfontloader"
  );

  webFontLoader.load({
    google: {
      families: [
        "Roboto:300,400,500,700,400italic",
        "Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,-50..200",
      ],
    },
  });
}