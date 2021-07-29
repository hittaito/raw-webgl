#version 300 es
precision highp float;

uniform sampler2D img;

in vec2 vTexCood;

out vec4 outColor;

void main() {
    vec2 t = vTexCood;
    vec3 col = texture(img, t).rgb;
    outColor = vec4(col, 1.);//vec4(vTexCood, 0.,1.);
}