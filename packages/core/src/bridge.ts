/**
 * bridge.ts
 * Handled via script injection to bypass bundler proxy traps
 * and avoid "Maximum call stack" errors in production.
 */

// @ts-ignore
import wasmExecUrl from "./wasm_exec.js?url";

let bridgeLoadingPromise: Promise<void> | null = null;

export async function ensureGoRuntime(): Promise<void> {
  // 1. Return immediately if Go is already defined globally
  if (typeof (globalThis as any).Go !== "undefined") {
    return Promise.resolve();
  }

  // 2. Singleton promise to prevent multiple script tags being injected
  if (bridgeLoadingPromise) return bridgeLoadingPromise;

  bridgeLoadingPromise = new Promise<void>((resolve, reject) => {
    // Check again inside the promise just in case
    if ((globalThis as any).Go) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = wasmExecUrl;

    script.onload = () => {
      if ((globalThis as any).Go) {
        resolve();
      } else {
        reject(
          new Error("wasm_exec.js loaded but global Go object not found."),
        );
      }
    };

    script.onerror = () => {
      bridgeLoadingPromise = null; // Allow retry on failure
      reject(
        new Error(`Failed to load Go runtime bridge from: ${wasmExecUrl}`),
      );
    };

    document.head.appendChild(script);
  });

  return bridgeLoadingPromise;
}
