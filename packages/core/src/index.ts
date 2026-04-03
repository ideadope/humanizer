// @ts-ignore
import "./wasm_exec.js";

declare var Go: any;

export async function loadHumanizer() {
  const go = new Go();
  const wasmUrl = new URL("./humanizer.wasm", import.meta.url).href;

  if (typeof window !== "undefined") {
    // BROWSER LOGIC
    const response = await fetch(wasmUrl);
    const { instance } = await WebAssembly.instantiateStreaming(
      response,
      go.importObject,
    );
    go.run(instance);
  } else {
    // NODE.JS LOGIC
    // We use dynamic imports so the browser doesn't try to fetch these
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const wasmPath = path.join(__dirname, "humanizer.wasm");

    const wasmBuffer = fs.readFileSync(wasmPath);
    const { instance } = await WebAssembly.instantiate(
      wasmBuffer,
      go.importObject,
    );
    go.run(instance);
  }

  return (text: string): string => (globalThis as any).humanizeText(text);
}
