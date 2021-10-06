#version 300 es
precision highp float;

#define SQRT2 1.41421356237
#define CH a

uniform sampler2D img;
uniform float flag;

in vec2 vTexCood;

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

vec2 ComputeEdgeGradients(ivec2 pos) {
    float g = 
        - texelFetch(img, pos + ivec2(-1,-1), 0).CH
        - texelFetch(img, pos + ivec2(-1, 1), 0).CH
        + texelFetch(img, pos + ivec2( 1,-1), 0).CH
        + texelFetch(img, pos + ivec2( 1, 1), 0).CH;

    return normalize(vec2(
        g + (texelFetch(img, pos + ivec2(1, 0), 0).CH - texelFetch(img, pos + ivec2(-1, 0), 0).CH) * SQRT2,
        g + (texelFetch(img, pos + ivec2(0, 1), 0).CH - texelFetch(img, pos + ivec2(0, -1), 0).CH) * SQRT2
    ));
}
vec2 sobel(ivec2 pos) {
    float l1 = texelFetch(img, pos + ivec2(-1, 1), 0).CH;
    float l2 = texelFetch(img, pos + ivec2(-1, 0), 0).CH;
    float l3 = texelFetch(img, pos + ivec2(-1, -1), 0).CH;

    float t = texelFetch(img, pos + ivec2(0, 1), 0).CH;
    float b = texelFetch(img, pos + ivec2(0, -1), 0).CH;

    float r1 = texelFetch(img, pos + ivec2(1, 1), 0).CH;
    float r2 = texelFetch(img, pos + ivec2(1, 0), 0).CH;
    float r3 = texelFetch(img, pos + ivec2(1, -1), 0).CH;

    return vec2(1.);   
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
float InitializeDistance(vec2 grad, float alpha)
{
    if (alpha <= 0.) {
        // outside
        return 8.0;    // 浮動小数点数の精度が心もとないので気持ち小さめにする.
    } else if (alpha < 1.0) {
        // on the edge
        return ApproximateEdgeDelta(grad, alpha);
    } else {
        // inside
        return 0.0;
    }
}


void main() {
    ivec2 pos = ivec2(vTexCood * vec2(textureSize(img, 0)));
  //  ivec2 pos = ivec2(vTexCood * resolution);
    vec2 grad = ComputeEdgeGradients(pos);
    float alpha = texelFetch(img, pos, 0).CH;

    // gradient.xy = grad;
    // gradient.a = 1.0;    // 途中結果を画像で見たいときのため.

    // 図形の内側に向かって行う処理

    if (flag == 1.) {
        float z1 = InitializeDistance(-grad, 1.0 - alpha);
        outColor3 = packRange(z1, 0., 8.);
        outColor4 = packRange(1. - alpha,0., 1.);  
        outColor1 = vec4(.5);
        outColor2 = vec4(.5);      
    } else {
        float z2 = InitializeDistance(grad, alpha);
        outColor3 = packRange(z2, 0.,  8.);
        outColor4 = packRange(alpha, 0., 1.);  
        outColor1 = vec4(.5);
        outColor2 = vec4(.5);          
    }

    // outColor1.xy = vec2(0.0);
    // outColor1.z = InitializeDistance(-grad, 1.0 - alpha); // 勾配逆向き・白黒反転
    // outColor1.a = 1.0 - alpha;


    // 図形の外側に向かって行う処理
    // outColor2.xy = vec2(0.0);
    // outColor2.z = InitializeDistance(grad, alpha);
    // outColor2.a = alpha;

   // outColor1.xy = - grad;
   // outColor1.a = 1.;
}