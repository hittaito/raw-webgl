precision mediump float;

uniform mat4 mvpMatrix;
uniform mat4 mMatrix;
uniform mat4 tMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vTexCoord;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.)).xyz;
    vNormal = (mMatrix * vec4(normal, 1.)).xyz;
    vColor = vec4(1.,1.,1.,1.);// color;
    vTexCoord = tMatrix * vec4(vPosition, 1.); // テクスチャ座標に変換

    gl_Position = mvpMatrix * vec4(position, 1.);
}