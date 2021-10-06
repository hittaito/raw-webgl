#version 300 es
precision highp float;


uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float time;

layout(location = 0) out vec4 oPosition;
layout(location = 1) out vec4 oVelocity;

float N21(vec4 p) {
    return fract(sin(p.x * .342 + p.y * .893 + p.z * .342 + p.w * .256) * 56.47);
}
float random(vec4 x){
  return fract(sin(dot(x,vec4(12.9898, 78.233, 39.425, 27.196))) * 43758.5453);
}
float SmoothNoise(vec4 p) {
    vec4 lv = fract(p);
    vec4 id = floor(p);
    lv = lv * lv * (3. - 2. * lv);
    float n000 = N21(id);
    float n001 = N21(id + vec4(0, 0, 1, 0));
    float n010 = N21(id + vec4(0, 1, 0, 0));
    float n011 = N21(id + vec4(0, 1, 1, 0));
    float n100 = N21(id + vec4(1, 0, 0, 0));
    float n101 = N21(id + vec4(1, 0, 1, 0));
    float n110 = N21(id + vec4(1, 1, 0, 0));
    float n111 = N21(id + vec4(1, 1, 1, 0));

    float m00 = mix(n000, n001, lv.z);
    float m01 = mix(n010, n011, lv.z);
    float m10 = mix(n100, n101, lv.z);
    float m11 = mix(n110, n111, lv.z);

    float l0 = mix(m00, m01, lv.y);
    float l1 = mix(m10, m11, lv.y);

    return mix(l0, l1, lv.x);
}
float SN4(vec4 p) {
    float s1 = SmoothNoise(p);
    float s2 = SmoothNoise(p + vec4(0.,0.,0.,.1));
    vec4 lv = fract(p);
    vec4 id = floor(p);
    lv = lv * lv * (3. - 2. * lv);
    return mix(s1, s2, lv.w);
}
float fbm(vec4 p) {
  float sum = 0.0;
  float amp = 1.;
  for (int i = 0; i < 5; i++) {
    sum += amp * SN4(p);
    amp *= 0.5;
    p *= 2.01;
  }
  return sum * 2.0 - 1.0;
}
float pattern(vec4 p) {
    vec4 q = vec4(
        fbm( p + vec4(0.0) ),
        fbm( p + vec4(5.2,1.3, 3.7, 9.2) ),
        fbm( p + vec4(53.2,2.3, 13.4, 18.2) ),
        fbm( p + vec4(5.9,7.3, 31.7, 7.2) )
    );

    return fbm( p + 4.0*q );
}

float noiseX(vec4 p) {
    return fbm(p * .346 + vec4(22.56 ,75.23, 23.11, 47.21));
}
float noiseY(vec4 p) {
    return fbm(p * .983 + vec4(62.82, 23.92, 19.76, 41.56));
}
float noiseZ(vec4 p) {
    return fbm(p * .452 + vec4(45.16, 98.12, 73.23, 63.13));
}

vec3 curlNoise(vec3 p) {
    vec2 e = vec2(.0, .001);

    return normalize(vec3(
        (noiseZ(vec4(p + e.xyx, time)) - noiseZ(vec4(p - e.xyx, time))) - (noiseY(vec4(p + e.xxy, time)) - noiseY(vec4(p - e.xxy, time))),
        (noiseX(vec4(p + e.xxy, time)) - noiseX(vec4(p - e.xxy, time))) - (noiseZ(vec4(p + e.yxx, time)) - noiseZ(vec4(p - e.yxx, time))),
        (noiseY(vec4(p + e.yxx, time)) - noiseY(vec4(p - e.yxx, time))) - (noiseX(vec4(p + e.xyx, time)) - noiseX(vec4(p - e.xyx, time)))
    ) / e.y * .5);
}
vec3 limit(vec3 v, float max) {
  if (length(v) > max) {
    return normalize(v) * max;
  }
  return v;
}
vec3 centerForce(vec3 p) {
    return -normalize(p);
}
void main() {
    // x番目のy頂点
    ivec2 coord = ivec2(gl_FragCoord.xy);
    vec3 nextPos, nextVel;
    
    if (coord.y == 0) {
        vec3 pos = texelFetch(uPosTex, coord, 0).xyz;
        vec3 vel = texelFetch(uVelTex, coord, 0).xyz;

         vec3 acc = curlNoise(pos * .3);
        // acc =
        acc = 30. * mix(acc, -normalize(pos), smoothstep(95., 95. * 1.05, length(pos)));
        nextVel += limit(vel + acc * .2 , 101.);
        nextPos += nextVel  * .1 ;  
    } else {
        nextPos = texelFetch(uPosTex, ivec2(coord.x, coord.y - 1), 0).xyz;
        nextVel = texelFetch(uVelTex, ivec2(coord.x, coord.y - 1), 0).xyz;
    }
 //   nextPos = texelFetch(uPosTex, ivec2(coord.x, coord.y), 0).xyz;
   // nextVel = texelFetch(uVelTex, ivec2(coord.x, coord.y), 0).xyz;
    oPosition = vec4(nextPos, 1.);
    oVelocity = vec4(nextVel, 1.);
}
