#version 300 es
precision highp float;

uniform mat4 vMat;
uniform mat4 pMat;

layout(location = 0) in vec3 iPos;
layout(location = 1) in vec2 iUv;

out vec2 vUv;

void main() {
    vUv = iUv;
    gl_Position = pMat * vMat * vec4(iPos, 1.);
}