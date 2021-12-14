#version 300 es
precision highp float;

uniform sampler2D img;

in vec2 vUv;

out vec4 oColor;

void main(void) {
    vec2 texSize = vec2(textureSize(img, 0));
    vec2 invTexSize = 1. / texSize;

    vec2 uv = vUv * texSize;
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    i += step(.5, f);
    f -= (step(.5, f) * 2. - 1.) * .5;

    vec4 v00 = texture(img, (i + vec2(-.5, -.5)) * invTexSize);
    vec4 v10 = texture(img, (i + vec2( .5, -.5)) * invTexSize);
    vec4 v01 = texture(img, (i + vec2(-.5,  .5)) * invTexSize);
    vec4 v11 = texture(img, (i + vec2( .5,  .5)) * invTexSize);
    oColor = mix(mix(v00, v10, f.x),mix(v01, v11, f.x), f.y);
}%