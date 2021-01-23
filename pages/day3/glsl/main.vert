precision mediump float;

uniform mat4 mvpMatrix;
uniform mat4 mMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.)).xyz;
    vNormal = normal;
    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.);
}