function SZMap(container, image, data) {
  var map = this;
  var lat1, lng1, lat2, lng2, x1, y1, x2, y2, mapUrl;
  var mapW = container.offsetWidth, mapH = container.offsetHeight;
  var str2arr = str => str.split(",").map(parseFloat);

  // parse data
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
  with(svg.style) {
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
  container.appendChild(root);

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
}
