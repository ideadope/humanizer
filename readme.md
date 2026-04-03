```
humanizer/
├── apps/
│   └── demo/               # A Vite/React app to test the Wasm in browser
├── packages/
│   ├── core/               # The main Wasm + JS Glue package
│   │   ├── src/            # Go and TS source
│   │   ├── dist/           # Compiled Wasm/JS/D.TS
│   │   └── package.json
│   └── types/              # (Optional) Shared TS interfaces
├── scripts/                # Shared build bash/python scripts
├── package.json            # Root package (defines workspaces)
├── turbo.json              # (Optional) Build cache config
└── tsconfig.json           # Base TS config that others inherit from
```
