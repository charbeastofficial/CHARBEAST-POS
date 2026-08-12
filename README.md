# CharBeast POS

Electron + React desktop till.

## Development

```powershell
npm install
npm run electron:dev
```

## Building an installer

```powershell
npm run electron:build
```

Output goes to `release/`. Distribute the installer manually — there is no
auto-update; reinstall on each till when you cut a new build.
