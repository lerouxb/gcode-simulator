function calcMoves(cx, cy, ce, cf, x, y, e) {
  // Run the simulation, split it up into smaller steps that are smaller than
  // max time per step.

  var dx = x - cx;
  var dy = y - cy
  var d = Math.sqrt(dx*dx + dy*dy);

  // the time in milliseconds that this move will take
  var mm_s = cf/60;
  var mm_ms = cf/60/1000;
  var ms = d/mm_ms;

  //console.log(ms);

  // TODO: differentiate between retracts and normal extrudes?
  var de = e - ce;

  // for now just go with a minimum of 1 move every x milliseconds
  var nMoves = Math.ceil(ms/1);

  var moves = [];

  for (var n=1; n<=nMoves; n++) {
    moves.push({
      x: cx + dx/nMoves*n,
      y: cy + dy/nMoves*n,
      ms: ms/nMoves
    });
  }
  /*
  moves.push({
    x: x,
    y: y
  });
  */

  return moves;
}

function simulator(options) {
  /*
  options.l1
  options.l2
  options.d
  etc.
  */

  options = options || {};

  // internal state goes here

  // This stream multiplies the number of input steps, so in other words it
  // reads far less aften than it can be read from. Every time it gets the next
  // gcode move it will calculate and cache a whole bunch of moves, but only
  // send the first one along. Subsequent reads will then drain the rest of the
  // cached moves before it will read in the next gcode command from upstream.
  var bufferedMoves;

  // c for current
  var cx = 0;
  var cy = 0;
  var ce = 0; // extruder position
  var cf = 0; // feed rate in mm/minute

  // Return a through-stream that reads in gcode moves and writes out a series
  // of objects containing points/vectors along those paths that can be
  // plotted.

  return function simulate(read) {
    return function simulateReadable(end, cb) {
      // Drain the buffered moves first before reading in and processing the
      // next gcode command.
      if (bufferedMoves && bufferedMoves.length) {
        return cb(null, bufferedMoves.shift());
      }

      read(end, function simulateCallback(end, cmd) {
        if (end) return cb(end);

        if (cmd.type === 'comment' && cmd.value === 'LAYER:2') {
          // HACK: Stop at the start of the second layer for now as we're not
          // handling a z axis yet.
          return cb(true);
        }

        if (cmd.type === 'gcode') {
          if (cmd.G === 0 || cmd.G === 1) {
            if (cmd.F) {
              // Change the speed
              cf = cmd.F;
            }

            if (cmd.X && cmd.Y) {
              // a 2D move
              bufferedMoves = calcMoves(cx, cy, ce, cf, cmd.X, cmd.Y, cmd.E);

              // The end positions will be moved as the current positions next
              // time around.
              cx = cmd.X;
              cy = cmd.Y;
              ce = cmd.E;

              return cb(null, bufferedMoves.shift());
            }
          }
        }

        // if we got here without returning early, then it is something we
        // don't understand or intentionally ignoring, so just pass on nothing
        cb();
      });
    };
  }
}

module.exports = simulator;
