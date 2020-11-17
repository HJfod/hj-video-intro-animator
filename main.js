const $$ = {
    all: (name, par = document) => {
        return par.querySelectorAll(name);
    },
    p: elem => {
        return elem.getBoundingClientRect();
    },
    css: elem => {
        return window.getComputedStyle(elem);
    },
    v: v => {
        return getComputedStyle(document.documentElement).getPropertyValue(v);
    },
    get: css => {
        return parseInt(css.match(/\d+/)[0]);
    }
};

function $(name, par = document) {
    return par.querySelector(name);
}

class table {
    constructor(w, h) {
        this._table = document.createElement("table");
        for (let i = 0; i < h; i++) {
            const td = document.createElement("tr");
            this._table.appendChild(td);
            for (let j = 0; j < w; j++)
                td.appendChild(document.createElement("td"));
        }
    }

    put(elem) {
        let e = elem;
        if (typeof(elem) == "string") {
            e = document.createElement("text");
            e.innerHTML = elem;
        }

        [...$$.all("tr", this._table)].reverse().forEach(td => {
            [...$$.all("td", td)].reverse().forEach(tr => {
                if (tr.innerHTML == "") {
                    tr.append(e); return;
                }
            });
        });
    }

    puts(list) {
        list.forEach(i => this.put(i));
    }

    table() {
        return this._table;
    }
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    let res = "";
    s.split(" ").forEach(ss => {
        res += " " + ss.charAt(0).toUpperCase() + ss.slice(1);
    });
    return res.substr(1);
}

const global = {
    panelToSwitch: null,
    defaults: {
        text: {
            size: 20,
            kern: 14,
            pos: 0,
            opacity: 100,
            glow: 0
        },
        video: {
            fps: 60,
            length: 5
        }
    },
    frame: {
        current: 0,
        fps: 0,
        max: 0,
        play: null
    },
    name: "Unnamed",
    fonts: []
}

global.frame.fps = global.defaults.video.fps;
global.frame.max = global.defaults.video.length * global.defaults.video.fps;

function swapElements(el1, el2) {
    const prev1 = el1.previousSibling;
    const prev2 = el2.previousSibling;
    
    const sz1 = {
        w: $$.p(el1).width,
        h: $$.p(el1).height,
        l: $$.p(el1).left,
        t: $$.p(el1).top
    }
    const sz2 = {
        w: $$.p(el2).width,
        h: $$.p(el2).height,
        l: $$.p(el2).left,
        t: $$.p(el2).top
    }

    if (sz2.t + sz2.h == $$.p($("main")).height)
        el1.style.height = "100%";
    else el1.style.height = sz2.h + "px";
    if (sz1.t + sz1.h == $$.p($("main")).height)
        el2.style.height = "100%";
    else el2.style.height = sz1.h + "px";

    /*
    if (sz2.l + sz2.w == $$.p($("main")).width)
        el1.style.width = "100%";
    else el1.style.width = sz2.w + "px";
    if (sz1.l + sz1.w == $$.p($("main")).width)
        el2.style.width = "100%";
    else el2.style.width = sz1.w + "px";
    */

    prev1.after(el2);
    prev2.after(el1);
}

Array.prototype.remove = function() {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

fromArray = (obj, arr) => {
    arr.forEach(item => {
        const o = document.createElement("option");
        o.innerHTML = item;
        obj.append(o);
    });
    return obj;
}

class Panel extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        if ($("p-cont", this)) return;
        const contents = this.innerHTML;
        this.innerHTML = "";
        
        const bar = document.createElement("p-head");
        bar.innerHTML = this.getAttribute("name");
        bar.addEventListener("mousedown", e => {
            if (e.button == 0) {
                document.body.insertBefore(document.createElement("p-mover"), $("main"));
                global.panelToSwitch = this;
            }
        });
        this.appendChild(bar);

        const con = document.createElement("p-cont");
        con.innerHTML = contents;
        this.appendChild(con);

        if (this.hasAttribute("size"))
            this.style.flexGrow = this.getAttribute("size");
    }
}

class Dragger extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        if (this.parentElement.getAttribute("dir") == "column") {
            this.style.width = '100%';
            this.style.cursor = 'ns-resize';
        } else {
            this.style.height = '100%';
            this.style.cursor = 'ew-resize';
        }
        
        let m = false, oldc;
        this.addEventListener("mousedown", e => { m = true; oldc = document.body.style.cursor; });
        document.addEventListener("mousemove", e => {
            if (m) {
                if ($$.css(this).cursor == "ew-resize")
                    this.previousElementSibling.style.width = e.pageX + "px";
                else this.previousElementSibling.style.height = e.pageY + "px";
                document.body.style.cursor = $$.css(this).cursor;
            }
        });
        document.addEventListener("mouseup", e => { m = false; document.body.style.cursor = oldc; });
    }
}

class Container extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        this.style.flexDirection = this.getAttribute("dir");
    }
}

class Text extends HTMLElement {
    constructor() { super(); }

    addInput(text, vari, func, range = [0, 100]) {
        this.tab.put(text);
        const siz = document.createElement("input");
        const siz_t = document.createElement("input");
        siz_t.setAttribute("size", "4");
        siz.setAttribute("type", "range");
        siz.setAttribute("min", range[0]);
        siz.setAttribute("max", range[1]);
        siz.addEventListener("input", e => { siz_t.value = siz.value; func(); });
        siz_t.addEventListener("input", e => { siz.value = siz_t.value; func(); });
        siz.value = siz_t.value = vari;
        siz.setAttribute("a-e", text.toLowerCase().replace(/\s/g, "_").match(/[a-z]+(\_[a-z]+)*/g)[0]);
        this.tab.put(siz);
        this.tab.put(siz_t);
    }

    addInputS(table, text, vari, func, range = [0, 100]) {
        const txt = document.createElement("text");
        txt.innerHTML = text;
        table.put(txt);
        const siz = document.createElement("input");
        const siz_t = document.createElement("input");
        siz_t.setAttribute("size", "4");
        siz.setAttribute("type", "range");
        siz.setAttribute("min", range[0]);
        siz.setAttribute("max", range[1]);
        siz.addEventListener("input", e => { siz_t.value = siz.value; func(); });
        siz_t.addEventListener("input", e => { siz.value = siz_t.value; func(); });
        siz.value = siz_t.value = vari;
        siz.setAttribute("a-e", text.toLowerCase().replace(/\s/g, "_").match(/[a-z]+(\_[a-z]+)*/g)[0]);
        table.put(siz);
        table.put(siz_t);

        return [ txt, siz, siz_t ];
    }

    addSelect(text, opt, vari, func, extra = null) {
        this.tab.put(text);
        const sel = document.createElement("select");
        opt.forEach(o => {
            const op = document.createElement("option");
            op.innerHTML = o;
            sel.append(op);
        });
        sel.selectedIndex = vari;
        sel.addEventListener("change", e => func());
        sel.setAttribute("a-e", text.toLowerCase().replace(/\s/g, "_").match(/[a-z]+(\_[a-z]+)*/g)[0]);
        this.tab.put(sel);
        if (!extra)
            this.tab.put("");
        else {
            const ex = document.createElement(extra.is);
            ex.innerHTML = extra.text;
            ex.addEventListener("click", () => extra.click());
            extra.attr.forEach(a => {
                ex.setAttribute(a[0], a[1]);
            });
            this.tab.put(ex);
        }
    }
    
    addType(text, defa, func) {
        this.tab.put(text);
        const sel = document.createElement("input");
        sel.value = defa;
        sel.addEventListener("change", e => func());
        sel.setAttribute("a-e", text.toLowerCase().replace(/\s/g, "_").match(/[a-z]+(\_[a-z]+)*/g)[0]);
        this.tab.put(sel);
        this.tab.put("");
    }

    addAnimationControls(values = null) {
        const div = document.createElement("div");
        const tab = new table(4, 8);
        const sel = document.createElement("select");
        sel.setAttribute("a-e", "affect");
        fromArray(sel, [ "Size", "Spacing", "Opacity", "Position X", "Position Y" ]);

        const val = {
            start: 0, end: 0, amount: 0, interval: 0, reverse: false
        };
        if (values)
            for (const [key, value] of Object.entries(values))
                val[key] = value;

        sel.addEventListener("change", e => {
            $("a-title", div.parentElement).innerHTML = sel.value;
        });

        tab.puts([ "Affect:", sel, "", "" ]);

        const ord = document.createElement("select");
        ord.setAttribute("a-e", "modify");
        ord.addEventListener("change", e => draw());
        fromArray(ord, [ "Whole text", "Each character" ]);
        tab.puts([ "Modify:", ord, "", "" ]);

        const ease = document.createElement("select");
        ease.setAttribute("a-e", "easing");
        ease.addEventListener("change", e => draw());
        fromArray(ease, [ "Linear", "Sine", "Exponental", "ExponentalIn", "ExponentalOut" ]);
        tab.puts([ "Easing:", ease, "", "" ]);

        this.addInputS(tab, "Start:", val.start, () => draw(), [ 0, global.frame.max ]);
        const setStartFrame = document.createElement("button");
        setStartFrame.innerHTML = "From Current Frame";
        setStartFrame.classList.add("b-light");
        setStartFrame.addEventListener("click", e => {
            $("[a-e='start']", tab.table()).value = global.frame.current;
            $("[a-e='start']", tab.table()).dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: true,
            }));
        });
        tab.put(setStartFrame);

        this.addInputS(tab, "End:", val.end, () => draw(), [ 0, global.frame.max ]);
        const setEndFrame = document.createElement("button");
        setEndFrame.innerHTML = "From Current Frame";
        setEndFrame.classList.add("b-light");
        setEndFrame.addEventListener("click", e => {
            $("[a-e='end']", tab.table()).value = global.frame.current;
            $("[a-e='end']", tab.table()).dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: true,
            }));
        });
        tab.put(setEndFrame);

        this.addInputS(tab, "Amount:", val.amount, () => draw(), [ 0, 1024 ]);
        tab.put("");

        const ival = this.addInputS(tab, "Interval:", val.interval, () => draw(), [ 0, global.frame.max ]);
        tab.put("");

        const icheck = document.createElement("input");
        icheck.setAttribute("type", "checkbox");
        icheck.setAttribute("a-e", "reverse");
        icheck.checked = val.reverse;
        icheck.addEventListener("change", e => draw());
        icheck.setAttribute("name", "icheck");
        const ilabel = document.createElement("label");
        ilabel.innerHTML = "Reverse order";
        ilabel.setAttribute("for", "icheck");
        tab.put(icheck);
        tab.put(ilabel);
        ival.push(icheck);
        ival.push(ilabel);

        if (values) {
            sel.value = capitalize(values.affect);
            ord.value = values.modify;
            ease.value = values.easing;
        }

        ord.addEventListener("change", e => {
            ival.forEach(i => {
                if (ord.selectedIndex)
                    i.style.display = "initial";
                else i.style.display = "none";
            });
        });
        ord.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

        sel.addEventListener("change", e => {
            console.log("f");

            const og = $(`table [a-e='${sel.value.toLowerCase().replace(/\s/g, "_").match(/[a-z]+(\_[a-z]+)*/g)[0]}']`,
            div.parentElement.parentElement.parentElement.parentElement);

            $("[a-e='amount']", tab.table()).setAttribute("min",
            og.getAttribute("min"));

            $("[a-e='amount']", tab.table()).setAttribute("max",
            og.getAttribute("max"));

            draw();
        });
        if (values)
            sel.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

        div.append(tab.table());
        div.style.display = "none";
        return div;
    }

    addAnimation(values = null) {
        const nani = document.createElement("a-event");
        const name = values == null ? "&lt;New animation&gt;" : values.affect;
        nani.innerHTML =
        "<a-title onclick='$(`div`, this.parentElement).style.display ="
        +"$(`div`, this.parentElement).style.display == `initial` ? `none` : `initial`'>" + name + "</a-title>";
        const nanb = document.createElement("button");
        nanb.innerHTML = "╳";
        nanb.addEventListener("click", e => { nani.remove(); draw(); });
        nani.append(nanb);
        nani.append(this.addAnimationControls(values));
        $("div a-events div", this).style.display = "initial";
        $("div a-events div", this).append(nani);
    }

    refresh() {
        const t = this;
        [
            $("[a-e='text']", t),
            $("[a-e='size']", t),
            $("[a-e='font']", t),
            $("[a-e='opacity']", t),
            $("[a-e='position_x']", t),
            $("[a-e='position_y']", t),
            $("[a-e='color']", t)
        ].forEach(y => y.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })));
    }

    connectedCallback() {
        if ($("div", this)) return;
        const con = document.createElement("div");
        con.style.display = "none";
        
        const hea = document.createElement("a-title");
        hea.addEventListener("click", e => con.style.display = con.style.display == "initial" ? "none" : "initial");
        hea.innerHTML = "&lt;empty text&gt;";

        const inp = document.createElement("input");
        inp.setAttribute("placeholder", "Text here...");
        inp.addEventListener("input", e => {
            if (inp.value == "")
                hea.innerHTML = "&lt;empty text&gt;";
            else hea.innerHTML = inp.value;
            draw();
        });
        con.appendChild(inp);
        inp.setAttribute("a-e", "text");

        this.tab = new table(3, 8);
        
        this.addInput("Size:", global.defaults.text.size, () => draw(), [0, 256]);
        this.addInput("Spacing:", global.defaults.text.kern, () => draw(), [0, 320]);
        this.addInput("Opacity:", global.defaults.text.opacity, () => draw(), [0, 100]);
        this.addInput("Position X:", global.defaults.text.pos, () => draw(), [ -1920, 1920 ]);
        this.addInput("Position Y:", global.defaults.text.pos, () => draw(), [ -1080, 1080 ]);
        //this.addInput("Glow:", global.defaults.text.glow, () => draw(), [ 0, 128 ]);
        this.addType("Color:", "#ffffff", () => draw());
        this.addSelect("Font:", global.fonts, 0, () => draw(), { is: "button", text: "More", click: () => {
            ipcSend(`{ "action": "open", "window": "font.html" }`);
        }, attr: [ [ "class", "b-light" ] ] });

        con.appendChild(this.tab.table());

        const ani = document.createElement("a-events");
        const anit = document.createElement("a-title");
        anit.innerHTML = "Animations";
        const anid = document.createElement("div");
        anid.style.display = "none";

        anit.addEventListener("click", e => anid.style.display = anid.style.display == "initial" ? "none" : "initial");

        const anc = document.createElement("button");
        anc.innerHTML = "+";
        anc.addEventListener("click", e => {
            this.addAnimation();
        });
        ani.append(anit);
        ani.append(anc);
        ani.append(anid);

        con.append(ani);

        const clo = document.createElement("button");
        clo.innerHTML = "╳";
        clo.classList.add("close-button");
        clo.addEventListener("click", e => { this.remove(); draw(); });
        this.appendChild(clo);

        this.append(hea);
        this.append(con);
    }
}

class Titlebar extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        const content = this.innerHTML;
        this.innerHTML = `<text>${content}</text><button onclick="window.close();">╳</button>`;
    }
}

function ipcSend(msg) {
    if (typeof msg === "string") msg = JSON.parse(msg);
    window.postMessage({
        protocol: "to-app",
        data: msg
    });
}

const ipc = {
    test: args => {
        console.log(args);
    }
};

function searchSelect(sel, srh) {
    Array.from(sel.children).forEach(opt => {
        if ($("text", opt).innerHTML.toLowerCase().trim().startsWith(srh.toLowerCase().trim()))
            opt.style.display = "flex";
        else opt.style.display = "none";
    });
}

window.addEventListener("message", event => {
	const message = event.data;
    if (message.protocol === "from-app") {
        let args = JSON.parse(message.data);
        ipc[args.action](args);
    }
});

customElements.define("a-panel", Panel);
customElements.define("a-dragger", Dragger);
customElements.define("a-cont", Container);
customElements.define("a-text", Text);
customElements.define("a-titlebar", Titlebar);

document.addEventListener("mouseup", e => { if ($("p-mover")) {
    /*if ($("re-pos:hover")) {
        //     id
        //   -- 0 --
        //  |       |
        //  2       3
        //  |       |
        //   -- 1 --

        const id = parseInt($("re-pos:hover").id);
        if (id <= 1) {
            const p = $("main a-panel:hover");
            const n = document.createElement("a-cont");
            n.setAttribute("dir", "column");
            p.parentNode.insertBefore(n, p);
            if (id) {
                n.append(p);
                n.append(document.createElement("a-dragger"));
                n.append(global.panelToSwitch);
            } else {
                n.append(global.panelToSwitch);
                n.append(document.createElement("a-dragger"));
                n.append(p);
            }
        }
    } else //*/
    swapElements($("main a-panel:hover"), global.panelToSwitch);
    $("p-mover").remove();
    $$.all("re-pos").forEach(r => r.remove());
} });
document.addEventListener("mousemove", e => { if ($("p-mover")) {
    $("p-mover").style.left = e.pageX + "px";
    $("p-mover").style.top = e.pageY + "px";
    $("p-mover").style.opacity = "1";

    /*
    if (!$("main a-panel:hover re-pos")) {
        $$.all("re-pos").forEach(r => r.remove());
        if ($("main a-panel:hover"))
            for (i = 0; i < 4; i++) {
                const p = $("main a-panel:hover");
                const r = document.createElement("re-pos");
                r.id = i;
                r.style.left = ($$.p(p).left + (i > 2 ? $$.p(p).width - $$.get($$.v("--s-remove")) : 0)) + "px";
                r.style.top = ($$.p(p).top + (i == 1 ? $$.p(p).height - $$.get($.v("--s-remove")) : 0)) + "px";
                if (i <= 1) r.style.width = $$.p(p).width + "px";
                else r.style.height = $$.p(p).height + "px";
                p.prepend(r);
            }
    }   //*/
} });