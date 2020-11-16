ipcSend({ action: "get-fonts" });

function loadUseFonts() {
    global.fonts.forEach(fnt => {
        const opt = document.createElement("f-opt");
        opt.innerHTML = `<text style="font-family: ${fnt}">${fnt}</text><button onclick="removeSelectedFont(this);">-</button>`;
        $("#font-used").append(opt);
    });
}

loadUseFonts();

let installedFonts;
ipc["fonts"] = args => {
    installedFonts = args.fonts;
    installedFonts.forEach(font => {
        const opt = document.createElement("f-opt");
        opt.innerHTML = `<text style="font-family: ${font.name}">${font.name}</text><button onclick="addSelectedFont(this);">+</button>`;
        $("#font-available").append(opt);
    });
    global.fonts = args.useFonts;
    loadUseFonts();
    $$.all("f-emp").forEach(f => f.remove());
};

function removeSelectedFont(obj) {
    obj.parentElement.remove();
    global.fonts.remove($("text", obj.parentElement).innerHTML);
}

function addSelectedFont(obj) {
    const fnt = $("text", obj.parentElement).innerHTML;
    global.fonts.push(fnt);
    const opt = document.createElement("f-opt");
    opt.innerHTML = `<text style="font-family: ${fnt}">${fnt}</text><button onclick="removeSelectedFont(this);">-</button>`;
    $("#font-used").append(opt);
}

window.addEventListener("beforeunload", e => {
    ipcSend({ action: "set-fonts", fonts: global.fonts });

    return false;
});