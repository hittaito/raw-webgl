precision mediump float;

uniform sampler2D texture1;
uniform sampler2D texture2;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vec4 color1 = texture2D(texture1, vTextureCoord);
    vec4 color2 = texture2D(texture2, vTextureCoord);
    gl_FragColor = color1 + color2;
}