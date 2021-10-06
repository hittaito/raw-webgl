#version 300 es
precision highp float;

//uniform vec3 uColor;
//uniform float uAlpha;

out vec4 o_color;


void main(void) {
  o_color = vec4(.2, .534, .634, .1);// vec4(uColor, uAlpha);
}