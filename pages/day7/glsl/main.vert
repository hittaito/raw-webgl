precision mediump float;

uniform mat4 mvpMatrix;
uniform mat4 mMatrix;
uniform mat4 lightMatrix;
uniform mat4 tMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vTexCoord;
varying vec4 vDepth;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.)).xyz;
    vNormal = normal;
    vColor = color;// color;
    vTexCoord = tMatrix * vec4(vPosition, 1.); // テクスチャ座標に変換
    vDepth = lightMatrix * vec4(position, 1.);

    gl_Position = mvpMatrix * vec4(position, 1.);
}