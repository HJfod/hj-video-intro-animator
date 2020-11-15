const canvas = $("#anim");
const ctx = canvas.getContext("2d");

function addText() {
    const t = document.createElement("a-text");
    $("#div-texts").append(t);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $a("a-text").forEach(t => {
        const text = $("[a-e='text']", t).value.split("");
        const kerning = $("[a-e='spacing']", t).value;
        const size = $("[a-e='size']", t).value;
        const font = $("[a-e='font']", t).value;
        
        ctx.textAlign = "center";
        ctx.font = size + "px " + font;
        text.forEach(char => {

        });
    });
}