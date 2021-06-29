function GPS() {
  return new Promise( resolve => {
    const handler = pos => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude});
    navigator.geolocation.getCurrentPosition(handler);
  });
}

function toS(gps) {
  return SMap.Coords.fromWGS84(gps.lng, gps.lat);
}
function fromS(s) {
  return {lat: s.y, lng: s.x};
}

var Marker = function(P, coords, elem) {
	var obj = new SMap.Marker(coords, null, {url:elem});
	P.addMarker(obj);
	return obj;
}

// var pos = await GPS();
// circle = new Circle(G);
// circle.create(pos, 0.03, "red");
var Circle = function(G) {
  var instance;
  var center;
  var radius;
  var getPoint = function(center, radius) {
    const equator = 6378 * 2 * Math.PI;
    const yrad = Math.PI * center.lat / 180;
    const parallel = equator * Math.cos(yrad);
    const shift = 360*radius / parallel;
    return SMap.Coords.fromWGS84(center.lng+shift, center.lat);
  }
  this.create = function(_center, _radius, color) {
    center = _center;
    radius = _radius;
    const cpoint = toS(center);
    const point = getPoint(center, radius);
    const options = {
      color: color,
      opacity: 0.2,
      outlineColor: color,
      outlineOpacity: 0.5,
      outlineWidth: 3
    };
    instance = new SMap.Geometry(SMap.GEOMETRY_CIRCLE, null, [cpoint, point], options);
    G.addGeometry(instance);
		return instance;
  }
  this.setRadius = function(_radius) {
    radius = _radius;
    var coords = instance.getCoords();
    coords[1] = getPoint(center, radius);
    instance.setCoords(coords);
  }
  this.setCenter = function(_center, _radius) {
    if(_radius!==undefined) radius = _radius;
    if(_center.lat) _center = toS(_center);
    center = fromS(_center);
    var coords = instance.getCoords();
    coords[0] = _center;
    coords[1] = getPoint(center, radius);
    instance.setCoords(coords);
  }
}

if(typeof SeznamMapa === "undefined")
SeznamMapa = function(map, coords) {
  var that = this;
  this.click = function(coords) { }

  // add default Layer
  this.M = new SMap(map, toS(coords), 16);
  this.M.addDefaultLayer(SMap.DEF_TURIST).enable();
  this.M.addDefaultControls();

  // Geometry Layer
  this.G = new SMap.Layer.Geometry();
  this.M.addLayer(this.G);
  this.G.enable();

	// Marker Layer
	this.P = new SMap.Layer.Marker();
  this.M.addLayer(this.P);
  this.P.enable();

  // mouse controls
  var mouse = new SMap.Control.Mouse(SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM);
  this.M.addControl(mouse);
  this.M.getSignals().addListener(window, "map-click", function(e) {
    that.click(SMap.Coords.fromEvent(e.data.event, that.M));
  });

	// pan control
	this.pan = false;
	this.M.getSignals().addListener(window, "=", e => e.type=="map-pan" && (this.pan=true));
}

