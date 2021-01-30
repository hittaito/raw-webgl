precision mediump float;

varying vec4 vPostion;

vec4 convertRGBA(float d) {
    float r = d;
    float g = fract(r * 255.);
    float b = fract(g * 255.);
    float a = fract(b * 255.);
    float bias = 1. / 255.;
    r -= g * bias;
    g -= b * bias;
    b -= a * bias;
    return vec4(r, g, b, a);
}

void main(void) {
    float depth = 1.0 / (150.0 - 0.1);
    depth *= length(vPostion);
    gl_FragColor = convertRGBA(depth);
}