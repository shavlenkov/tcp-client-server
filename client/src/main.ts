import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import * as net from 'net';

let win: BrowserWindow | null;
let main: net.Socket | null;

function createWindow() {
    win = new BrowserWindow({
        width: 900,
        resizable: false,
        height: 650,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.setMenu(null);
    win.loadFile('src/renderer/index.html');

    ipcMain.on('connect-to-server', (event: IpcMainEvent, { ip, port }: { ip: string; port: number }) => {
        main = new net.Socket();

        main.connect(port, ip, () => {
            console.log('Підключено до сервера');
            event.reply('connection-status', 'connected');
        });

        main.on('data', (data: Buffer) => {
            console.log(`Отримано дані від сервера: ${data.toString()}`);
        });

        main.on('close', () => {
            console.log('З\'єднання закрите');
            main = null;
        });

        main.on('error', (err: Error) => {
            console.error(`Помилка з'єднання: ${err.message}`);
            event.reply('connection-status', 'error');
            main = null;
        });
    });

    ipcMain.on('send-info', (event: IpcMainEvent, userInfo: string) => {
        if (main) {
            main.write(userInfo);
            console.log('Дані відправлені: ', userInfo);
        } else {
            console.log('Клієнт не підключений.');
        }
    });
}

app.whenReady().then(createWindow);
