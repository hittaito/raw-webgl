#version 300 es
precision highp float;

uniform sampler2D img1;
uniform sampler2D img2;

in vec2 vTexCoord;
out vec4 outColor;

void main() {
    vec4 color1 = texture(img1, vTexCoord);
    vec4 color2 = texture(img2, vTexCoord);
    outColor =  max(color1, color2);
}