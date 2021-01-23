precision mediump float;

uniform mat4 normMatrix;
uniform vec3 lightDir;
uniform vec4 ambLightColor;
uniform vec3 cameraDir;
uniform vec3 lightPos;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main(void) {
    vec3 normal = vNormal;
    vec3 lightVec = lightPos - vPosition;
    vec3 invLight = normalize(normMatrix * vec4(lightVec, 0.)).xyz;
    vec3 invCamera = normalize(normMatrix * vec4(cameraDir, 0.)).xyz;
    vec3 halfLE = normalize(invLight + invCamera);
    float specular = pow(clamp(dot(normal, halfLE), 0., 1.), 50.);// 法線 * ハーフベクトル
    float diffuse = clamp(dot(normal, invLight), 0., 1.); // 法線 * 光

    vec4 color = vColor * vec4(vec3(diffuse), 1.) + vec4(vec3(specular), .9) + ambLightColor;
    gl_FragColor = color;
}