function setup() {
  var canvas = document.getElementsByTagName('canvas')[0];
  var gl = canvas.getContext('experimental-webgl');
  
  var program = gl.createProgram();
  
  var shaderError,
      shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(
    shader,
    document.getElementById('vert').innerHTML
  );
  gl.compileShader(shader);
  if ((shaderError = gl.getShaderInfoLog(shader))) {
    console.error('vertex-shader', shaderError);
    return;
  }
  gl.attachShader(program, shader);
  
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    shader,
    document.getElementById('frag').innerHTML
  );
  gl.compileShader(shader);
  if ((shaderError = gl.getShaderInfoLog(shader))) {
    console.error('vertex-shader', shaderError);
    return;
  }
  gl.attachShader(program, shader);
  
  gl.linkProgram(program);
  
  gl.useProgram(program);
  
  var attrLocation = gl.getAttribLocation(program, 'position'),
      matrixLocation = gl.getUniformLocation(program, 'matrix'),
      checkerOffsetLocation = gl.getUniformLocation(program, 'offset'),
      colorLocation = gl.getUniformLocation(program, 'color');
  gl.enableVertexAttribArray(attrLocation);
  
  var angle = [0, 0, 0],
      offset = new Float32Array([0, 0]),
      matrix = mat4.identity(mat4.create()),
      array = new Float32Array([
        0, 1, 0,
        0.877, -0.5, 0,
        -0.877, -0.5, 0
        
        // 0.577, 0, 0,
        // 1.077, -1, 0,
        // -0.077, -1, 0,
        //             
        // -0.577, 0, 0,
        // 0.077, -1, 0,
        // -1.077, -1, 0
      ]);
  
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
  
  var rectBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, 1, 0,
    1, 1, 0,
    1, -1, 0,
    
    1, -1, 0,
    -1, -1, 0,
    -1, 1, 0
  ]), gl.STATIC_DRAW)
  
  // alter angle -> rotate matrix
  var rotate = Abacus.animation({
      rate: 0.3,
      tween: 'linear'
    });
  rotate.layer().addFrame({
      index: 0,
      value: [0, 0, 0],
    }).addFrame({
      index: 1,
      value: [0, 0, Math.PI * 2 / 3]
    }).addFrame({
      index: 2,
      value: [0, Math.PI, Math.PI * 2 / 3]
    }).addFrame({
      index: 3,
      value: [Math.PI * 2, Math.PI, Math.PI * 2 / 3],
      afterTween: function() {
        // crappy way to loop
        setTimeout(rotate.start.bind(rotate, angle), 0);
      }
    });
  rotate.start(angle);
  
  var moveOffset = Abacus.animation({
    rate: 0.25,
    tween: 'linear'
  });
  moveOffset.layer().addFrame({
    index: 0,
    value: [0, 0]
  }).addFrame({
    index: 1,
    value: [1, 1]
  }).addFrame({
    index: 2,
    value: [2, 0],
  }).addFrame({
    index: 3,
    value: [1, -1]
  }).addFrame({
    index: 4,
    value: [0, 0],
    afterTween: function() {
      // crappy way to loop
      setTimeout(moveOffset.start.bind(moveOffset, offset), 0);
    }
  });
  moveOffset.start(offset);
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('onresize', resize);
  resize();
  
  // draw loop
  Abacus.timer({
    callback: function(timing) {
      // clear the screen
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      var ratio = canvas.width / canvas.height;
      
      gl.uniform2fv(checkerOffsetLocation, offset);
      
      // full screen matrix
      gl.uniformMatrix4fv(matrixLocation, false, mat4.identity(mat4.create()));
      
      // draw the full screen
      gl.uniform4f(colorLocation, 0.3, 0, 0, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
      gl.vertexAttribPointer(attrLocation, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // build the matrix
      matrix = mat4.multiply(
        // orthographic
        mat4.ortho(-ratio, ratio, -1, 1, -1, 1, mat4.identity(matrix)),
        // rotation!
        mat4.rotateZ(
          mat4.rotateY(
            mat4.rotateX(
              mat4.identity(mat4.create()), 
              angle[0]
            ), 
            angle[1]
          ), 
          angle[2]
        )
      );
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
      
      // draw the triangle
      gl.uniform4f(colorLocation, 1, 1, 0, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(attrLocation, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }).start();
}