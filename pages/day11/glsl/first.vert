#version 300 es
precision mediump float;

uniform float dTime;
uniform sampler2D noise;
uniform vec2 gravity;
uniform vec2 origin;
uniform float minTheta;
uniform float maxTheta;
uniform float minSpeed;
uniform float maxSpeed;
uniform sampler2D force;

in vec2 position;
in float age;
in float life;
in vec2 velocity;

out vec2 vPosition;
out float vAge;
out float vLife;
out vec2 vVelocity;

void main() {

    vec2 fo = 4. * (2. * texture(force, position).rg - vec2(1.));
    if (age > life) {
        ivec2 noise_coord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
        vec2 rand = texelFetch(noise, noise_coord, 0).rg;

        float theata = minTheta + rand.r*(maxTheta - minTheta);
        float x = cos(theata);
        float y = sin(theata);

        vPosition = origin;
        vAge = 0.;
        vLife = life;
        vVelocity = vec2(x,y) * (minSpeed + rand.g *(maxSpeed - minSpeed));
    } else {
        vPosition = position + velocity * dTime;
        vAge = age + dTime;
        vLife = life;
        vVelocity = velocity + (gravity + fo) * dTime;
    }
}