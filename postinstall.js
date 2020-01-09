#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var env = process.env;

fs.writeFileSync(
  path.resolve(__dirname, "install_env.json"),
  JSON.stringify({
    npm_config_global: env.npm_config_global,
    npm_node_execpath: env.npm_node_execpath,
    npm_execpath: env.npm_execpath
  })
);
