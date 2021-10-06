#version 300 es
precision highp float;

uniform sampler2D img1;
uniform sampler2D img2;
uniform sampler2D img3;
uniform sampler2D img4;


in vec2 vTexCoord1;

layout(location = 0) out vec4 outColor1;
layout(location = 1) out vec4 outColor2;
layout(location = 2) out vec4 outColor3;
layout(location = 3) out vec4 outColor4;

vec4 pack(float depth){
    float r = depth;
    float g = fract(r * 255.0);
    float b = fract(g * 255.0);
    float a = fract(b * 255.0);
    float coef = 1.0 / 255.0;
    r -= g * coef;
    g -= b * coef;
    b -= a * coef;
    return vec4(r, g, b, a);
}
vec4 packRange(const highp float value,const highp float minimum, const highp float maximum) {
    return pack((value - minimum) / (maximum - minimum));
}
float unpack(vec4 RGBA){
    const float rMask = 1.0;
    const float gMask = 1.0 / 255.0;
    const float bMask = 1.0 / (255.0 * 255.0);
    const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
    float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
    return depth;
}
highp float unpackRange(const vec4 value,const highp float minimum, const highp float maximum) {
    return unpack(value) * (maximum - minimum) + minimum;
} 
vec4 fetch(ivec2 p) {
    vec4 x = texelFetch(img1, p, 0);
    float fx = unpackRange(x, -8., 8.);
    vec4 y = texelFetch(img2, p, 0);
    float fy = unpackRange(y, -8., 8.);
    vec4 z = texelFetch(img3, p, 0);
    float fz = unpackRange(z, 0., 8.);
    vec4 w = texelFetch(img4, p, 0);
    float fw = unpackRange(w, .0, 1.);
    return vec4(fx,fy,fz,fw);
}
float ApproximateEdgeDelta(vec2 grad, float a) 
{
    if (grad.x == 0.0 || grad.y == 0.0) {
        // linear function is correct if both gx and gy are zero
        // and still fair if only one of them is zero
        return 0.5 - a;
    }
    // reduce symmetrical equation to first octant only
    grad = abs(normalize(grad));
    float gmax = max(grad.x, grad.y);
    float gmin = min(grad.x, grad.y);

    // compute delta
    float a1 = 0.5 * gmin / gmax;
    if (a < a1) {
        // 0 <= a < a1
        return 0.5 * (gmax + gmin) - sqrt(2.0 * gmax * gmin * a);
    }
    if (a < (1.0 - a1)) {
        // a1 <= a <= 1 - a1
        return (0.5 - a) * gmax;
    }
    // 1-a1 < a <= 1
    return -0.5 * (gmax + gmin) + sqrt(2.0 * gmax * gmin * (1.0 - a));
}

vec4 UpdateDistance(vec4 p, ivec2 pos, ivec2 o) {
  //  pos.y = 1 - pos.y;
    vec4 neighbor = fetch(pos + o);
    ivec2 ndelta = ivec2(neighbor.xy);
    vec4 closest = fetch(pos + o - ndelta);

    if (closest.w == .0 || o == ndelta) {
        return p;
    }
    vec2 delta = neighbor.xy - vec2(o);
    float dist = length(delta) + ApproximateEdgeDelta(delta, closest.w);
     if (dist < p.z) {
        p.xy = delta;
        p.z = dist;
     }
    return p;
}

void main() {
    ivec2 pos = ivec2(vTexCoord1 * vec2(textureSize(img1, 0)));
    vec4 p = fetch(pos);

    if (p.z > 0.0) {
        // 八方のピクセルの情報から自分の情報を更新する.
        p = UpdateDistance(p, pos, ivec2(-1,  0));
        p = UpdateDistance(p, pos, ivec2(-1, -1));
        p = UpdateDistance(p, pos, ivec2( 0, -1));
        p = UpdateDistance(p, pos, ivec2( 1, -1));
        p = UpdateDistance(p, pos, ivec2( 1,  0));
        p = UpdateDistance(p, pos, ivec2( 1,  1));
        p = UpdateDistance(p, pos, ivec2( 0,  1));
        p = UpdateDistance(p, pos, ivec2(-1,  1));
    }
    outColor1 = packRange(p.x, -8., 8.);
    outColor2 = packRange(p.y, -8., 8.);
    outColor3 = packRange(p.z, 0., 8.);
    outColor4 = packRange(p.w, .0, 1.);
}