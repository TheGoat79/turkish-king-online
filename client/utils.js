function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function createCardElement(card, options) {
  var opts = options || {};
  var div = document.createElement('div');
  div.className = 'card' + (opts.extraClass ? ' ' + opts.extraClass : '');
  div.innerHTML = '<div>' + card.rank + '</div><div class="suit">' + card.suit + '</div>';
  if (opts.onClick) div.onclick = opts.onClick;
  return div;
}
