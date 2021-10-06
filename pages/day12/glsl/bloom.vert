#version 300 es

uniform mat4 vpMat;

layout(location = 0) in vec3 position;

out vec2 vTexCoord;

void main() {
    vTexCoord = (position + 1.) * .5;
    gl_Position = vpMat * vec4(position, 1.);
}