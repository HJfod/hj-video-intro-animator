'use strict';
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require("path");
const fontkit = require('fontkit');
const getSystemFonts = require('get-system-fonts');
const { exec } = require("child_process");

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
    renderSettings: {},
    renderTempDir: "__TEMP_DIR_HJVIA_FRAMES",
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
    icon: "via.ico",
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
    let w_size = w_main.getSize();
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
        case "load":
            const f = global.load("fonts");
            const t = fs.readFileSync("templates.json");
            post({ action: "templates", templates: JSON.parse(t) });
            
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
        case "try-render":
            exec("ffmpeg", (err, out) => {
                if (err.message.substring(err.message.indexOf("\n") + 1).startsWith("ffmpeg version "))
                    post({ action: "can-render", can: true });
                else post({ action: "can-render", can: false, error: err.message });
            });
            break;
        case "select-export-path":
            try {
                const p = dialog.showOpenDialogSync({ properties: ["openDirectory"] })[0];
                post({ action: "selected-export-path", path: p });
            } catch(e) {}
            break;
        case "init-render":
            try {
                fs.accessSync(args.settings.path);

                global.renderSettings = args.settings;
                global.renderSettings.frameDir = path.join(args.settings.path, global.renderTempDir);
                
                try {
                    fs.accessSync(global.renderSettings.frameDir);
                    rmDir(global.renderSettings.frameDir, false);
                } catch (err) {
                    fs.mkdirSync(global.renderSettings.frameDir);
                }
                post({ action: "start-render" });
            } catch (e) {
                post({ action: "render-error", error: e.message });
            }
            break;
        case "rendered-frame":
            try {
                const buf = Buffer.from(args.data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
                fs.writeFileSync(`${global.renderSettings.frameDir}\\f_${args.frame}.png`, buf);
            } catch (e) {
                post({ action: "render-error", error: e.message });
            }
            break;
        case "render-create-video":
            try {
                const out = path.join(global.renderSettings.path, global.renderSettings.name);
                try {
                    fs.accessSync(out);
                    fs.unlinkSync(out);
                } catch (n_e) {};

                exec(`
                    ffmpeg
                    -framerate ${global.renderSettings.fps}
                    -i "${global.renderSettings.frameDir}\\f_%d.png"
                    -c:v libx264
                    -b:v ${global.renderSettings.bitrate}K
                    -r ${global.renderSettings.fps}
                    -pix_fmt yuv420p
                    -vf scale=${global.renderSettings.size[0] + ":" + global.renderSettings.size[1]}
                    -crf ${global.renderSettings.crf}
                    "${out}"
                `.replace(/\n/g, ""), (err, outp) => {
                    rmDir(global.renderSettings.frameDir, true);
                    if (err)
                        post({ action: "render-error", error: err.message });
                    else
                        post({ action: "render-finished", output: out });
                });
            } catch (e) {
                post({ action: "render-error", error: e })
            }
            break;
        case "open-file-explorer":
            shell.showItemInFolder(args.path.replace(/\//g, "\\"));
            break;
        case "open-web":
            shell.openExternal(args.page);
            break;
}});

function rmDir(dirPath, rem = false) {
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach(f => {
        const filePath = dirPath + '/' + f.name;
        if (f.isFile()) fs.unlinkSync(filePath);
        else rmDir(filePath);
    });
    if (rem) fs.rmdirSync(dirPath);
};

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