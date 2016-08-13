#!/usr/bin/env node
/*
Must know the max rotational speed of the servos, throw error if that gets
exceeded.
(Minimum would be handy too.)

GCODE:
G0 G1 only for now
F, X, Y (ignore Z and E)
Ignore all other commands

UNITS:
F is in mm/minute
1 minute = 60*1000 milleseconds or 60*1000*1000 microseconds

TARGET TIME & ANGLES:
mm/minute to "how long should this move take" is:
startxy to endxy distance in mm
distance/F == minutes the move should take
cache target time (millis/microseconds)
cache target angles

METHOD:
always keep start time+angles, now+angles, end time+angles
always interpolate between current and target angles using how far we have to go and how much time, stop when overshooting.

But how do you slow down? What if the speed required is below the min speed? So
we also have to take into account where we are in the move and set current and target
speeds.

Therefore we have to remember the previous check's time & positions too to
figure out the instantaneous speeds.
*/

var fs = require('fs');
var byline = require('byline');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var parse = require('./gcode-parser');
var simulator = require('./gcode-simulator');
var plotter = require('./gcode-plotter');

var GIFEncoder = require('gifencoder');
var Canvas = require('canvas');
var fs = require('fs');

var opts = {
  d: 240,      // distance between towers (mm)
  l1: 120,     // length of arm between tower and elbow (mm)
  l2: 120,     // length of arm between elbow and end effector (mm)
  scale: 3,    // pixels per millimeter
  width: 250,  // stage width (mm)
  height: 250, // stage height (mm)
};

opts.pixelWidth = opts.width*opts.scale;
opts.pixelHeight = opts.height*opts.scale;

var encoder = new GIFEncoder(opts.pixelWidth, opts.pixelHeight);
encoder.createReadStream().pipe(fs.createWriteStream('simulation.gif'));

encoder.start();
encoder.setRepeat(-1);
encoder.setDelay(1000/30);  // frame delay in ms, can be changed after every frame
encoder.setQuality(10); // image quality. 10 is default.

opts.encoder = encoder;

opts.canvas = new Canvas(opts.pixelWidth, opts.pixelHeight);
//var ctx = canvas.getContext('2d');

// TODO: use a proper command-line options parser?
var lineStream = byline(fs.createReadStream(process.argv[2], { encoding: 'utf8' }));

pull(
  toPull.source(lineStream),
  parse,
  simulator(opts),
  plotter(opts)
);

