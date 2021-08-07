#version 300 es

uniform mat4 mvpMatrix;
uniform float split;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texCood;
layout(location = 2) in float id;

out vec2 vTexCoord1;
out vec2 vTexCoord2;

vec2 convertTexCoord(float index) {
    float w = 1. / split;
    float x = mod(index, split);
    float y = floor(index / split) ;
    return vec2(
        w * (x + texCood.x),
        w * (y + texCood.y)
    );    
}

void main() {
    vTexCoord1 = convertTexCoord(id);
    vTexCoord2 = convertTexCoord(id + 1.);

    gl_Position = mvpMatrix * vec4(position, 1.);
}