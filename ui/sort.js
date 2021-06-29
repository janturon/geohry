var selected = null
var dragHandler = function() { }

function dragOver(e) {
  var tgt = e.target;
  if(tgt.tagName!="LI") tgt = tgt.parentNode;
  if (isBefore(selected, tgt)) {
    tgt.parentNode.insertBefore(selected, tgt)
  } else {
    tgt.parentNode.insertBefore(selected, tgt.nextSibling)
  }
}

function dragEnd() {
  selected = null;
  dragHandler();
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', null)
  selected = e.target
}

function isBefore(el1, el2) {
  let cur;
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
    }
  }
  return false;
}

