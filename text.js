const canvas = $("#anim");
const ctx = canvas.getContext("2d");

function addText() {
    const t = document.createElement("a-text");
    $("#div-texts").append(t);
}

ipc["set-fonts"] = args => {
    global.fonts = args.fonts;
    $a("a-text div table tr td select").forEach(s => {
        s.innerHTML = "";
        global.fonts.forEach(fnt => {
            const opt = document.createElement("option");
            opt.innerHTML = fnt;
            s.append(opt);
        });
    });
};

ipcSend({ action: "load-fonts" });

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $a("a-text").forEach(t => {
        const text = $("[a-e='text']", t).value.split("");
        const kerning = parseInt($("[a-e='spacing']", t).value);
        const size = parseInt($("[a-e='size']", t).value);
        const font = $("[a-e='font']", t).value;
        const x = parseInt($("[a-e='position_x']", t).value);
        const y = parseInt($("[a-e='position_y']", t).value);
        const color = $("[a-e='color']", t).value;

        ctx.textAlign = "center";
        ctx.font = size + "px " + font;
        ctx.fillStyle = color;
        text.forEach((char, ix) => {
            ctx.fillText(char, canvas.width / 2 + kerning * (ix + (text.length + 1) / 2 - text.length) + x, canvas.height / 2 + y);
        });
    });
}