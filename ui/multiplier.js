
function multiplier() {
    const multiEls = Array.from(document.getElementsByClassName('multiplier'));
    for(const el of multiEls) {
        walkTree(el);
    }
}

const rem = el => el.remove();

function walkTree(parent) {
    const span = document.createElement('span');
    clean(parent.childNodes);

    while (parent.childNodes.length > 1) {
        span.appendChild(parent.childNodes[0]);
    }

    const delBtn = ElemFromText(`<b class="ui">×</b>`);
    delBtn.onclick = e => rem(span);
    span.appendChild(delBtn);

    parent.childNodes[0].onclick = e => add(span, parent);
    parent.prepend(span);
}

function clean(childNodes) {
    for(const ch of childNodes) {
        if(ch.nodeType === Node.TEXT_NODE && !ch.nodeValue.trim().length) {
            ch.remove();
        } 
    }
}

function add(el, parent) {
    const cpy = el.cloneNode(true);
    const delBtn = cpy.children[cpy.children.length - 1];
    delBtn.onclick = e => rem(cpy);
    parent.insertBefore(cpy, parent.children[parent.children.length - 1]);
}

