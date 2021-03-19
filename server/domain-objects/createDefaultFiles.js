const defaultSketch = `function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
console.log('Hey! This is the default console log in the sketch.js file!')
`;

const defaultHTML = `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.3.1/p5.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.3.1/addons/p5.sound.min.js"></script>
    <link rel="stylesheet" type="text/css" href="style.css">
    <meta charset="utf-8" />
    <title>Testing out the default files!!</title>

  </head>
  <body>
    <script src="sketch.js"></script>
  </body>
</html>
`;

const defaultCSS = `html, body {
  margin: 0;
  padding: 0;
}
canvas {
  display: block;
}
/*
Editing the default style.css file! Hurray! This is a comment though.
*/
`;

const defaultNewFile = `console.log('This is a new default file!');
// Does seem to work, right?
`;

export default function createDefaultFiles() {
  return {
    'index.html': {
      content: defaultHTML
    },
    'style.css': {
      content: defaultCSS
    },
    'sketch.js': {
      content: defaultSketch
    },
    'newDefault.js': {
      content: defaultNewFile
    }
  };
}
