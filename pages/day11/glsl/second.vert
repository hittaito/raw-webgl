#version 300 es
precision mediump float;

in vec2 position;
in float age;
in float life;
in vec2 velocity;

in vec2 coord;
in vec2 texCoord;

out float vAge;
out float vLife;
out vec2 vTexCoord;

void main() {
    float scale = .75;
    vec2 vert_coord = position + (scale*(1. - age / life) + .25) * .1 *coord;
    vAge = age;
    vLife = life;
    vTexCoord = texCoord;
  gl_PointSize = 1.0 + 6. *( 1. - age/life);
  gl_Position = vec4(vert_coord, 0.0, 1.0);
}