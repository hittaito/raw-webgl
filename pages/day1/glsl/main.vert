precision mediump float;

uniform mat4 mvpMatrix;

attribute vec4 position;
attribute vec4 color;

varying vec4 vColor;

void main(void) {
    vColor = vec4(1.,1.,1.,1.);
    gl_Position = mvpMatrix * position;
}