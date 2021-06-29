var Play = {};

Play.distance = function(geo1, geo2) {
  var R = 6371, // km
		deg2rad = deg => deg * (Math.PI/180),
  	dLat = deg2rad(geo2.lat - geo1.lat),
  	dLon = deg2rad(geo2.lng - geo1.lng),
  	a =
	    Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(deg2rad(geo1.lat)) * Math.cos(deg2rad(geo2.lat)) *
	    Math.sin(dLon/2) * Math.sin(dLon/2),
  	c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
  	d = R * c;
  return d;
}

Play.azimuth = function(geo1, geo2) {
	var rad2deg = rad => rad * (180/Math.PI),
		a = Math.cos(geo1.lat)*Math.sin(geo2.lat),
		b = Math.sin(geo1.lat)*Math.cos(geo2.lat)*Math.cos(geo2.lng-geo1.lng),
		c = Math.sin(geo2.lng-geo1.lng)*Math.cos(geo2.lat),
		rad = Math.atan2(a-b, c),
		deg = (450-rad2deg(rad))%360;
	return deg;
}