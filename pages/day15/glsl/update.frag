#version 300 es
precision highp float;

uniform sampler2D iPos;
uniform sampler2D iNorm;
uniform float time;
uniform float frequent;
uniform float multiplier;
uniform float diff;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outNormal;

##PERLIN

vec4 curl(vec4 p) {
    // p.a -= uDecaySpeed * uDelta;
    float t =time * diff;
    vec4 baseColor = p;


    p.r += perlin3d(vec3(baseColor.gb * frequent, t)) * multiplier;
    p.g += perlin3d(vec3(baseColor.br * frequent + 123., t)) * multiplier;
    p.b += perlin3d(vec3(baseColor.rg * frequent + 123456., t)) * multiplier;
    //baseColor.g += .002;
    //baseColor.b += .003;
    if (p.a <= .0) {
       // p = texture2D(uBaseTexture, vUv);
        p.a = 1.;
    }
    if (length(p) > 300.) {
        p -= normalize(p);
    }
    return p;
}

void main() {
    ivec2 uv = ivec2(gl_FragCoord.xy);
    vec4 pos = vec4(0.);
    vec4 norm = vec4(0.);
    if (uv.y == 0 || uv.y == 1) {
        vec4 prevPos = texelFetch(iPos, uv, 0);
        vec4 prevNorm = texelFetch(iNorm, uv, 0);
        pos = curl(prevPos);

        vec3 front = normalize(pos.xyz - prevPos.xyz);
        vec3 right = cross(front, prevNorm.xyz);
        norm = vec4(normalize(cross(right, front)), 1.);

    } else {
        pos = texelFetch(iPos, uv - ivec2(0,2), 0);
        norm = texelFetch(iNorm, uv - ivec2(0,2), 0);
    }
    outPosition = pos;
    outNormal = norm;
}