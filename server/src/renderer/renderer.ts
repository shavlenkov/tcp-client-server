import { ipcRenderer } from 'electron'

function getCurrentTime(): string {
    const now = new Date();

    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function addLog(message: string): void {
    const logDiv = document.getElementById('log') as HTMLDivElement;
    const newLog = document.createElement('div');
    newLog.classList.add('log-entry');
    newLog.innerHTML = message;
    logDiv.appendChild(newLog);
    logDiv.scrollTop = logDiv.scrollHeight;
}

interface ClientData {
    name: string;
    mobilePhone: string;
    yearOfBirth: string;
    knowledgeArea: string;
    comment: string;
}

interface ClientInfo {
    clientInfo: string;
    data: ClientData;
}

ipcRenderer.on('client-data', (event: Electron.IpcRendererEvent, { clientInfo, data }: ClientInfo) => {
    const { name, mobilePhone, yearOfBirth, knowledgeArea, comment } = data;

    addLog(`${getCurrentTime()} Received information packet from ${clientInfo}: \n${name}\n${mobilePhone}\n${yearOfBirth}\n${knowledgeArea}\n${comment}`);
});

ipcRenderer.on('client-connected', (event: Electron.IpcRendererEvent, clientInfo: string) => {
    addLog(`${getCurrentTime()} Client ${clientInfo} connected, status Online`);
});

ipcRenderer.on('client-disconnected', (event: Electron.IpcRendererEvent, clientInfo: string) => {
    addLog(`${getCurrentTime()} Client ${clientInfo} disconnected`);
});

interface Address {
    address: string;
    port: number;
}

ipcRenderer.on('server-info', (event: Electron.IpcRendererEvent, address: Address) => {
    addLog(`${getCurrentTime()} Server started on ${address.address}:${address.port}`);
    const ipAddressInput = document.getElementById('ip-address') as HTMLInputElement;
    ipAddressInput.value = address.address;
});

ipcRenderer.on('no-clients', () => {
    addLog(`${getCurrentTime()} No active connections...`);
});

ipcRenderer.on('client-list', (event: Electron.IpcRendererEvent, clientList: string[]) => {
    const clientCount = clientList.length;
    let clientText = '';

    if (clientCount === 1) {
        clientText = `${getCurrentTime()} 1 client connected:\n`;
    } else if (clientCount >= 2 && clientCount <= 4) {
        clientText = `${getCurrentTime()} ${clientCount} clients connected:\n`;
    } else {
        clientText = `${getCurrentTime()} ${clientCount} clients connected:\n`;
    }

    const clientListHTML = `<ul>${clientList.map(client => `<li>${client}, status Online</li>`).join('')}</ul>`;
    addLog(clientText + clientListHTML);
});

document.getElementById('start-server')?.addEventListener('click', () => {
    const portInput = document.getElementById('port') as HTMLInputElement;
    const intervalInput = document.getElementById('update-interval') as HTMLInputElement;

    const port = portInput.value;
    const interval = intervalInput.value;

    portInput.disabled = true;
    intervalInput.disabled = true;
    const startServerButton = document.getElementById('start-server') as HTMLButtonElement;
    startServerButton.disabled = true;
    startServerButton.style.backgroundColor = '#3c8fb0';

    ipcRenderer.send('start-server', { port, interval });
});
