## humanizer

a go webassembly(wasm) port for filtering out hidden hexcodes from text

> [!NOTE]
> the package is in its early development, be causious!

## installation

install the lightweight

```bash
npm install @ideadope/humanizer // installs the pure ts library
```

download the binary from cdn

```bash
https://unpkg.com/@ideadope/humanizer-wasm@1.0.0/dist/humanizer.wasm
```

```typescript
import { loadHumanizer } from "@ideadope/humanizer";

const humanize = await loadHumanizer("path-to-wasm-binary");

const output = humanize("hello\u200B world");
console.log(output); // logs: hello world
```

or install full-fledged library with wasm binary included

```bash
npm install @ideadope/humanizer-wasm
```

```typescript
import { loadHumanizer } from "@ideadope/humanizer-wasm";

const humanize = await loadHumanizer();

const output = humanize("hello\u200B world");
console.log(output); // logs: hello world
```

## project structure

```
humanizer/
├── apps/
│   └── demo/               # A demo app to test the Wasm in node enviroment
├── packages/
│   ├── core/               # The main Wasm + JS Glue package
│   │   ├── src/            # Go and TS source
│   │   ├── dist/           # Compiled Wasm/JS/D.TS
│   │   └── package.json
│   └── types/              # (Optional) Shared TS interfaces
├── scripts/                # Shared build bash/python scripts
├── package.json            # Root package (defines workspaces)
├── turbo.json              # (Optional) Build cache config [planned]
└── tsconfig.json           # Base TS config that others inherit from
```

contributions are welcome

made with ❤️ by ideadope
