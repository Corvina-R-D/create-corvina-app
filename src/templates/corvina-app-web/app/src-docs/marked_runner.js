const path = require("path");
const process = require("process");
const fs = require("fs");
const Mustache = require("mustache");

const md = require("markdown-it")({ html: true });
const mk = require("@iktakahiro/markdown-it-katex");


// Simple plugin to customize the image URL
function mkImagePublicURL(md) {
  function generateAppPublicURL(url) {
    if (url.startsWith("/") || url.startsWith("./")) {
      const baseUrl = `docs/brands/${brandName}/${localeName}/`;
      return baseUrl + url.substring(2);
    }
    return url;
  }
  // Store the default image renderer
  const defaultRender =
    md.renderer.rules.image ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    if (srcIndex >= 0) {
      const src = token.attrs[srcIndex][1];
      token.attrs[srcIndex][1] = generateAppPublicURL(src);
    }
    return defaultRender(tokens, idx, options, env, self);
  };
}

md.use(mk);
md.use(mkImagePublicURL);

let vars = {};
const filePath = process.argv[process.argv.length - 1];
const filePathParts = filePath.split("/");
const brandName = filePathParts[2];
const localeName = filePathParts[3];
const baseFolder = process.cwd() + "/" + path.dirname(filePath);
try {
  const commonVars = require(baseFolder + "/../vars.js");
  vars = { ...vars, ...commonVars };
} catch (e) {
  console.warn("No common vars found in " + baseFolder + "/../vars.js");
}

try {
  const langVars = require(baseFolder + "/vars.js");
  vars = { ...vars, ...langVars };
} catch (e) {
  //console.warn("No language specific vars found in " + baseFolder)
}

let inputData = fs.readFileSync(process.argv[process.argv.length - 1]);
console.log(
  '<style>.katex-block .text {display:inline;}</style><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.11.1/katex.min.css" />' +
    md.render(Mustache.render(inputData.toString(), vars))
);
