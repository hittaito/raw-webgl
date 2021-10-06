#version 300 es
precision highp float;

#define INSIDE 8.
#define OUTSIDE 8.

uniform sampler2D img1;
uniform sampler2D img2;


in vec2 vTexCood;

out vec4 outColor;

float unpack(vec4 RGBA){
    const float rMask = 1.0;
    const float gMask = 1.0 / 255.0;
    const float bMask = 1.0 / (255.0 * 255.0);
    const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
    float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
    return depth;
}
highp float unpackRange(const vec4 value,const highp float minimum, const highp float maximum) {
    return unpack(value) * (maximum - minimum) + minimum;
} 

void main() {
    vec4 i1 = texture(img1, vTexCood);
    float inside = unpackRange(i1, 0., 8.);
    // vec3 img = texture(img1, vTexCood).xyz;
    vec4 i2 = texture(img2, vTexCood);
    float outside = unpackRange(i2, 0., 8.) ;
    // vec3 imgb = texture(img2, vTexCood).xyz;

    float dist = clamp(inside / INSIDE, .0, 1.) - clamp(outside / OUTSIDE, .0, 1.) ;

    outColor = vec4(vec3(dist) ,1.);
}