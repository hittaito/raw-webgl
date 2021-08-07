#version 300 es
precision highp float;

#define INSIDE 8.
#define OUTSIDE 8.

uniform sampler2D img1;
uniform sampler2D img2;


in vec2 vTexCood;

out vec4 outColor;

void main() {
    float inside = texture(img1, vTexCood).z;
    vec3 img = texture(img1, vTexCood).xyz;
    float outside = texture(img2, vTexCood).z;
    vec3 imgb = texture(img2, vTexCood).xyz;

    float dist =  (clamp(inside / INSIDE, .0, 1.) - clamp(outside / OUTSIDE, .0, 1.)) ;

    outColor = vec4(vec3(dist) ,1.);
}