function SZMap(mapElement, image, data) {
  var map = this;
  var lat1, lng1, lat2, lng2, x1, y1, x2, y2, mapUrl;
  var svgNS = "http://www.w3.org/2000/svg";
  var mapW = mapElement.offsetWidth, mapH = mapElement.offsetHeight;
  var str2arr = str => str.split(",").map(parseFloat);

  data.split("\n").forEach( line => {
    let key, val;
    [key, val] = line.split(":");
    if(val===undefined) return;
    switch(key.trim()) {
      case "earth1": [lat1, lng1] = str2arr(val); break;
      case "earth2": [lat2, lng2] = str2arr(val); break;
      case "img1": [x1, y1] = str2arr(val); break;
      case "img2": [x2, y2] = str2arr(val); break;
      case "map": mapUrl = val.trim(); break;
    }
  });
  var root = document.createElement("div");
  var svg = document.createElementNS(svgNS, "svg");
  with(root.style) {
    position = "relative";
    width = (mapW*2)+"px";
    height = (mapH*2)+"px";
    marginTop = (-mapH/2)+"px";
    marginLeft = (-mapW/2)+"px";
    zIndex = 1;
  }
  with(svg.style){
    position = "absolute";
    width = "100%";
    height = "100%";
  }
  window.addEventListener("load", function() {
    var img = document.createElement("img");
    img.onload = function() {
      svg.style.width = img.width+"px";
      svg.style.height = img.height+"px";
    }
    img.src = image;
  });
  root.appendChild(svg);
  root.style.background = `url('${image}') no-repeat`;
  mapElement.appendChild(root);

  var createSVG = function(nodeName, props) {
    var result = document.createElementNS(svgNS, nodeName);
    for(let i in props) result.setAttribute(i, props[i]);
    return result;
  }

  var dLngToX = (lng2-lng1)/(x2-x1);
  var dLatToY = (lat2-lat1)/(y2-y1);
  var gps00 = {
    lng: -x1 * dLngToX + lng1,
    lat: -y1 * dLatToY + lat1
  };

  this.GPStoXY = function(gps) {
    return {
      x: Math.round((gps.lng - gps00.lng) / dLngToX),
      y: Math.round((gps.lat - gps00.lat) / dLatToY),
    }
  }

  this.XYtoGPS = function(xy) {
    return {
      lng: xy.x * dLngToX + gps00.lng,
      lat: xy.y * dLatToY + gps00.lat
    }
  }

  this.centerTo = function(gps, alpha) {
    const S = gps.x!==undefined ? gps : map.GPStoXY(gps);
    const imgX = -S.x + mapW;
    const imgY = -S.y + mapH;
    root.style.backgroundPosition = `${imgX}px ${imgY}px`;
    svg.style.top = imgY+"px";
    svg.style.left = imgX+"px";
    return {x: imgX, y: imgY};
  }

  this.rotateTo = function(azimuth) {
    root.style.transform = `rotate(${-azimuth}deg)`;
  }

  this.circle = function(gps, radius, color) {
    if(gps.x!==undefined) gps = this.XYtoGPS(gps);
    var dLng = function(radius) {
      const equator = 6378000 * 2 * Math.PI;
      const lat = Math.PI * gps.lat / 180;
      const lng = equator * Math.cos(lat);
      return 360 * radius / lng;
    }
    this.setPosition = function(gps) {
      const S = gps.x!==undefined ? gps : map.GPStoXY(gps);
      circle.setAttribute("cx", S.x);
      circle.setAttribute("cy", S.y);
    }
    this.setRadius = function(radius) {
      circle.setAttribute("r", Math.round(dLng(radius) / dLngToX));
    }
    var circle = createSVG("circle", {
      "fill": color,
      "fill-opacity": 0.2,
      "stroke": color,
      "stroke-opacity": 0.5,
      "stroke-width": 3
    });
    this.setRadius(radius);
    this.setPosition(gps);
    svg.appendChild(circle);
  }

  this.distance = function(gpsStart, gpsEnd) {
    if(gpsStart.x!==undefined) gpsStart = this.XYtoGPS(gpsStart);
    if(gpsEnd.x!==undefined) gpsEnd = this.XYtoGPS(gpsEnd);
    return SZMap.distance(gpsStart, gpsEnd);
  }

  this.azimuth = function(gpsStart, gpsEnd) {
    if(gpsStart.x!==undefined) gpsStart = this.XYtoGPS(gpsStart);
    if(gpsEnd.x!==undefined) gpsEnd = this.XYtoGPS(gpsEnd);
    return SZMap.azimuth(gpsStart, gpsEnd);
  }
}

SZMap.gpsMath = function(gpsStart, gpsEnd) {
	const lat1 = Math.PI * gpsStart.lat/180;
  const lat2 = Math.PI * gpsEnd.lat/180;
  return {
    lat1: lat1,
    lat2: lat2,
    dlat: lat2 - lat1,
		dlon: Math.PI * (gpsEnd.lng-gpsStart.lng)/180
  }
}

SZMap.distance = function(gpsStart, gpsEnd) {
  const data = SZMap.gpsMath(gpsStart, gpsEnd);
  const y = Math.sin(data.dlat/2);
  const x = Math.sin(data.dlon/2);
	const a = y*y + x*x * Math.cos(data.lat1) * Math.cos(data.lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return Math.round(6371000 * c);
}

SZMap.azimuth = function(gpsStart, gpsEnd) {
  const data = SZMap.gpsMath(gpsStart, gpsEnd);
  const a = Math.cos(data.lat1)*Math.sin(data.lat2);
  const b = Math.sin(data.lat1)*Math.cos(data.lat2);
  const c = Math.atan2(a-b*Math.cos(data.dlon), Math.sin(data.dlon)*Math.cos(data.lat2));
  return Math.round(c * 180 / Math.PI - 90);
}

var gpsWatchId;
var globalHeading = null;
var discreteGPS = null;
var lastReading = {};
function scanGPS(onData) {
  const options = {enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
  const success = e => {
    lastReading.lat = e.coords.latitude;
    lastReading.lng = e.coords.longitude;
    lastReading.err = e.coords.accurancy;
    lastReading.alt = e.coords.altitude;
    lastReading.mps = e.coords.speed;
    lastReading.time = e.timestamp;
    // adjust heading
    if(globalHeading) lastReading.heading = globalHeading;
    else {
      if(discreteGPS===null) discreteGPS = {lat: e.coords.latitude, lng: e.coords.longitude};
      const here = {lat: e.coords.latitude, lng: e.coords.longitude};
      if(SZMap.distance(discreteGPS, here)>3)
      if(!e.coords.accurancy || e.coords.accurancy<10) {
        lastReading.heading = (-SZMap.azimuth(here, discreteGPS)+180) % 360;
        discreteGPS = here;
      }
    }
    if(!lastReading.heading) lastReading.heading = 0;
    onData(lastReading);
  }
  const error = e => console.log(e.message);
  gpsWatchId = navigator.geolocation.watchPosition(success, error, options);
  // try to read from gyroscope, magnetometer and accelerometer for precise heading
  if( 'AbsoluteOrientationSensor' in window ) {
    let sensor = new AbsoluteOrientationSensor({frequency: 5});
    sensor.addEventListener('reading', function(e) {
      let q = e.target.quaternion;
      globalHeading = Math.atan2(2*q[0]*q[1] + 2*q[2]*q[3], 1 - 2*q[1]*q[1] - 2*q[2]*q[2])*(180/Math.PI);
      globalHeading = (-globalHeading+360) % 360;
      if(lastReading!==null) {
        lastReading.heading = globalHeading;
        onData(lastReading);
      }
    });
    sensor.start();
  }
}

function stopGPS() {
  navigator.geolocation.clearWatch(gpsWatchId);
}