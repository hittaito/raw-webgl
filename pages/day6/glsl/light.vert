precision mediump float;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDir;
uniform vec3 cameraDir;
uniform vec4 ambColor;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

varying vec4 vColor;

void main(void) {
    vec3 invLight = normalize(invMatrix * vec4(lightDir, 0.)).xyz;
    vec3 invCamera = normalize(invMatrix * vec4(cameraDir, 0.)).xyz;
    vec3 halfEL = normalize(invLight + invCamera);
    float diffuse = clamp(dot(normal, invLight), 0.,1.);
    float specular = pow(clamp(dot(normal, halfEL), 0.,1.), 50.);
    vColor = color * ambColor * vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
    gl_Position = mvpMatrix * vec4(position, 1.);
}