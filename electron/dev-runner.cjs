// Launches Electron with ELECTRON_RUN_AS_NODE fully removed from the
// environment. Some terminals/IDEs set this var globally for their own
// subprocess tooling, and Electron treats its mere *presence* (not
// truthiness) as "run as plain Node instead of the real app" -- so setting
// it to an empty string (e.g. via cross-env VAR=) isn't enough; it has to be
// deleted from the environment entirely before spawning electron.
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require('node:child_process');
const electronPath = require('electron');

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
