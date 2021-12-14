#version 300 es
precision highp float;

uniform sampler2D img;
uniform float near;
uniform float far;

in vec2 vUv;

out vec4 outColor;

void main() {
    // float d = texture(img, vUv).r;
    // d = (2.*near)/ (far+ near - d* (far - near));
    // outColor = vec4(vec3(d),1.);
    outColor = texture(img, vUv);
}