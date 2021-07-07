const multiplier = () => {
    var multiEls = Array.from(document.getElementsByClassName('multiplier'));
    for (var multiEl of multiEls) {
        var span = document.createElement('span');
        //clean
        for (var ch of multiEl.childNodes) { //odstraní prázdné text nody pro lepší práci s childNodes
            if (ch.nodeType === Node.TEXT_NODE && !ch.nodeValue.trim().length) {
                ch.remove();
            }
        }
        //projde childNodes a přesune do span elementu
        while (multiEl.childNodes.length > 1) {
            span.appendChild(multiEl.childNodes[0]);
        }

        var delBtn = ElemFromText(`<b class="ui">X</b>`);
        delBtn.onclick = e => span.remove();
        span.appendChild(delBtn);

        multiEl.childNodes[0].onclick = e => { //parent.childNodes[0] je v tuto chvíli pouze poslední button
            var cpy = span.cloneNode(true);
            var delBtn = cpy.children[cpy.children.length - 1];
            delBtn.onclick = e => cpy.remove();
            multiEl.insertBefore(cpy, multiEl.children[multiEl.children.length - 1]); //přidá element před poslední (tlačítko na přidávání)        
        } 

        multiEl.prepend(span); //prepend = přidá před button, rychlejší než insertBefore

    }
}
