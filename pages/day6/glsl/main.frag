precision mediump float;

uniform sampler2D texture;
uniform vec3 lightPos;
uniform mat4 invMatrix;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vTexCoord;

void main(void) {
    vec3 light = lightPos - vPosition;
    vec3 invLight = normalize(invMatrix * vec4(light, 0.)).xyz;
    float diffuse = clamp(dot(invLight, vNormal), 0.1, 1.);

    vec4 tColor = texture2DProj(texture, vTexCoord); // 射影にはこれを使用する

    gl_FragColor = vColor * vec4(vec3(diffuse), 1.) * tColor + vec4(0.1,.1,.1,1.);
}