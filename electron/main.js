const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// In-memory or safe local storage for desktop credentials
const secureStore = new Map();

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEFAULT_URL = process.env.APP_URL || 'https://mailflow-ai-xi.vercel.app';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: 'MailFlow AI',
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready-to-show to prevent flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove default menu for a clean modern desktop feel (Alt can reveal if needed)
  mainWindow.setMenuBarVisibility(false);

  // Target URL: development port 3000 or production Vercel app
  const targetUrl = isDev && process.env.LOCAL_DEV ? 'http://localhost:3000' : DEFAULT_URL;
  console.log(`[MailFlow Desktop] Loading ${targetUrl}`);

  mainWindow.loadURL(targetUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default system browser, not inside the Electron app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('store-credential', async (_event, key, value) => {
  secureStore.set(key, value);
  return { success: true };
});

ipcMain.handle('get-credential', async (_event, key) => {
  return secureStore.get(key) || null;
});

ipcMain.handle('open-external', async (_event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
