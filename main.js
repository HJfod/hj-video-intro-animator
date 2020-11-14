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
    panelToSwitch: null
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
        });
        con.appendChild(inp);

        const tab = new table(3, 2);
        
        tab.put("Size:");
        const siz = document.createElement("input");
        const siz_t = document.createElement("input");
        siz_t.classList.add("small");
        siz.setAttribute("type", "range");
        siz.addEventListener("input", e => siz_t.value = siz.value);
        siz_t.addEventListener("input", e => siz.value = siz_t.value);
        tab.put(siz);
        tab.put(siz_t);
        
        tab.put("Spacing:");
        const spa = document.createElement("input");
        const spa_t = document.createElement("input");
        spa_t.classList.add("small");
        spa.setAttribute("type", "range");
        spa.addEventListener("input", e => spa_t.value = spa.value);
        spa_t.addEventListener("input", e => spa.value = spa_t.value);
        tab.put(spa);
        tab.put(spa_t);

        con.appendChild(tab.table());

        const clo = document.createElement("button");
        clo.innerHTML = "╳";
        clo.classList.add("close-button");
        clo.addEventListener("click", e => this.remove());
        this.appendChild(clo);

        this.append(hea);
        this.append(con);
    }
}

customElements.define("a-panel", Panel);
customElements.define("a-dragger", Dragger);
customElements.define("a-cont", Container);
customElements.define("a-text", Text);

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