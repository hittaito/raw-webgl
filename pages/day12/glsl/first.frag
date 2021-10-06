#version 300 es
precision highp float;

#define PI 3.14159265359

layout(location = 0) out vec4 oPosition;
layout(location = 1) out vec4 oVelocity;

float rand(float x) {
    return fract(sin(x * 12.2345) * sin(x * .02345));
}
vec3 rand3(float x) {
    float z = rand(x * 0.42 + 213.23) * 2.0 - 1.0;
    float phi = rand(x * 0.19 + 313.98) * PI * 2.0;
    float r = rand(x * 0.35 + 192.75);

    float a = pow(r, 1.0 / 3.0);
    float b = sqrt(1.0 - z * z);

    return vec3(a * b * cos(phi), a * b * sin(phi), a * z);
}
vec3 rand32(float x){
    return vec3(rand(x), rand(x + .23), 0.);
}
void main() {
    oPosition = vec4(rand3(gl_FragCoord.x), 1.);
    oVelocity = vec4(vec3(0.), 1.);
}