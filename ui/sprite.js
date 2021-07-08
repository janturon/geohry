function Sprite(tgt) {
  var that = this;
  this.setImg = function(x, y) {
    var w = tgt.offsetWidth, h = tgt.offsetHeight;
    if(x>3) x = 3;
    if(y>2) y = 2;
    tgt.style.backgroundPosition = `${-w*x}px ${-h*y}px`;
  }
  this.setImg(0,0);
  var timer, phase = 0, ypos = [0, 1, 0, 2];
  var stepper = function() {
    phase = ++phase % 4;
    that.setImg(that.dir, ypos[phase]);
  }
  var _speed = 0;
  Object.defineProperty(this, "speed", {
    get: function() { return _speed; },
    set: function(value) {
      if(value<0) value = 0;
      if(value>10) value = 10;
      value = parseInt(value);
      if(_speed==value) return;
      _speed = value;
      if(timer) timer = clearInterval(timer);
      if(value) {
        const delay = 1000 / (3+_speed);
        timer = setInterval(stepper, delay);
      }
      else {
        phase = _speed = 0;
        this.setImg(this.dir, phase);
      }
    }
  });
  var _dir = 0;
  Object.defineProperty(this, "dir", {
    get: function() { return _dir; },
    set: function(value) {
      const lastDir = _dir;
      if(value<0) value+= 360;
      if(value>305 || value<=45) _dir = 2;
      else if(value>45 && value<=135) _dir = 3;
      else if(value>135 && value<=215) _dir = 0;
      else if(value>215 && value<=305) _dir = 1;
      if(lastDir!=_dir) this.setImg(_dir, phase);
    }
  });
}
Sprite.D = 0; // South
Sprite.L = 1; // West
Sprite.U = 2; // North
Sprite.R = 3; // East
