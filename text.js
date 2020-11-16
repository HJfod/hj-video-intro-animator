const canvas = $("#anim");
const ctx = canvas.getContext("2d");

function addText() {
    const t = document.createElement("a-text");
    $("#div-texts").append(t);
}

ipc["set-fonts"] = args => {
    global.fonts = args.fonts;
    $$.all("a-text div table tr td select").forEach(s => {
        s.innerHTML = "";
        fromArray(s, global.fonts);
    });
};

ipcSend({ action: "load-fonts" });

$("#timeline").setAttribute("max", global.frame.max);
$("#timeline").setAttribute("min", 0);
$("#timeline").value = global.frame.current;
$("#timeline").addEventListener("input", e => {
    global.frame.current = $("#timeline").value;
    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $("#timeline").value = global.frame.current;
    $("#tl-current").innerHTML = `Frame: ${global.frame.current} / ${global.frame.max}`;

    $$.all("a-text").forEach(t => {
        const text = $("[a-e='text']", t).value.split("");
        const kerning = parseInt($("[a-e='spacing']", t).value);
        const size = parseInt($("[a-e='size']", t).value);
        const font = $("[a-e='font']", t).value;
        const opacity = $("[a-e='opacity']", t).value;
        const x = parseInt($("[a-e='position_x']", t).value);
        const y = parseInt($("[a-e='position_y']", t).value);
        const color = $("[a-e='color']", t).value;

        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        ctx.font = size + "px " + font;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity / 100;
        text.forEach((char, ix) => {
            ctx.fillText(char, canvas.width / 2 + kerning * (ix + (text.length + 1) / 2 - text.length) + x, canvas.height / 2 + y);
        });
    });
}

draw();