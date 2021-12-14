#version 300 es
precision highp float;

uniform mat4 mMat;
uniform mat4 vMat;
uniform mat4 pMat;
uniform sampler2D iPos;
uniform sampler2D iNorm;
const int segments = 1000;

out vec3 vNormal;

mat4 look(vec3 pos, vec3 target, vec3 up) {
    vec3 z = normalize(target - pos);
    vec3 x = normalize(cross(up, z));
    vec3 y = normalize(cross(z, x));
    return mat4(
        x, 0,
        y, 0,
        z, 0,
        pos, 1
    );
}

void main() {
    vec3 position = texelFetch(iPos, ivec2(gl_InstanceID, gl_VertexID), 0).xyz;
    vec3 prevPos = texelFetch(iPos, ivec2(gl_InstanceID, max(gl_VertexID - 1, 0)), 0).xyz;
    vec3 nextPos = texelFetch(iPos, ivec2(gl_InstanceID, min(gl_VertexID + 1, segments)), 0).xyz;
    vec3 norm = texelFetch(iNorm, ivec2(gl_InstanceID, gl_VertexID), 0).xyz;

    vec4 wPos = mMat * vec4(position, 1.);
    vec4 pwPos = mMat * vec4(prevPos, 1.);
    vec4 nwPos = mMat * vec4(nextPos, 1.);

    vec3 prevDir = wPos.xyz - pwPos.xyz;
    prevDir = length(prevDir) > 1e-8 ? normalize(prevDir) : vec3(0.);
    vec3 nextDir = nwPos.xyz - wPos.xyz;
    nextDir = length(nextDir) > 1e-8 ? normalize(nextDir) : vec3(0.);

    norm = length(norm) > 1e-8 ? normalize(norm) : vec3(0.);
    wPos.xyz += .5 * (mod(float(gl_VertexID + 1), 2.) * 2. - 1.) * norm * 4.;

    vNormal = norm;

    vec3 prevTar = texelFetch(iPos, ivec2(0, 0), 0).xyz;
    vec3 target = texelFetch(iPos, ivec2(0, 2), 0).xyz;
    vec3 n = texelFetch(iNorm, ivec2(0, 0), 0).xyz;
    mat4 vv = look(target + n + (prevTar - target), target, n);

    gl_Position = pMat * vMat * wPos;
    gl_PointSize = 2.;
}