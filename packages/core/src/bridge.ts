/**
 * @file bridge.ts
 * @package @ideadope/humanizer
 * * This module manages the loading of the TinyGo/Go WebAssembly bridge (wasm_exec.js).
 * * WHY SCRIPT INJECTION?
 * Standard ES imports of wasm_exec.js often trigger recursive "Maximum call stack"
 * errors in Vite/Rollup production builds. This happens because bundlers try to
 * wrap global mutations in proxies. By injecting a raw <script> tag, we bypass
 * the bundler's module resolution entirely, ensuring the 'Go' object is attached
 * directly to the global scope without interference.
 */

// @ts-ignore
/** * Uses Vite's '?url' suffix to get the resolved path to the asset instead
 * of attempting to parse the file as a JavaScript module.
 */
// @ts-ignore
import wasmExecUrl from "./wasm_exec.js?url";

/** * Internal cache for the loading process to ensure we don't
 * inject multiple <script> tags if ensureGoRuntime is called rapidly.
 */
let bridgeLoadingPromise: Promise<void> | null = null;

/**
 * Ensures that the TinyGo runtime bridge is available on the global scope.
 * * @returns A promise that resolves when 'globalThis.Go' is ready.
 * @throws Error if the script fails to load or the Go object is missing after load.
 */
export async function ensureGoRuntime(): Promise<void> {
  // 1. Fast Path: If Go is already defined globally (from a previous load
  // or a manual script tag in index.html), resolve immediately.
  if (typeof (globalThis as any).Go !== "undefined") {
    return Promise.resolve();
  }

  // 2. Concurrency Control: If the bridge is currently being fetched,
  // return the existing promise to avoid redundant network requests.
  if (bridgeLoadingPromise) return bridgeLoadingPromise;

  bridgeLoadingPromise = new Promise<void>((resolve, reject) => {
    // Re-verify existence inside the promise to handle edge-case race conditions
    if ((globalThis as any).Go) {
      resolve();
      return;
    }

    /**
     * Create a standard HTML script element.
     * This treats wasm_exec.js as a "Classic Script" rather than an "ES Module",
     * which is how TinyGo's glue code is designed to be executed.
     */
    const script = document.createElement("script");
    script.src = wasmExecUrl;

    // Ensure the script is loaded asynchronously to avoid blocking the main thread
    script.async = true;

    script.onload = () => {
      // Once the script is loaded and executed, check for the 'Go' constructor
      if ((globalThis as any).Go) {
        resolve();
      } else {
        reject(
          new Error(
            "wasm_exec.js loaded successfully, but 'globalThis.Go' is still undefined.",
          ),
        );
      }
    };

    script.onerror = () => {
      // Clear the promise on failure so that subsequent calls can try again
      bridgeLoadingPromise = null;
      reject(
        new Error(
          `Failed to load the Go runtime bridge from URL: ${wasmExecUrl}`,
        ),
      );
    };

    // Append to the document head to trigger the network request
    document.head.appendChild(script);
  });

  return bridgeLoadingPromise;
}
