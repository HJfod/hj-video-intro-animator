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

$("#overlay-title").addEventListener("mousedown", e => e.target.setAttribute("w-moving", ""));
document.addEventListener("mouseup", e => $("#overlay-title").removeAttribute("w-moving"));
document.addEventListener("mousemove", e => {
    if ($("#overlay-title").hasAttribute("w-moving")) {
        const p = $("#overlay-title").parentElement;
        p.style.top = `calc( ${e.pageY}px - var(--s-titlebar) - var(--s-p-head) / 2 )`;
        p.style.left = (e.pageX - $$.get(p.style.width) / 2) + "px";
    }
});

function showOverlay(sett, content) {
    return new Promise((resolve, reject) => {
        $("#overlay").setAttribute("show", "");

        const res = msg => {
            $("#overlay").removeAttribute("show");
            resolve(msg);
        };
        const rej = err => {
            $("#overlay").removeAttribute("show");
            reject(err);
        };

        const ow = $("#overlay-window");
        ow.style.width = sett.size[0] + "px";
        ow.style.height = sett.size[1] + "px";
        ow.style.top = `calc( 50% - ${sett.size[1] / 2}px )`;
        ow.style.left = `calc( 50% - ${sett.size[0] / 2}px )`;

        const oc = $("#overlay-content");
        oc.innerHTML = content;

        $("#overlay-title text").innerHTML = sett.title;
        $("#overlay-title button").addEventListener("click", e => rej("Closed"));

        $$.all("[resolve-click]", oc).forEach(x => {
            x.addEventListener("click", e => {
                const c = x.getAttribute("resolve-click");
                let a = [c];
                if (c.includes("&"))
                    a = c.split("&");
                const r = [];
                a.forEach(l => 
                    r.push(
                        l.split("|")[1].startsWith("%") ?
                        $(l.split("|")[0], ow).getAttribute(l.split("|")[1].substring(1)) :
                        $(l.split("|")[0], ow)[l.split("|")[1]]
                    )
                );
                res(r);
            });
        });
    });
}

$("#timeline").setAttribute("max", global.frame.max);
$("#timeline").setAttribute("min", 0);
$("#timeline").value = global.frame.current;
$("#timeline").addEventListener("input", e => {
    global.frame.current = $("#timeline").value;
    draw();
});

function editSettings() {
    showOverlay({ title: "Animation settings", size: [400, 200] },
        `
        <text>Length (frames):</text><p-buff></p-buff><input id='anim-len-set' value=${global.frame.max}>
        <br><br>
        <text>Name:</text><p-buff></p-buff><input id='anim-name-set' value=${global.name}>
        <br><br>
        <button resolve-click='#anim-len-set|value&#anim-name-set|value'>Apply</button>
        `
    ).then(res => {
        global.frame.max = parseInt(res[0]);
        $("#timeline").setAttribute("max", global.frame.max);
        $$.all("[a-e='start']").forEach(x => x.setAttribute("max", global.frame.max));
        $$.all("[a-e='end']").forEach(x => x.setAttribute("max", global.frame.max));
        global.name = res[1];
        draw();
    }).catch(err => {});
}

$("#tl-play").addEventListener("click", e => {
    if (global.frame.play) {
        cancelAnimationFrame(global.frame.play);
        global.frame.play = null;
    } else play();
    $("#tl-play").innerHTML = global.frame.play == null ? "Play" : "Stop";
});
$("#tl-length").addEventListener("click", e => {
    editSettings();
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
        const opacity = parseInt($("[a-e='opacity']", t).value);
        const x = parseInt($("[a-e='position_x']", t).value);
        const y = parseInt($("[a-e='position_y']", t).value);
        const color = $("[a-e='color']", t).value;

        const events = {
            size: [],
            spacing: [],
            opacity: [],
            position_x: [],
            position_y: [],
            parse: (event, index) => {
                let res = 0;
                events[event].forEach(e => {
                    res += Easing[e.easing](
                        global.frame.current,
                        e.start + e.interval * (e.reverse ? text.length - index - 1 : index),
                        e.end - e.start,
                        0,
                        e.amount
                    );
                });
                return res;
            }
        };

        $$.all("a-event div table", t).forEach(ev => {
            events[$("[a-e='affect']", ev).value.toLowerCase().replace(/\s/g, "_")].push({
                easing: $("[a-e='easing']", ev).value.replace(/\s/g, ""),
                start: parseInt($("[a-e='start']", ev).value),
                end: parseInt($("[a-e='end']", ev).value),
                amount: parseInt($("[a-e='amount']", ev).value),
                interval: $("[a-e='modify']", ev).value == "Whole text" ? 0 : parseInt($("[a-e='interval']", ev).value),
                reverse: $("[a-e='modify']", ev).value == "Whole text" ? false : $("[a-e='reverse']", ev).checked
            });
        });

        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        text.forEach((char, ix) => {
            ctx.font = (size + events.parse("size", ix)) + "px " + font;
            ctx.globalAlpha = ((opacity + events.parse("opacity", ix)) / 100);
            ctx.fillText(
                char,
                canvas.width / 2 + (kerning + events.parse("spacing", ix)) * (ix + (text.length + 1) / 2 - text.length) + x + events.parse("position_x", ix),
                canvas.height / 2 + y + events.parse("position_y", ix)
            );
        });
    });
}

ipc["presets-list"] = args => {
    let plist = "";
    args.list.forEach(f => plist += `<f-opt f-path='${f.path}'>${f.name}</f-opt>`);
    showOverlay({ title: "Load preset", size: [500, 350] },
        `
        <f-sel size=4 id="preset-list" style="height: 200px" resolve-click="f-opt:hover|%f-path">${plist}</f-sel>
        `
        //  <br><br>
        //  <button onclick='ipcSend({ action: "load-preset-from-file" })'>Load from file</button>
    ).then(res => 
        ipcSend({ action: "load-preset", preset: res[0] })
    ).catch(err => {});
};

ipc["loaded-preset"] = args => {
    console.log(JSON.parse(args.data));
};

class preset {
    static save() {
        const res = {
            name: global.name,
            fps: global.frame.fps,
            length: global.frame.max,
            texts: []
        };

        $$.all("a-text").forEach(t => {
            const anim = {
                size: [],
                spacing: [],
                opacity: [],
                position_x: [],
                position_y: []
            };

            $$.all("a-event div table", t).forEach(ev => {
                anim[$("[a-e='affect']", ev).value.toLowerCase().replace(/\s/g, "_")].push({
                    easing: $("[a-e='easing']", ev).value.replace(/\s/g, ""),
                    modify: $("[a-e='modify']", ev).value,
                    start: parseInt($("[a-e='start']", ev).value),
                    end: parseInt($("[a-e='end']", ev).value),
                    amount: parseInt($("[a-e='amount']", ev).value),
                    interval: $("[a-e='modify']", ev).value == "Whole text" ? 0 : parseInt($("[a-e='interval']", ev).value),
                    reverse: $("[a-e='modify']", ev).value == "Whole text" ? false : $("[a-e='reverse']", ev).checked
                });
            });

            res.texts.push({
                text: $("[a-e='text']", t).value,
                spacing: parseInt($("[a-e='spacing']", t).value),
                size: parseInt($("[a-e='size']", t).value),
                font: $("[a-e='font']", t).value,
                opacity: parseInt($("[a-e='opacity']", t).value),
                position_x: parseInt($("[a-e='position_x']", t).value),
                position_y: parseInt($("[a-e='position_y']", t).value),
                color: $("[a-e='color']", t).value,
                animations: anim
            });
        });

        ipcSend({ action: "save-preset", value: res });
    }
    static select() {
        showOverlay({ title: "Loading presets", size: [500, 350] },
            `
            <text>Loading presets...</text>
            `
        ).then(res => {}).catch(err => {});
        ipcSend({ action: "list-presets" });
    }
}

function play() {
    global.frame.current++;
    if (global.frame.current > global.frame.max)
        global.frame.current = 0;

    draw();

    global.frame.play = requestAnimationFrame(play);
}

draw();