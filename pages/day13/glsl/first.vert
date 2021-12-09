#version 300 es
precision highp float;

uniform mat4 mMat;
uniform mat4 vMat;
uniform mat4 pMat;
uniform vec3 cPos;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 prevPos;
layout(location = 2) in vec3 nextPos;
layout(location = 3) in float sign;

void main() {
    vec4 wPos = mMat * vec4(position, 1.);
    vec4 pwPos = mMat * vec4(prevPos, 1.);
    vec4 nwPos = mMat * vec4(nextPos, 1.);

    vec3 prevDir = wPos.xyz - pwPos.xyz;
    prevDir = length(prevDir) > 1e-8 ? normalize(prevDir) : vec3(0.);
    vec3 nextDir = nwPos.xyz - wPos.xyz;
    nextDir = length(nextDir) > 1e-8 ? normalize(nextDir) : vec3(0.);

    vec3 posDir = prevDir + nextDir;
    vec3 viewDir = cPos - wPos.xyz;
    vec3 norm = cross(viewDir, posDir);
    norm = length(norm) > 1e-8 ? normalize(norm) : vec3(0.);
    wPos.xyz += .5 * sign * norm;

    gl_Position = pMat * vMat * wPos;
}