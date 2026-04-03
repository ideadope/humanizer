// @ts-ignore
import "./wasm_exec.js";

declare var Go: any;

/** * Default to the CDN version of your engine package.
 * Update the version number here whenever you release a new @ideadope/humanizer-wasm
 */
const DEFAULT_WASM_URL =
  "https://unpkg.com/@ideadope/humanizer-wasm@1.0.0/dist/humanizer.wasm";

export async function loadHumanizer(wasmSource: string = DEFAULT_WASM_URL) {
  const go = new Go();

  if (typeof window !== "undefined") {
    // BROWSER LOGIC: Fetch from the provided URL (CDN or local public path)
    const response = await fetch(wasmSource);

    // Check if the fetch actually succeeded before instantiating
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Wasm from ${wasmSource}: ${response.statusText}`,
      );
    }

    const { instance } = await WebAssembly.instantiateStreaming(
      response,
      go.importObject,
    );
    go.run(instance);
  } else {
    // NODE.JS LOGIC: Read from the local filesystem path provided
    const fs = await import("node:fs");

    // If using the default URL in Node, the user might need to download it first,
    // or you can handle a remote fetch in Node if needed.
    // For now, we assume Node users pass a local absolute path.
    let wasmBuffer: Buffer;

    if (wasmSource.startsWith("http")) {
      // Optional: Add logic to fetch remote Wasm in Node if you want to support it
      const res = await fetch(wasmSource);
      wasmBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      wasmBuffer = fs.readFileSync(wasmSource);
    }

    const instance = await WebAssembly.instantiate(wasmBuffer, go.importObject);
    go.run(instance);
  }

  return (text: string): string => (globalThis as any).humanizeText(text);
}
