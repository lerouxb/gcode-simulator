function Whitespace(line) {
  return {
    type: 'whitespace',
    value: line
  };
}

function Comment(line) {
  return {
    type: 'comment',
    value: line.split(';').slice(1).join(';')
  };
}

function GCode(line) {
  // there can be a comment later in the line. Split that first.
  var parts = line.trim().split(';');

  // the first part is the gcode
  var terms = parts[0].split(' ').filter(function(term) {
    // strip whitespace
    return !!term;
  });

  var obj = {
    type: 'gcode',
    command: terms[0],
    terms: terms
  };

  if (parts.length > 1) {
    obj.comment = parts.slice(1).join(';');
  }

  var unknown = [];

  terms.forEach(function(term) {
    var start = term[0];
    var rest = term.slice(1);


    switch (start) {
      case 'G':
        // the g-code command. G0 or G1
        obj['G'] = parseInt(rest, 10);
        break;

      case 'F':
        // feed rate in mm/minute
        obj['F'] = parseInt(rest, 10);
        break;

      case 'E':
        // extruder
        obj['E'] = parseFloat(rest);
        break;

      case 'X':
        // x position
        obj['X'] = parseFloat(rest);
        break;

      case 'Y':
        // y position
        obj['Y'] = parseFloat(rest);
        break;

      case 'Z':
        // z position
        obj['Z'] = parseFloat(rest);
        break;

      default:
        unknown.push(term);
    }
  });

  if (unknown.length) {
    obj.unknown = unknown;
  }

  return obj;
}

function parseLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return Whitespace(line);
  }

  if (trimmed[0] == ';') {
    return Comment(line);
  }

  return GCode(line);
}

// through-stream that reads lines and writes simple objects that represent
// gcode commands, comments and whitespace, etc.
function parse(read) {
  return function parseReadable(end, cb) {
    read(end, function parseCallback(end, line) {
      cb(end, end ? null : parseLine(line));
    })
  }
}

module.exports = parse;
