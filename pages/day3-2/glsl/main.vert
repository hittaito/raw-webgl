precision mediump float;

uniform mat4 mvpMatrix;

attribute vec3 position;
attribute vec4 color;
attribute vec2 textureCoord;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vTextureCoord = textureCoord;
    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.);
}