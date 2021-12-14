#version 300 es
precision highp float;

out vec4 outColor;

in vec3 vNormal;

void main() {
    vec4 color = vec4(1., .9, .2,1.);

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(.1,.2,1.));
    float diff = dot(normal, lightDir);
    color.xyz = color.xyz * clamp(diff, .1, 1.);
    outColor = color * 1.;
}