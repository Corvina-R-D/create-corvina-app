#!/usr/bin/env node

// run the script in /build folder based on current architecture
// if the current architecture is not supported, throw an error
// and exit the process

const { spawn } = require("child_process");
const { join } = require('path');
const os = require("os");

const platform = os.platform();
const arch = os.arch();

const supportedPlatforms = ["linux", "darwin", "windows"];

const supportedArchitectures = ["x64", "arm64"];

const supported =
  supportedPlatforms.includes(platform) &&
  supportedArchitectures.includes(arch);

if (!supported) {
  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

const mapNodejsArchToGo = {
  x64: "amd64",
  arm64: "arm64",
};

const script = `main.go-${platform}-${mapNodejsArchToGo[arch]}${platform === "windows" ? ".exe" : ""}`;

const binPath = join(__dirname, "..", "build", script);
const allArgs = process.argv.slice(2).join(" ");

// execute the script with all the arguments in interactive mode
// so that the user can interact with the script
spawn(`"${binPath}" ${allArgs}`, { stdio: "inherit", shell: true });


