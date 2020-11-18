const canvas = $("#anim");
const ctx = canvas.getContext("2d");

function addText() {
    const t = document.createElement("a-text");
    $("#div-texts").append(t);
}

function addTemplate() {
    let t_string = "";
    global.templates.forEach(temp => t_string += `<f-opt>${temp.name}</f-opt>`);
    showOverlay({ title: "Add text from template", size: [400, 400] },
        `
        <f-sel id="_t_t_s" resolve-click='#_t_t_s f-opt:hover|innerHTML'>
            ${t_string}
        </f-sel>
        `
    ).then(res => {
        let text = {};
        global.templates.forEach(temp => {
            if (temp.name == res[0]) text = temp.template;
        });
        if (!text && res[0] != "Empty text") return;

        const t = document.createElement("a-text");
        $("#div-texts").append(t);
        
        $("[a-e='text']", t).value = text.text;
        $("[a-e='spacing']", t).value = text.spacing;
        $("[a-e='size']", t).value = text.size;
        $("[a-e='font']", t).value = text.font == null ? global.fonts[0] : text.font;
        $("[a-e='opacity']", t).value = text.opacity;
        $("[a-e='position_x']", t).value = text.position_x;
        $("[a-e='position_y']", t).value = text.position_y;
        $("[a-e='color']", t).value = text.color;
        //$("[a-e='glow']", t).value = text.glow;

        for (const [key, value] of Object.entries(text.animations))
            value.forEach(v => {
                const obj = v;
                v.affect = capitalize(key.replace(/\_/g, " "));
                t.addAnimation(v);
            });
        
        t.refresh();

        draw();
    }).catch(err => {});
}

ipc["set-fonts"] = args => {
    global.fonts = args.fonts;
    $$.all("a-text div table tr td select").forEach(s => {
        s.innerHTML = "";
        fromArray(s, global.fonts);
    });
};

ipc["templates"] = args => {
    global.templates = args.templates;
};

ipcSend({ action: "load" });

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

        if (sett.noclose) {
            $("#overlay-title button").setAttribute("disabled", "");

            resolve(true);
        } else {
            if ($("#overlay-title button").hasAttribute("disabled"))
                $("#overlay-title button").removeAttribute("disabled");
        
            $$.all("[resolve-click]", oc).forEach(x => {
                x.addEventListener("click", e => {
                    const c = x.getAttribute("resolve-click");
                    if (c == "") {
                        res("");
                        return;
                    }
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
        }
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
        <text>Name:</text><p-buff></p-buff><input id='anim-name-set' value='${global.name}'>
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
$("#tl-render").addEventListener("click", e => {
    ipcSend({ action: "try-render" });
});

function calcAR() {
    const d = gcd(parseInt($("#_w").value), parseInt($("#_h").value));
    $("#aspect-ratio").innerHTML = (parseInt($("#_w").value) / d) + ":" + (parseInt($("#_h").value) / d);
    if ($("#aspect-ratio").innerHTML != "16:9")
        $("#aspect-ratio").innerHTML += " (16:9 recommended!)";
}

function renderVideo(settings) {
    if (settings.path.startsWith("<")) return;

    ipcSend({ action: "init-render", settings: settings });
}

ipc["start-render"] = args => {
    $$.all("disable-on-render").forEach(d => d.style.pointerEvents = "none");
    showOverlay({ title: "Rendering", size: [300, 200], noclose: true },
        `
        <align-center>
            <text id="_r_prog">Rendering...</text>
        </align-center>
        `
    ).then(wres => {
        global.frame.current = 0;
        global.frame.render = true;
        play(true);
    }).catch(err => {});
};

ipc["render-error"] = args => {
    global.frame.render = false;
    $$.all("disable-on-render").forEach(x => x.style.pointerEvents = "initial")
    showOverlay({ title: "Unable to render!", size: [400, 400] },
        `
        <h3>Unable to render!</h3><br>
        <text>Error:</text>
        <br><br>
        <text>${args.error}</text>
        <br><br>
        <button resolve-click=''>Ok</button>
        `
    ).then(wres => {}).catch(err => {});
};

ipc["render-finished"] = args => {
    $$.all("disable-on-render").forEach(x => x.style.pointerEvents = "initial")
    showOverlay({ title: "Render finished", size: [400, 400] },
        `
        <h3>Succesfully rendered!</h3><br>
        <text>Path:</text><text>${args.output}</text>
        <br><br>
        <button resolve-click=''>Ok</button>
        <button onclick='ipcSend({ action: "open-file-explorer", path: "${args.output.replace(/\\/g, "/")}" })'>Open Result</button>
        `
    ).finally(res => {});
};

ipc["selected-export-path"] = args => $("#_e_p").innerHTML = `${args.path}\\`;

ipc["can-render"] = args => {
    if (args.can) {
        const defBitRate = global.defaults.video.bitrate;
        const vidType = "mp4";

        showOverlay({ title: "Render settings", size: [700, 600] },
            `
            <h3>Render video</h3>
            <text>Size:</text>
            <br>
            <input size=3 id="_w" maxlength=5 value=1920 oninput='calcAR()'>
            <text> x </text>
            <input id="_h" size=3 maxlength=5 value=1080 oninput='calcAR()'>
            <p-buff></p-buff>
            <text>Aspect ratio: </text><text id="aspect-ratio">16:9</text>
            <br><br>
            <text>Bitrate (kb/s):</text>
            <br>
            <input type="range" style='width: 80%' id="_r_r" value=${defBitRate} min=100 max=50000 oninput='$("#_r_v").value = this.value'>
            <input id="_r_v" value=${defBitRate} oninput='if (!isNaN(this.value)) $("#_r_r").value = parseInt(this.value)'>
            <br><br>
            <text>Name:</text>
            <p-buff></p-buff>
            <input value='${global.name}' oninput='$("#_e_f").innerHTML = this.value'>
            <br><br>
            <button onclick="ipcSend({ action: 'select-export-path' })">Select Output Directory</button>
            <p-buff></p-buff>
            <text>Path:</text>
            <text id="_e_p">&lt;No directory set&gt;</text>
            <text id="_e_f">${global.name}</text>
            <text>.${vidType}</text>
            <br><br><br>
            <button onclick='renderVideo({
                size: [
                    parseInt($("#_w").value),
                    parseInt($("#_h").value)
                ],
                sec: ${global.frame.max / global.frame.fps},
                bitrate: parseInt($("#_r_r").value),
                crf: ${global.defaults.video.crf},
                fps: ${global.frame.fps},
                path: $("#_e_p").innerHTML,
                name: $("#_e_f").innerHTML + "." + "${vidType}"
            })'>Render</button>
            <p-buff></p-buff>
            <text id="_rend_prog"></text>
            `
        ).then(wres => {}).catch(err => {});
    } else {
        showOverlay({ title: "Unable to render!", size: [400, 400] },
            `
            <h3>Unable to render!</h3><br>
            <text>It appears FFmpeg is not installed on your system. Please install FFmpeg from here:</text>
            <br><br>
            <a-link onclick="ipcSend({ action: 'open-web', page: 'https://ffmpeg.org/download.html' });">FFmpeg download</a-link>
            <br><br>
            <details>
            <summary>Details</summary>
            <text>${args.error}</text>
            </details>
            <br><br>
            <button resolve-click=''>Ok</button>
            `
        ).then(wres => {}).catch(err => {});
    }
};

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        const glow = 0; //parseInt($("[a-e='glow']", t).value);

        const events = {
            size: [],
            spacing: [],
            opacity: [],
            position_x: [],
            position_y: [],
            glow: [],
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

        const drawChar = (char, ix) => {
            ctx.font = (size + events.parse("size", ix)) + "px " + font;
            ctx.globalAlpha = ((opacity + events.parse("opacity", ix)) / 100);
            ctx.fillText(
                char,
                canvas.width / 2 + (kerning + events.parse("spacing", ix)) * (ix + (text.length + 1) / 2 - text.length) + x + events.parse("position_x", ix),
                canvas.height / 2 + y + events.parse("position_y", ix)
            );
        }

        text.forEach((char, ix) => {
            if (glow + events.parse("glow", ix)) {
                ctx.filter = `blur(${glow + events.parse("glow", ix)}px)`;
                drawChar(char, ix);
                ctx.filter = "none";
            }
            drawChar(char, ix);
        });
    });
}

function render() {
    ipcSend({ action: "rendered-frame", frame: global.frame.current, data: $("#anim").toDataURL() });
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
    $("#div-texts").innerHTML = "";
    const pset = JSON.parse(args.data);
    global.name = pset.name;
    global.frame.fps = pset.fps;
    global.frame.max = pset.length;
    pset.texts.forEach(text => {
        const t = document.createElement("a-text");
        $("#div-texts").append(t);
        
        $("[a-e='text']", t).value = text.text;
        $("[a-e='spacing']", t).value = text.spacing;
        $("[a-e='size']", t).value = text.size;
        $("[a-e='font']", t).value = text.font;
        $("[a-e='opacity']", t).value = text.opacity;
        $("[a-e='position_x']", t).value = text.position_x;
        $("[a-e='position_y']", t).value = text.position_y;
        $("[a-e='color']", t).value = text.color;
        //$("[a-e='glow']", t).value = text.glow;

        for (const [key, value] of Object.entries(text.animations))
            value.forEach(v => {
                const obj = v;
                v.affect = capitalize(key.replace(/\_/g, " "));
                t.addAnimation(v);
            });
        
        t.refresh();
    });

    draw();
};

class preset {
    static save() {
        showOverlay({ title: "Animation settings", size: [400, 200] },
            `
            <text>Name:</text><p-buff></p-buff><input id='anim-name-set' value='${global.name}'>
            <br><br>
            <button resolve-click='#anim-name-set|value'>Save</button>
            `
        ).then(wres => {
            global.name = wres;

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
                    position_y: [],
                    glow: []
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
                    //glow: parseInt($("[a-e='glow']", t).value),
                    animations: anim
                });
            });
    
            ipcSend({ action: "save-preset", value: res });
        }).catch(err => {});
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
    if (global.frame.current > global.frame.max) {
        global.frame.current = 0;

        if (global.frame.render) {
            global.frame.play = null;
            global.frame.render = false;
            draw();
            ipcSend({ action: "render-create-video" });
            $("#_r_prog").innerHTML = `Creating video...`;
            return;
        }
    }

    draw();
    if (global.frame.render) {
        render();
        $("#_r_prog").innerHTML = `Rendering...<br>Collecting frames (${global.frame.current}/${global.frame.max})`;
    }

    global.frame.play = requestAnimationFrame(play);
        /*
    if (global.frame.render)
        play();
    else global.frame.play = requestAnimationFrame(play);
        //*/
}

draw();