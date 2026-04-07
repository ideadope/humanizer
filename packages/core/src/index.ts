// @ts-ignore
import "./wasm_exec.js";

declare var Go: any;

const DEFAULT_WASM_URL =
  "https://unpkg.com/@ideadope/humanizer-wasm@1.0.0/dist/humanizer.wasm";

export interface HumanizerConfig {
  wasmSource?: string;
}

class Humanizer {
  private static instance: Humanizer | null = null;
  private isInitialized = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Singleton Accessor: Ensures we don't instantiate multiple Go runtimes
   */
  public static getInstance(): Humanizer {
    if (!Humanizer.instance) {
      Humanizer.instance = new Humanizer();
    }
    return Humanizer.instance;
  }

  /**
   * Core Loader: Handles Browser vs Node environment and initialization state
   */
  public async init(config: HumanizerConfig = {}): Promise<void> {
    if (this.isInitialized) return;
    if (this.loadPromise) return this.loadPromise;

    const wasmSource = config.wasmSource || DEFAULT_WASM_URL;

    this.loadPromise = (async () => {
      try {
        const go = new Go();
        let instance: WebAssembly.Instance;

        if (typeof window !== "undefined") {
          const response = await fetch(wasmSource);
          if (!response.ok)
            throw new Error(`Wasm fetch failed: ${response.statusText}`);

          const result = await WebAssembly.instantiateStreaming(
            response,
            go.importObject,
          );
          instance = result.instance;
        } else {
          const fs = await import("node:fs");
          let wasmBuffer: Buffer;

          if (wasmSource.startsWith("http")) {
            const res = await fetch(wasmSource);
            wasmBuffer = Buffer.from(await res.arrayBuffer());
          } else {
            wasmBuffer = fs.readFileSync(wasmSource);
          }

          const result = await WebAssembly.instantiate(
            wasmBuffer,
            go.importObject,
          );
          instance = (result as any).instance || result;
        }

        go.run(instance);
        this.isInitialized = true;
      } catch (error) {
        this.loadPromise = null; // Allow retry on failure
        throw error;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Feature: Basic Humanization
   * Easily scalable: Add more methods here as your Go main.go grows
   */
  public humanize(text: string): string {
    this.ensureInitialized();
    return (globalThis as any).humanizeText(text);
  }

  /**
   * Internal guard to ensure WASM is ready before method calls
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Humanizer not initialized. Call .init() first.");
    }
  }
}

// Export a singleton instance and a helper function for convenience
const humanizer = Humanizer.getInstance();

// initialize and return the instance
export async function loadHumanizer(wasmSource?: string) {
  await humanizer.init({ wasmSource });
  return humanizer;
}

export default humanizer;
