#version 300 es

uniform mat4 mvpMatrix;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texCoord1;
layout(location = 2) in vec2 texCoord2;

out vec2 vTexCoord1;
out vec2 vTexCoord2;

void main() {
    vTexCoord1 = texCoord1;
    vTexCoord2 = texCoord2;
    gl_Position = mvpMatrix * vec4(position, 1.);
}