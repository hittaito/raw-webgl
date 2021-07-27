#version 300 es

uniform float time;
uniform vec2 mouse;
uniform float move;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in vec4 color;

out vec3 vPosition;
out vec3 vVelocity;
out vec4 vColor;

void main() {
    vPosition = position + velocity * .1 * move;
    vec3 p = vec3(mouse, sin(time) * .25) - position;
    vVelocity = normalize(velocity + p * .2 * move);
    vColor = vec4(position.xy,1., 1.);
}