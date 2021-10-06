#version 300 es
precision highp float;

uniform sampler2D img;

in vec2 vTexCoord;

out vec4 outColor;

const float PI  = 3.141592653589793;

void main() {
    vec2 uv = vTexCoord;
    vec3 d = (10. + texture(img, uv).xyz) * .05;

    outColor = vec4(d, 1.);//vec4(uv, 1., 1.);//vec4(.3, .3, .1, 1.);// vec4(vec3(d2) ,1.);
}