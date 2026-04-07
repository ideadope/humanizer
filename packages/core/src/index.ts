/**
 * @file index.ts
 * @package @ideadope/humanizer
 * * This module provides a high-level, framework-agnostic wrapper for the
 * Go-based Humanizer WASM engine. It handles runtime initialization,
 * global bridge injection, and environment-specific WASM loading.
 */

import { ensureGoRuntime } from "./bridge.js";

/**
 * The default CDN URL for the pre-compiled WASM binary.
 * Using unpkg ensures version-pinned availability across web environments.
 */
const DEFAULT_WASM_URL =
  "https://unpkg.com/@ideadope/humanizer-wasm@1.0.0/dist/humanizer.wasm";

/**
 * Humanizer Class
 * * Implements a Singleton pattern to manage the Go WASM lifecycle.
 * Go WASM instances are stateful and can typically only be started once per runtime.
 */
export class Humanizer {
  private static instance: Humanizer;

  /** Indicates if the Go 'main' function has executed and registered global functions */
  private initialized = false;

  /** * A "Concurrency Lock" promise.
   * This prevents race conditions where multiple rapid calls to init()
   * might attempt to instantiate the WASM module simultaneously.
   */
  private initializing: Promise<void> | null = null;

  /** Private constructor to enforce Singleton pattern */
  private constructor() {}

  /**
   * Retrieves the global Humanizer singleton instance.
   */
  static getInstance(): Humanizer {
    if (!Humanizer.instance) {
      Humanizer.instance = new Humanizer();
    }
    return Humanizer.instance;
  }

  /**
   * Initializes the Go WASM runtime and the Humanizer engine.
   * * @param wasmUrl - The location of the .wasm binary. Defaults to the unpkg CDN.
   * @returns A promise that resolves once the Go runtime is active and 'humanizeText' is registered.
   * @throws Error if the bridge fails to load, the network request fails, or WASM instantiation errors out.
   */
  async init(wasmUrl: string = DEFAULT_WASM_URL): Promise<void> {
    // 1. Guard: If already initialized, resolve immediately.
    if (this.initialized) return;

    // 2. Concurrency Lock: If an initialization is already in progress,
    // return the existing promise so the caller waits for the same result.
    if (this.initializing) return this.initializing;

    // 3. Begin Initialization Pipeline
    this.initializing = (async (): Promise<void> => {
      try {
        /**
         * STEP A: Load the TinyGo/Go Bridge.
         * Injects 'wasm_exec.js' into the global scope. This must happen before
         * calling 'new Go()'.
         */
        await ensureGoRuntime();

        const G = globalThis as any;
        const GoClass = G.Go;
        const go = new GoClass();

        let wasmModule: WebAssembly.WebAssemblyInstantiatedSource;

        /**
         * STEP B: Environment-Agnostic Fetch/Load logic.
         * Handles Browsers (fetch/streaming) and Node.js (fs/buffer).
         */
        if (typeof window !== "undefined" || typeof fetch !== "undefined") {
          // BROWSER / MODERN NODE (v18+)
          const response = await fetch(wasmUrl);
          if (!response.ok)
            throw new Error(
              `WASM Fetch failed with status: ${response.status}`,
            );

          /**
           * WebAssembly.instantiateStreaming is the most performant way to load WASM,
           * as it compiles the module while it's still being downloaded.
           */
          if (typeof WebAssembly.instantiateStreaming === "function") {
            wasmModule = await WebAssembly.instantiateStreaming(
              response,
              go.importObject,
            );
          } else {
            // Fallback for older browsers or specific Node.js environments
            const bytes = await response.arrayBuffer();
            wasmModule = await WebAssembly.instantiate(bytes, go.importObject);
          }
        } else {
          // LEGACY NODE.JS / SERVER-SIDE FALLBACK
          const fs = await import("node:fs");
          const buf = wasmUrl.startsWith("http")
            ? Buffer.from(await (await fetch(wasmUrl)).arrayBuffer())
            : fs.readFileSync(wasmUrl);
          wasmModule = await WebAssembly.instantiate(buf, go.importObject);
        }

        /**
         * STEP C: Start the Go Instance.
         * The 'run' method invokes the Go 'main' function, which in our case
         * maps 'humanizeText' to the global JavaScript scope.
         */
        go.run(wasmModule.instance);
        this.initialized = true;
      } finally {
        // Reset the lock regardless of success or failure.
        // This allows a failed initialization to be retried on the next call.
        this.initializing = null;
      }
    })();

    return this.initializing;
  }

  /**
   * Humanizes robotic or AI-generated text.
   * * @param text - The raw string input to be processed by the Go engine.
   * @returns The humanized string output from the WASM runtime.
   * @throws Error if the engine has not been initialized.
   */
  humanize(text: string): string {
    if (!this.initialized) {
      throw new Error(
        "Humanizer: WASM not initialized. Call 'await loadHumanizer()' first.",
      );
    }

    /**
     * TinyGo maps functions to the global scope. We access this via globalThis
     * to maintain compatibility with different bundlers and runtimes.
     */
    const fn = (globalThis as any).humanizeText;

    if (!fn) {
      throw new Error(
        "Go function 'humanizeText' not found. Ensure that the WASM module successfully registered its exports.",
      );
    }

    return fn(text);
  }
}

/**
 * Convenience Exports
 */

/** The pre-instantiated singleton instance for application-wide use. */
export const humanizer = Humanizer.getInstance();

/** * A simplified helper to trigger initialization.
 * Often used in application entry points or router loaders.
 */
export const loadHumanizer = (url?: string) => humanizer.init(url);
