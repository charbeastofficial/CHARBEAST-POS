// Electron main process for the CharBeast POS desktop app.
//
// Printing: a raw ESC/POS-over-TCP relay straight to the thermal printer's
// network port. Since this process is a persistent Node backend with real
// socket access, there's no need for a separate service, a port, or a shared
// auth token -- the renderer reaches it over Electron's own IPC, which
// nothing outside this app can call.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const net = require('node:net');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3001';
const CONNECT_TIMEOUT_MS = 8000;
const CHECK_TIMEOUT_MS = 5000;

let mainWindow = null;

function sendReceipt(ip, port, bytes) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out connecting to printer at ${ip}:${port}`));
    }, CONNECT_TIMEOUT_MS);

    socket.connect(port, ip, () => {
      socket.write(Buffer.from(bytes), () => {
        // Give the printer a moment to absorb all bytes before closing,
        // preventing truncated receipts on some thermal printers.
        setTimeout(() => socket.end(), 200);
      });
    });

    socket.on('close', () => {
      clearTimeout(timer);
      resolve();
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function checkReachable(ip, port) {
  return new Promise((resolve) => {
    let done = false;
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ reachable: false, error: 'Connection timed out' });
    }, CHECK_TIMEOUT_MS);

    socket.connect(port, ip, () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.end();
      resolve({ reachable: true });
    });

    socket.on('error', () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ reachable: false, error: 'Connection refused' });
    });
  });
}

ipcMain.handle('printer:send', async (_event, { ip, port, bytes }) => {
  if (!ip || !bytes) return { ok: false, error: 'Missing printer IP or receipt data.' };
  try {
    await sendReceipt(ip, port || 9100, bytes);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('printer:check', async (_event, { ip, port }) => {
  if (!ip) return { reachable: false, error: 'Missing printer IP.' };
  return checkReachable(ip, port || 9100);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    backgroundColor: '#181008',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
