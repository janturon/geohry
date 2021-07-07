var STATE = {}; // periztentní proměnné (zároveň v localStorage)
var STATIC = {}; // statické proměnné funkcí

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
    retype: function(result) {
        if(result) if(result[0]=="[" || result[0]=="{") result = JSON.parse(result);
		else if(result == +result) result = +result;
        if(result=="undefined") result = undefined;
        return result;
    },
	get: function(container,key,def) {
		if(typeof window[container] != "object") window[container] = {};
		var key0 = container+"."+key;
		container = window[container];
		var result = localStorage.getItem(key0);
		if(result === null && def !== undefined) {
            if(typeof def == "object") def = JSON.stringify(def);
			localStorage.setItem(key0, def);
			result = def;
		}
        result = LS.retype(result);
        if(container && container[key] && result===undefined) delete container.key;
		return container[key] = result;
	},
	set(container,key,val) {
        if(typeof val == "object") val = JSON.stringify(val);
		if(typeof window[container] != "object") window[container] = {};
		var key0 = container+"."+key;
		container = window[container];
		localStorage.setItem(key0, val);
		return container[key] = LS.retype(val);
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
if(typeof E == "undefined") E = {};

const setContent = async (file, message, target) => {
    var topLevel = !target;
    if(!target) target = main;
    target.style.cssText = "";
    if(!message) message = {};
    window.message = message;

    // previous contents is about to be unloaded, call STATE.unload functions, if any
    if(topLevel) {
        STATE.unload.forEach(fn => fn());
        STATE.unload = [];
    }

    // load new contents
    var path = `pages/${file}.html`;
    var exists = await isFile(path);
    if(!exists) return setContent("dialog", {
        title: "404",
        text: `Někdo nám ukradl stránku <b>${file}</b>!<br>Volejte policii, hasiče, nebo tak něco!`,
        button: "Nefňukej a funguj",
        target: STATE.page
    });
    var data = await XHR(path);
    target.innerHTML = data.response;

    // load scripts
    var scripts = target.querySelectorAll("script");
    if(topLevel) {
        STATE.prevPage = STATE.page;
        STATE.page = file;
        window._loaded = 0
        window._toLoad = scripts.length;
        window.ID = {};
    }
    else window._toLoad+= scripts.length;
    for(s of scripts) {
        if(STATE.abort.has(file)) {
            window._loaded++;
            continue;
        }
        var el = document.createElement("script");
        el.type = "text/javascript";
        if(s.src) (el.src = s.src, window._loaded++);
        else el.innerHTML = "// "+(topLevel ? file : STATE.page+" "+file)+".html\n"+s.innerText+"\n window._loaded++";
        target.appendChild(el);
        s.remove(); // remove original script (which was not executed)
        target.querySelectorAll("[id]").forEach(el => ID[el.id] = el);
    }

    STATE.abort.delete(file)

    // all contents is loaded and internal scripts executed, call STATE.load functions, if any
    // and scroll to top of the page
    var clear = function() {
        if(window._loaded!=window._toLoad) return setTimeout(clear, 100);
        STATE.load.forEach(fn => fn());
        STATE.load = [];
    }
    if(topLevel) {
        clear();
        setTimeout(_=>window.scrollTo(0, 0), 100);
    }
}
STATE.load = [];
STATE.unload = [];
STATE.prevPage = "home";
STATE.abort = new Set();

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