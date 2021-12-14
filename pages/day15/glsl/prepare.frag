#version 300 es
precision highp float;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outNormal;

#define PI 3.14159265359

float random(float x) {
    return fract(sin(x * 13.456) * cos(x + 345.222) * 6434.23);
}
vec3 sphere(float x) {
    float len = (random(x + 23.45) * 2. - 1.) * 500.;
    float a = PI * 2. * random(x * 23.11);
    float b = PI * 2. * random(x * 9.211);
    return vec3(
        len * cos(a) * cos(b),
        len * cos(a) * sin(b),
        len * sin(a)
    );
}
void main() {
 float id = gl_FragCoord.x;
 outPosition = vec4(sphere(id), 1.);
 outNormal = vec4(normalize(sphere(id + 32.12)), 1.);
}