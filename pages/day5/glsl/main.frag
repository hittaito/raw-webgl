precision mediump float;

uniform samplerCube cubeTexture;
uniform vec3 cameraPos;
uniform int reflection;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main(void) {
    vec3 ref;
     if (reflection == 0) {
        ref = reflect(vPosition - cameraPos, vNormal);
     } else {
         ref = vNormal;
    }
    vec4 envColor = textureCube(cubeTexture, ref);
    vec4 destColor = vColor * envColor;
    gl_FragColor = destColor;
}