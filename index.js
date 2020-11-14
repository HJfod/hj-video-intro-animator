const { app, BrowserWindow, Menu } = require('electron');

let w_main;

app.on('ready', () => {
    w_main = new BrowserWindow();
    w_main.loadFile("index.html");
    w_main.on('closed', () => app.quit());
    w_main.setMenu(Menu.buildFromTemplate(menu));
});

const menu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: 'Alt + F4',
                click: e => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Dev',
        submenu: [
            { role: 'reload' },
            { role: 'toggledevtools' }
        ]
    }
];