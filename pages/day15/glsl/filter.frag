#version 300 es

precision highp float;

uniform sampler2D img;
uniform float uThreshold;
uniform float uIntensity;

in vec2 vUv;

out vec4 o_color;

void main(void) {
    o_color = vec4(uIntensity * max(texture(img, vUv).rgb - uThreshold, 0.0) / (1.0 - uThreshold + 0.01), 1.0);
}