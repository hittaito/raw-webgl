#version 300 es

uniform sampler2D uPosTex;
uniform mat4 vpMat;

void main(void) {
  vec3 position = texelFetch(uPosTex, ivec2(gl_InstanceID, gl_VertexID), 0).xyz;
  gl_Position = vpMat * vec4(position, 1.0);
}