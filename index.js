const { app, BrowserWindow, Menu, remote, ipcMain } = require('electron');
const fs = require('fs');
const getSystemFonts = require('get-system-fonts');

let w_main;
const global = {
    userdata: "user.json",
    save(key, val) {
        let txt = {};
        try {
            fs.accessSync(global.userdata);
            txt = JSON.parse(fs.readFileSync(global.userdata));
        } catch (e) {};
        txt[key] = val;
        fs.writeFileSync(global.userdata, JSON.stringify(txt));
    },
    load(key) {
        try {
            fs.accessSync(global.userdata);
            return JSON.parse(fs.readFileSync(global.userdata))[key];
        } catch (e) { return null; };
    },
    w_size: null
}

app.on('ready', () => {
    const s = global.load("window-size");
    if (!s) s = [ 800, 600 ];
    w_main = new BrowserWindow({ frame: false, width: s[0], height: s[1],
        webPreferences: { 
            preload: path.join(__dirname, "scripts/preload.js"), 
            nodeIntegration: false, 
            enableRemoteModule: false, 
            contextIsolation: true
        } });
    w_main.loadFile("index.html");
    w_size = w_main.getSize();
    w_main.on('resize', () => w_size = w_main.getSize());
    w_main.on('closed', () => {
        global.save("window-size", w_size);
        app.quit();
    });
    w_main.setMenu(Menu.buildFromTemplate(menu));

    const files = await getSystemFonts();
});

ipcMain.on(args, (event, args) => {
	args = JSON.parse(args);
	switch (args.action) {
		case "test":)

function post(msg) {
	w_main.webContents.send("app", msg);
}

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