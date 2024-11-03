import { app, BrowserWindow, ipcMain } from 'electron';
import * as net from 'net';
import * as os from 'os';

let mainWindow: BrowserWindow | null;
let clients: Array<{ socket: net.Socket; clientInfo: string }> = [];
let updateInterval: number = 5000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        resizable: false,
        height: 650,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile('src/renderer/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function getNetworkIP(): string {
    const interfaces = os.networkInterfaces();
    for (const iface in interfaces) {
        for (const alias of interfaces[iface] || []) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

ipcMain.on('start-server', (event, { port, interval }: { port: number; interval?: number }) => {
    updateInterval = interval || 5000;
    startServer(port);
});

function startServer(port: number = 3000) {
    const networkIP = getNetworkIP();

    const server = net.createServer((socket: net.Socket) => {
        const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`Client connected: ${clientInfo}`);

        clients.push({ socket, clientInfo });

        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('client-connected', clientInfo);
        }

        socket.on('data', (data: Buffer) => {
            console.log(`Received data from ${clientInfo}: ${data.toString()}`);

            const [name, mobilePhone, yearOfBirth, knowledgeArea, comment] = data.toString().split(";");

            if ((name && mobilePhone && yearOfBirth && knowledgeArea && comment) && data.toString().split(";").length === 5) {
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('client-data', {
                        clientInfo: clientInfo,
                        data: {
                            name,
                            mobilePhone,
                            yearOfBirth,
                            knowledgeArea,
                            comment
                        }
                    });

                    socket.write('\x1b[32mInformation package has been sent\x1b[0m\n');
                }
            } else {
                socket.write("\x1b[31mIncorrect format\x1b[0m\n");
            }
        });

        socket.on('end', () => {
            console.log(`Client disconnected: ${clientInfo}`);
            clients = clients.filter(c => c.socket !== socket);

            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('client-disconnected', clientInfo);
            }
        });

        socket.on('error', (err: Error) => {
            console.error(`Error with client ${clientInfo}: ${err.message}`);
        });
    });

    server.listen(port, networkIP, () => {
        const address = server.address();
        if (address) {
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('server-info', address);
            }
        }
    });

    setInterval(() => {
        if (clients.length === 0) {
            console.log("No connected clients.");
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('no-clients');
            }
        } else {
            console.log("Connected clients:");
            const clientInfoList = clients.map(c => c.clientInfo);
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('client-list', clientInfoList);
            }
        }
    }, updateInterval * 1000);
}