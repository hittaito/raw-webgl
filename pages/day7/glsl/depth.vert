precision mediump float;

uniform mat4 mvpMatrix;

attribute vec3 position;

varying vec4 vPostion;

void main(void) {
    vPostion = mvpMatrix * vec4(position, 1.);
    gl_Position = vPostion;
}