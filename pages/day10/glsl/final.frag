#version 300 es
precision highp float;

uniform sampler2D img;
uniform float time;

in vec2 vTexCoord1;
in vec2 vTexCoord2;

out vec4 outColor;

void main() {
    vec2 uv = vTexCoord1;
    uv.y = clamp(uv.y, 0.0, 0.5 + 0.5 * sin(time * .02));
    float d1 = texture(img, uv).r;
    float d2 = texture(img, vTexCoord2).r;
    float d = mix(d1, d2, .5 * (1. + sin(time * 0.03)));
    vec4 c = vec4(.4, .2, .2, 1.) * step(clamp(d1 - .1, 0.0, 1.0), .001);

    outColor = vec4(vec3(c.yyy) ,1.);
}