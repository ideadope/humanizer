/**
 * index.ts
 */
import { ensureGoRuntime } from "./bridge.js";

const DEFAULT_WASM_URL =
  "https://unpkg.com/@ideadope/humanizer-wasm@1.0.0/dist/humanizer.wasm";

export class Humanizer {
  private static instance: Humanizer;
  private initialized = false;
  // Explicitly typed as Promise<void> | null
  private initializing: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): Humanizer {
    if (!Humanizer.instance) {
      Humanizer.instance = new Humanizer();
    }
    return Humanizer.instance;
  }

  /**
   * Initializes the Go WASM runtime.
   * Concurrent calls will wait for the same initialization promise.
   */
  async init(wasmUrl: string = DEFAULT_WASM_URL): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    // Assigning an async IIFE to the promise variable
    this.initializing = (async (): Promise<void> => {
      try {
        // 1. Ensure bridge is loaded globally
        await ensureGoRuntime();

        const G = globalThis as any;
        const GoClass = G.Go;
        const go = new GoClass();

        let wasmModule: WebAssembly.WebAssemblyInstantiatedSource;

        // 2. Environment-agnostic Fetch/Load
        if (typeof window !== "undefined" || typeof fetch !== "undefined") {
          const response = await fetch(wasmUrl);
          if (!response.ok)
            throw new Error(
              `WASM Fetch failed with status: ${response.status}`,
            );

          if (typeof WebAssembly.instantiateStreaming === "function") {
            wasmModule = await WebAssembly.instantiateStreaming(
              response,
              go.importObject,
            );
          } else {
            const bytes = await response.arrayBuffer();
            wasmModule = await WebAssembly.instantiate(bytes, go.importObject);
          }
        } else {
          // Node.js Fallback
          const fs = await import("node:fs");
          const buf = wasmUrl.startsWith("http")
            ? Buffer.from(await (await fetch(wasmUrl)).arrayBuffer())
            : fs.readFileSync(wasmUrl);
          wasmModule = await WebAssembly.instantiate(buf, go.importObject);
        }

        // 3. Start the Go instance
        go.run(wasmModule.instance);
        this.initialized = true;
      } finally {
        // Reset the lock so subsequent attempts can retry if this failed
        this.initializing = null;
      }
    })();

    return this.initializing;
  }

  humanize(text: string): string {
    if (!this.initialized) {
      throw new Error(
        "Humanizer: WASM not initialized. Call 'await loadHumanizer()' first.",
      );
    }

    const fn = (globalThis as any).humanizeText;
    if (!fn) {
      throw new Error(
        "Go function 'humanizeText' not found. Check if Go runtime is running.",
      );
    }

    return fn(text);
  }
}

export const humanizer = Humanizer.getInstance();
export const loadHumanizer = (url?: string) => humanizer.init(url);
