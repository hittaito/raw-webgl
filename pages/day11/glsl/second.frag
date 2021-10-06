#version 300 es
precision mediump float;

uniform sampler2D sprite;

in float vAge;
in float vLife;
in vec2 vTexCoord;

out vec4 o_FragColor;


vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{  return a + b*cos( 6.28318*(c*t+d) ); }

void main() {
    float t = vAge / vLife;
    vec4 color = vec4(1., .8, .3, 1. - (vAge/vLife));
    o_FragColor = color * texture(sprite, vTexCoord);
}