#version 300 es

uniform mat4 vpMat;

layout(location = 0) in vec2 position;

out vec2 vTexCoord;

void main() {
    vTexCoord = position;

    gl_Position = vpMat * vec4(position , 0., 1.);
}