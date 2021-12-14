#version 300 es
precision highp float;

uniform sampler2D srcImg;
uniform sampler2D depthImg;
uniform sampler2D blurImg;

uniform float near;
uniform float far;
uniform float offset;
uniform float forcus;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec3 cSrc = texture(srcImg, vUv).xyz;
    vec3 cBlur = texture(blurImg, vUv).xyz;
    float d = texture(depthImg, vUv).r;
    d = (2.*near)/ (far+ near - d* (far - near));
    d = clamp(d + offset, .0, 1.);

    vec3 c = cSrc * d + cBlur * (1. - d) * d + cBlur * (1. -d) * (1. -d );
    outColor = vec4(c, 1.);
    // outColor = vec4(cSrc, 1.);
}