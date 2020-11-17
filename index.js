const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require("path");
const fontkit = require('fontkit');
const getSystemFonts = require('get-system-fonts');

let w_main, w_fonts;
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
    fonts: [],
    fontsInUse: [],
    presetExt: "prst",
    presetFolder: "presets",
    w_size: null
}

let s = global.load("window-size");
if (!s) s = [ 800, 600 ];
const brow = {
    frame: false,
    width: s[0],
    height: s[1],
    webPreferences: { 
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        enableRemoteModule: false,
        contextIsolation: true
    }
};

try {
    fs.accessSync(global.presetFolder);
} catch (e) {
    fs.mkdirSync(global.presetFolder);
}

app.on('ready', () => {
    w_main = new BrowserWindow(brow);
    w_main.loadFile("index.html");
    w_size = w_main.getSize();
    w_main.on('resize', () => w_size = w_main.getSize());
    w_main.on('closed', () => {
        w_main = null;
        global.save("window-size", w_size);
        global.save("fonts", global.fontsInUse);
        app.quit();
    });
    w_main.setMenu(Menu.buildFromTemplate(menu));
});

ipcMain.on("app", (event, args) => {
	args = JSON.parse(args);
	switch (args.action) {
		case "get-fonts":
            if (!global.fonts[0])
                getSystemFonts().then(fnt => {
                    fnt.forEach(f => {
                        try {
                            global.fonts.push({ name: fontkit.openSync(f).fullName, path: f });
                        } catch(e) {};
                    });
                    post({ action: "fonts", fonts: global.fonts, useFonts: global.fontsInUse }, w_fonts);
                }).catch(e => { console.log(e); });
            else post({ action: "fonts", fonts: global.fonts, useFonts: global.fontsInUse }, w_fonts);
            break;
        case "set-fonts":
            post({ action: "set-fonts", fonts: args.fonts });
            global.fontsInUse = args.fonts;
            break;
        case "load-fonts":
            const f = global.load("fonts");
            if (f) {
                global.fontsInUse = f;
                post({ action: "set-fonts", fonts: global.fontsInUse });
            }
            break;
        case "list-presets":
            const list = [];
            fs.readdirSync(global.presetFolder, { withFileTypes: true }).forEach(f => {
                if (f.isFile() && f.name.endsWith(`.${global.presetExt}`))
                    list.push({ name: JSON.parse(fs.readFileSync(`${global.presetFolder}\\${f.name}`)).name, path: `${global.presetFolder}\\${f.name}` });
            });
            post({ action: "presets-list", list: list });
            break;
        case "save-preset":
            fs.writeFileSync(`${global.presetFolder}\\${args.value.name}.${global.presetExt}`, JSON.stringify(args.value));
            break;
        case "load-preset":
            const data = fs.readFileSync(args.preset);
            post({ action: "loaded-preset", data: data.toString() });
            break;
        case "open":
            w_fonts = new BrowserWindow(brow);
            w_fonts.loadFile(args.window);
            break;
}});

function post(msg, w = w_main) {
    if (w) w.webContents.send("app", msg);
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