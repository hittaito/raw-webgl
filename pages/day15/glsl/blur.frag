#version 300 es
precision highp float;

uniform sampler2D img;
uniform bool flag;

in vec2 vUv;
out vec4 outColor;

const float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec3 col = texture(img, vUv).rgb * weight[0];
    vec2 offset = 1. / vec2(textureSize(img, 0));

    if (flag) {
        for (int i = 1; i < 5; ++i) {
            col += texture(img, vUv + vec2(offset.x * float(i), 0.)).rgb * weight[i];
            col += texture(img, vUv - vec2(offset.x * float(i), 0.)).rgb * weight[i];
        } 
    }else {
        for (int i = 1; i < 5; ++i) {
            col += texture(img, vUv + vec2(0., offset.y * float(i))).rgb * weight[i];
            col += texture(img, vUv - vec2(0., offset.y * float(i))).rgb * weight[i];
        }
    }
    outColor = vec4(col, 1.);
}