import path from "node:path";

/** Konstanta data uji e2e (tanpa impor modul server agar aman diimpor oleh spec). */
export const E2E = {
  password: "zz-e2e-password-panjang-123",
  contributor: "zz-e2e-kontributor@example.org",
  editor: "zz-e2e-editor@example.org",
  stateFile: path.join(__dirname, ".state.json"),
};
