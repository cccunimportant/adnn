'use strict';

var THTensor = require('../../THTensor.js');
var graph = require('../graph.js');
var Node = graph.Node;
var func = require('../func.js');

var fns = {thtensor: {}};

fns.thtensor.transpose = func.newUnaryFunction({
  OutputType: THTensor,
  name: 'transpose',
  forward: function(a) {
    return a.transpose();
  },
  backward: function(a) {
    var h = this.x.dims[0];
    var w = this.x.dims[1];
    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        a.dx.data[j * h + i] += this.dx.data[i * w + j];
      }
    }
  }
});

fns.thtensor.diag = func.newUnaryFunction({
  OutputType: THTensor,
  name: 'diagonal',
  forward: function(a) {
    return a.diag();
  },
  backward: function(a) {
    var n = a.dx.dims[0];
    for (var i = 0; i < n; i++) {
      a.dx.set([i, i], a.dx.get([i, i]) + this.dx.get([i, i]));
    }
  }
});

fns.thtensor.diagonal = func.newUnaryFunction({
  OutputType: THTensor,
  name: 'diagonal',
  forward: function(a) {
    return a.diagonal();
  },
  backward: function(a) {
    var n = a.dx.dims[0];
    for (var i = 0; i < n; i++) {
      a.dx.set([i], a.dx.get([i]) + this.dx.get([i, i]));
    }
  }
});

fns.thtensor.inverse = func.newUnaryFunction({
  OutputType: THTensor,
  name: 'inverse',
  forward: function(A) {
    return A.inverse();
  },
  backward: function(A) {
    var xT = this.x.transpose();
    A.dx = A.dx.add(xT.dot(this.dx).dot(xT).neg());
  }
});

fns.thtensor.determinant = func.newUnaryFunction({
  OutputType: Number,
  name: 'determinant',
  forward: function(A) {
    return A.determinant();
  },
  backward: function(A) {
    // Jacobi's formula
    var n = A.x.dims[0];
    var invA = A.x.inverse();
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        A.dx.set([i, j], this.x * this.dx * invA.get([j, i]));
      }
    }
  }
});

fns.thtensor.dot = func.newBinaryFunction({
  OutputType: THTensor,
  name: 'dot',
  forward: function(a, b) {
    return a.dot(b);
  },
  backward1: function(A, B) {
    var Ap = ad.value(A);
    var Bp = ad.value(B);

    var Ah = Ap.dims[0];
    var Aw = Ap.dims[1];
    var Bw = Bp.dims[1];
    var wout = Bw;

    for (var l = 0; l < Ah; l++) {
      for (var m = 0; m < Aw; m++) {
        var z = 0;
        for (var j = 0; j < wout; j++) {
          z += this.dx.data[l * wout + j] * Bp.data[m * Bw + j];
        }
        A.dx.data[l * Aw + m] += z;
      }
    }
  },
  backward2: function(A, B) {
    var Ap = ad.value(A);
    var Bp = ad.value(B);

    var Ah = Ap.dims[0];
    var Aw = Ap.dims[1];
    var Bh = Bp.dims[0];
    var Bw = Bp.dims[1];
    var wout = Bw;

    for (var l = 0; l < Bh; l++) {
      for (var m = 0; m < Bw; m++) {
        var z = 0;
        for (var i = 0; i < Ah; i++) {
          z += this.dx.data[i * wout + m] * Ap.data[i * Aw + l];
        }
        B.dx.data[l * Bw + m] += z;
      }
    }

  }
});

module.exports = fns;