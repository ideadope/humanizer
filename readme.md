## humanizer
a go webassembly(wasm) port for filtering out hidden hexcodes from text

> [!NOTE]
> the package is in its early development, be causious!

## usage

```bash
npm install @ideadope/humanizer
```

```typescript
import { loadHumanizer } from "@ideadope/humanizer"

const humanized = await loadHumanizer("hello\u200B world")
console.log(humanized) // logs: hello world
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