function $(name, par = document) {
    return par.querySelector(name);
}

function $a(name, par = document) {
    return par.querySelectorAll(name);
}

function $p(elem) {
    return elem.getBoundingClientRect();
}

function $css(elem) {
    return window.getComputedStyle(elem);
}

function $v(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v);
}

function $get(css) {
    return parseInt(css.match(/\d+/)[0]);
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

        [...$a("tr", this._table)].reverse().forEach(td => {
            [...$a("td", td)].reverse().forEach(tr => {
                if (tr.innerHTML == "") {
                    tr.append(e); return;
                }
            });
        });
    }

    table() {
        return this._table;
    }
}

const global = {
    panelToSwitch: null,
    defaults: {
        text: {
            size: 20,
            kern: 14,
            pos: 0
        }
    },
    fonts: []
}

function swapElements(el1, el2) {
    const prev1 = el1.previousSibling;
    const prev2 = el2.previousSibling;
    
    const sz1 = {
        w: $p(el1).width,
        h: $p(el1).height,
        l: $p(el1).left,
        t: $p(el1).top
    }
    const sz2 = {
        w: $p(el2).width,
        h: $p(el2).height,
        l: $p(el2).left,
        t: $p(el2).top
    }

    if (sz2.t + sz2.h == $p($("main")).height)
        el1.style.height = "100%";
    else el1.style.height = sz2.h + "px";
    if (sz1.t + sz1.h == $p($("main")).height)
        el2.style.height = "100%";
    else el2.style.height = sz1.h + "px";

    /*
    if (sz2.l + sz2.w == $p($("main")).width)
        el1.style.width = "100%";
    else el1.style.width = sz2.w + "px";
    if (sz1.l + sz1.w == $p($("main")).width)
        el2.style.width = "100%";
    else el2.style.width = sz1.w + "px";
    */

    prev1.after(el2);
    prev2.after(el1);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

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
                if ($css(this).cursor == "ew-resize")
                    this.previousElementSibling.style.width = e.pageX + "px";
                else this.previousElementSibling.style.height = e.pageY + "px";
                document.body.style.cursor = $css(this).cursor;
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

    addSelect(text, opt, vari, func) {
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
        this.tab.put("");
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
        this.addInput("Position X:", global.defaults.text.pos, () => draw(), [ -1920, 1920 ]);
        this.addInput("Position Y:", global.defaults.text.pos, () => draw(), [ -1080, 1080 ]);
        this.addType("Color:", "#ffffff", () => draw());
        this.addSelect("Font:", global.fonts, 0, () => draw());

        con.appendChild(this.tab.table());

        const ani = document.createElement("a-events");
        ani.innerHTML = "<a-title>Animations</a-title>";

        const anc = document.createElement("button");
        anc.innerHTML = "+";
        ani.append(anc);

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
    $a("re-pos").forEach(r => r.remove());
} });
document.addEventListener("mousemove", e => { if ($("p-mover")) {
    $("p-mover").style.left = e.pageX + "px";
    $("p-mover").style.top = e.pageY + "px";
    $("p-mover").style.opacity = "1";

    /*
    if (!$("main a-panel:hover re-pos")) {
        $a("re-pos").forEach(r => r.remove());
        if ($("main a-panel:hover"))
            for (i = 0; i < 4; i++) {
                const p = $("main a-panel:hover");
                const r = document.createElement("re-pos");
                r.id = i;
                r.style.left = ($p(p).left + (i > 2 ? $p(p).width - $get($v("--s-remove")) : 0)) + "px";
                r.style.top = ($p(p).top + (i == 1 ? $p(p).height - $get($v("--s-remove")) : 0)) + "px";
                if (i <= 1) r.style.width = $p(p).width + "px";
                else r.style.height = $p(p).height + "px";
                p.prepend(r);
            }
    }   //*/
} });