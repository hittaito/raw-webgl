#version 300 es
precision highp float;

uniform sampler2D img;

in vec2 vTexCoord;
out vec4 outColor;
void main() {
    vec3 tex = texture(img, vTexCoord).rgb;
    float brightness = dot(tex, vec3(255. / 255., 203./ 255., 60./255.));
    if (brightness > 1.) {
        outColor = vec4(tex, 1.);
    } else {
        outColor = vec4(vec3(0.),1.);
    }
}