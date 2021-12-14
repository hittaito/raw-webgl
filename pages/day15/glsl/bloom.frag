#version 300 es
precision highp float;

uniform sampler2D img1;
uniform sampler2D img2;
uniform sampler2D img3;
uniform sampler2D img4;
uniform sampler2D img5;

in vec2 vUv;

out vec4 outColor;

void main() {
    vec3 color = vec3(0.);
    color += texture(img1, vUv).xyz;
    color += 2. * texture(img2, vUv).xyz;
    color += 4. * texture(img3, vUv).xyz;
    color += 6. * texture(img4, vUv).xyz;
    color += 8. * texture(img5, vUv).xyz;
    outColor = vec4(color, 1.);
}