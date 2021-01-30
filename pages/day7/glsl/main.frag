precision mediump float;

uniform sampler2D texture;
uniform vec3 lightPos;
uniform mat4 invMatrix;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vTexCoord;
varying vec4 vDepth;

float restDepth(vec4 dColor) {
    float r = 1.;
    float g = 1. / 255.;
    float b = 1. / 255. / 255.;
    float a = 1. / 255. / 255. / 255.;
    return dot(dColor, vec4(r, g, b, a));
}

void main(void) {
    vec3 light = lightPos - vPosition;
    vec3 invLight = normalize(invMatrix * vec4(light, 0.)).xyz;
    float diffuse = clamp(dot(invLight, vNormal), 0.1, 1.);

    float shadow = restDepth(texture2DProj(texture, vTexCoord));

    vec4 dCol = vec4(1.);
    if (vDepth.w > 0.) {
        float lightDepth = 1.0 / (150. - 0.1);
        lightDepth *= length(vPosition.xyz - lightPos);
        if (lightDepth - 0.0001 > shadow) {
            dCol = vec4(.5,.5,.5, 1.);
        }
    }

    gl_FragColor = vColor * vec4(vec3(diffuse), 1.) * dCol;
}