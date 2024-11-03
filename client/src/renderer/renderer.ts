import { ipcRenderer } from 'electron'

let isConnected: boolean = false;

const controlsElement = document.getElementById('controls') as HTMLElement;
if (controlsElement) {
    controlsElement.style.display = 'none';
}

document.getElementById('connectBtn')?.addEventListener('click', () => {
    const ipInput = document.getElementById('ip') as HTMLInputElement;
    const portInput = document.getElementById('port') as HTMLInputElement;

    const ip: string = ipInput.value;
    const port: number = parseInt(portInput.value, 10);

    if (!ip || isNaN(port)) {
        alert("Please enter IP and Port.");
        return;
    }

    ipcRenderer.send('connect-to-server', { ip, port });

    ipcRenderer.once('connection-status', (event: Electron.IpcRendererEvent, status: string) => {
        if (status === 'connected') {
            isConnected = true;

            const connectForm = document.getElementById('connectForm') as HTMLElement;
            if (connectForm) {
                connectForm.style.paddingBottom = '20px';
                connectForm.style.borderBottom = '2px solid #52555c';
            }

            setTimeout(() => {
                ipInput.disabled = true;
                portInput.disabled = true;
                const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
                if (connectBtn) {
                    connectBtn.disabled = true;
                    connectBtn.style.backgroundColor = '#3c8fb0';
                }
            }, 100);

            if (controlsElement) {
                controlsElement.style.display = 'flex';
            }
        } else {
            alert("Failed to connect to the server.");
        }
    });
});

document.getElementById('sendBtn')?.addEventListener('click', () => {
    if (!isConnected) {
        alert("Please connect to the server first.");
        return;
    }

    const userInfo = {
        name: (document.getElementById('name') as HTMLInputElement).value,
        mobilePhone: (document.getElementById('mobilePhone') as HTMLInputElement).value,
        yearOfBirth: (document.getElementById('yearOfBirth') as HTMLInputElement).value,
        knowledgeArea: (document.getElementById('knowledgeArea') as HTMLInputElement).value,
        comment: (document.getElementById('comment') as HTMLTextAreaElement).value,
    };

    ipcRenderer.send('send-info', `${userInfo.name};${userInfo.mobilePhone};${userInfo.yearOfBirth};${userInfo.knowledgeArea};${userInfo.comment}`);
});
