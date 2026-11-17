/* eslint-disable @typescript-eslint/no-require-imports -- shim CommonJS untuk tsx */
// Untuk skrip tsx (fixture e2e): "server-only" diganti modul kosong agar modul server bisa diimpor di Node.
const Module = require("module");
const path = require("path");
const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return path.join(__dirname, "empty.cjs");
  return original.call(this, request, ...rest);
};
