var STATE = {};

const loadFile = input => {
  let R = new FileReader();
  R.readAsBinaryString(input.files[0]);
  return new Promise(Y => R.onloadend = _ => Y(R.result));
}

const XHR = (req, fd) => new Promise((Y,N) => {
  var xhr = new XMLHttpRequest();
  xhr.onload = _ => Y(xhr);
	xhr.onerror = _ =>N(xhr);
  xhr.open(fd ? "POST" : "GET", req);
  xhr.send(fd);
});

const isFile = file => new Promise(Y => {
	var x = new XMLHttpRequest();
	x.open("HEAD",file)
	x.onload = _=> Y(x.status==200);
	x.send();
});


const API = (req,fd) => XHR("api.php?req="+req, fd);

const LS = {
	get: function(container,key,def) {
		if(typeof window[container] != "object") window[container] = {};
		var key0 = container+"."+key;
		container = window[container];
		var result = localStorage.getItem(key0);
		if(result === null) {
            if(typeof def == "object") def = JSON.stringify(def);
			localStorage.setItem(key0, def);
			result = def;
		}
		if(result == +result) result = +result;
        if(result[0]=="[" || result[0]=="{") result = JSON.parse(result);
		return container[key] = result;
	},
	set(container,key,val) {
        if(typeof val == "object") val = JSON.stringify(val);
		if(typeof window[container] != "object") window[container] = {};
		var key0 = container+"."+key;
		container = window[container];
		localStorage.setItem(key0, val);
		return container[key] = val;
	},
	clear: function(container) {
		delete window[container];
		container+= ".";
		for(var i=0; i<localStorage.length; ++i) {
			var key = localStorage.key(i);
			if(key.indexOf(container)==0) localStorage.removeItem(key);
		}
	}
};
if(typeof G == "undefined") G = {};
if(typeof U == "undefined") U = {};

const setContent = async (file, after, target) => {
    STATE.page = file;
    if(!target) target = main;
    target.style.cssText = "";
    if(typeof destructor != "undefined") {
        var result = destructor(file);
        if(result) delete destructor;
    }
    var data = await XHR(`pages/${file}.html`);
    target.innerHTML = data.response;
    var scripts = target.querySelectorAll("script");
    window._loaded = 0;
    scripts.forEach(s => {
        var el = document.createElement("script");
        el.type = "text/javascript";
        if(s.src) {
            el.src = s.src;
            window._loaded++;
        }
        else el.innerHTML = "// "+file+".html\n"+s.innerText+"\n window._loaded++";
        target.appendChild(el);
        s.remove();
    });
    // clear message object after all inline scripts were loaded
    var clear = function() {
        if(window._loaded!=scripts.length) return setTimeout(clear, 100);
        message = {};
        if(after) after();
        if(window.after) window.after.forEach(fn => fn());
        window.after = [];
    }
    clear();
}
window.after = [];

const showError = (tgt, msg) => tgt && (tgt.classList.add("err"), tgt.innerHTML = msg);
const showNote =  (tgt, msg) => tgt && (tgt.classList.add("ok"),  tgt.innerHTML = msg);

const id = (names,add) => (add = n => window[n] = document.getElementById(n), names.forEach ? names.forEach(add) : add(names));

const slugify = function(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

const ElemFromText = function(html) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

const uniqid = function() {
  var ts=String(new Date().getTime()), i = 0, out = '';
  for(i=0;i<ts.length;i+=2) {
     out+=Number(ts.substr(i, 2)).toString(36);
  }
  return ('q'+out);
}

const qrbase = size => "https://"+`chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chld=H&chl=`;

const showImage = e => new Promise(Y => {
	var src = e.target;
	var fr = new FileReader();
	fr.onload = e => Y(fr.result);
  src.nextElementSibling.innerHTML = src.files[0].name;
  fr.readAsDataURL(src.files[0]);
});
const showFileName = e => e.target.nextElementSibling.innerHTML = e.target.files[0].name;

const demo = fn => G.demo && API(`demo&demo=${G.demo}&game=${game.url}`)
	.then(r=>r.response=="1" && fn())

Array.prototype.contains2 = function(key) {
	for(var i=0; i<this.length; ++i) if(this[i].indexOf(key)>-1) return true;
	return false;
}