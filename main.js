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

const global = {
    panelToSwitch: null
}

function swapElements(el1, el2) {
    let prev1 = el1.previousSibling;
    let prev2 = el2.previousSibling;

    prev1.after(el2);
    prev2.after(el1);
}

class Panel extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        const contents = $("p-cont", this) ? $("p-cont", this).innerHTML : this.innerHTML;
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

customElements.define("a-panel", Panel);
customElements.define("a-dragger", Dragger);
customElements.define("a-cont", Container);

document.addEventListener("mouseup", e => { if ($("p-mover")) {
    if ($("re-pos:hover")) {
        /*  id
         -- 0 --
        |       |
        2       3
        |       |
         -- 1 --
        */
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
    } else swapElements($("main a-panel:hover"), global.panelToSwitch);
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