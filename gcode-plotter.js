function plotter(options) {
  /*
  options.encoder
  options.canvas
  etc.
  */

  options = options || {};

  // internal state goes here
  var ctx = options.canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, options.pixelWidth, options.pixelHeight);

  ctx.fillStyle = '#ffffff';

  var xoffset = (options.width - options.d) / 2 * options.scale;
  var yoffset = (options.height - options.l1 - options.l2) / 2 * options.scale;

  var totalMS = 0;
  var lastFrame = 0;

  // return a sink-stream that plots points/vectors on a canvas
  return function plot(read) {
    read(null, function plotCallback(end, pos) {
      if (end === true)  {
        options.encoder.addFrame(ctx);
        options.encoder.finish();
        return;
      }
      if (end) throw end;

      if (pos) {
        //console.log("plot", pos);
        ctx.fillRect(pos.x*options.scale + xoffset, pos.y*options.scale + yoffset, 1, 1);
        totalMS += pos.ms;
        if (totalMS > Math.floor(lastFrame/1000)*1000 + 1000) {
          lastFrame = totalMS;
          options.encoder.addFrame(ctx);
          console.log(totalMS);
        }
      }

      read(null, plotCallback);
    });
  }
}
module.exports = plotter;
