import frag1 from './glsl/first.frag';
import vert1 from './glsl/first.vert';
import frag2 from './glsl/second.frag';
import vert2 from './glsl/second.vert';
import frag3 from './glsl/third.frag';
import vert3 from './glsl/third.vert';
import frag4 from './glsl/view.frag';
import vert4 from './glsl/view.vert';
import vBloom from './glsl/bloom.vert';
import fBloom1 from './glsl/bloom1.frag';
import fBloom2 from './glsl/bloom2.frag';
import fBloom3 from './glsl/bloom3.frag';
import { mat4 } from 'gl-matrix';

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string, varyings: string[] | null, type = gl.SEPARATE_ATTRIBS) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return;
    gl.shaderSource(vs, vert);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs));
        console.log(vert);
        return;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return;
    gl.shaderSource(fs, frag);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
        console.log(frag);
        return;
    }
    const prg = gl.createProgram();
    if (!prg) return;
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);
    if (varyings) {
        gl.transformFeedbackVaryings(prg, varyings, type);
    }
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prg));
        return;
    }
    return prg;
}
function setUniformLocation<T extends string>(gl: WebGL2RenderingContext, prg: WebGLProgram, uniforms: T[]) {
    const locations = new Map<T, WebGLUniformLocation>();
    uniforms.forEach((key) => {
        const u = gl.getUniformLocation(prg, key);
        if (!u) return;
        locations.set(key, u);
    });
    return locations;
}
function createVBO(gl: WebGL2RenderingContext, data: number[]) {
    const vbo = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}
function setVAO(gl: WebGL2RenderingContext, data: number[], location: number, length: number) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, length, gl.FLOAT, false, 0, 0);
}
function createIBO(gl: WebGL2RenderingContext, data: number[]) {
    const ibo = gl.createBuffer();
    if (!ibo) return;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
}
function createTexture(gl: WebGL2RenderingContext, internalFormat: number, x: number, y: number, format: number, type: number) {
    const texture = gl.createTexture();
    if (!texture) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, x, y, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}
function createMRTBuffer(gl: WebGL2RenderingContext, x: number, y: number, count: number) {
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) return;
    const textures: WebGLTexture[] = [];
    const attach: number[] = [];
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    for (let i = 0; i < count; i++) {
        const t = createTexture(gl, gl.RGBA32F, x, y, gl.RGBA, gl.FLOAT);
        if (!t) return;
        textures.push(t);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
        attach.push(gl.COLOR_ATTACHMENT0 + i);
    }
    gl.drawBuffers(attach);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return {
        framebuffer,
        textures,
    };
}
function setUniformTexture(gl: WebGL2RenderingContext, id: number, texture: WebGLTexture, uLocation: WebGLUniformLocation) {
    gl.activeTexture(gl.TEXTURE0 + id);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uLocation, id);
}
function clear(gl: WebGL2RenderingContext) {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// ------------------------------------------------------------------------------------------------------------------------------------

const nTRAIL = 1000;
const nVERTEX = 128;

class Main {
    trailUpdate: TrailUpdate;
    trailRender: TrailRender;
    viewer: Viewer;
    vao: WebGLVertexArrayObject;
    frameBuffers: {
        framebuffer: WebGLFramebuffer;
        textures: WebGLTexture[];
    }[] = [];
    init() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        canvas.width = innerWidth * 2;
        canvas.height = innerHeight * 2;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;
        gl.getExtension('EXT_color_buffer_float');

        // create program
        const trailInit = new TrailInit();
        this.trailUpdate = new TrailUpdate();
        this.trailRender = new TrailRender();
        if (!trailInit.init(gl) || !this.trailUpdate.init(gl) || !this.trailRender.init(gl)) return;

        // debugger
        const viewer = new Viewer();
        const v = viewer.init(gl);
        this.viewer = viewer;
        console.log(v);

        // create attr
        const vao = this.createAttribute(gl);
        if (!vao) return;
        this.vao = vao;

        // create texture
        const mrt1 = createMRTBuffer(gl, nTRAIL, nVERTEX, 2);
        const mrt2 = createMRTBuffer(gl, nTRAIL, nVERTEX, 2);
        if (!mrt1 || !mrt2) return;

        this.frameBuffers = [mrt1, mrt2];

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // first step

        console.log(mrt1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[0].framebuffer);
        gl.viewport(0, 0, nTRAIL, nVERTEX);
        clear(gl);
        trailInit.render(gl, vao);
        gl.bindVertexArray(null);

        /*
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        viewer.render(gl, this.vao, this.frameBuffers[0].textures);
        gl.flush();*/
        // render loop
        this.render(gl, 0, false);
    }
    render(gl: WebGL2RenderingContext, time: number, frag: boolean) {
        const id = frag ? 0 : 1;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[id].framebuffer);
        gl.viewport(0, 0, nTRAIL, nVERTEX);
        this.trailUpdate.render(gl, this.vao, this.frameBuffers[1 - id].textures);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.viewer.render(gl, this.vao, this.frameBuffers[id].textures);
        gl.flush();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        clear(gl);
        this.trailRender.render(gl, this.vao, this.frameBuffers[id].textures);
        gl.flush();
        console.log('render');
        requestAnimationFrame(() => this.render(gl, time + 1, !frag));
    }

    createAttribute(gl: WebGL2RenderingContext) {
        //const pos = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
        const pos = [-1, -1, 1, -1, -1, 1, 1, 1];
        const idx = [0, 1, 2, 3, 2, 1];
        //const idx = [0, 2, 1, 2, 3, 1];
        // const vbo = createVBO(gl, pos);
        // const ibo = createIBO(gl, idx);
        const vao = gl.createVertexArray();
        if (!vao) return;
        gl.bindVertexArray(vao);
        setVAO(gl, pos, 0, 2);
        const ibo = gl.createBuffer();
        if (!ibo) return;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(idx), gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return vao;
    }
}

class TrailInit {
    prg: WebGLProgram;
    constructor() {}
    init(gl: WebGL2RenderingContext) {
        const prg = createProgram(gl, vert1, frag1, [], gl.INTERLEAVED_ATTRIBS);
        if (!prg) return;
        this.prg = prg;
        return 1;
    }
    render(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject) {
        gl.useProgram(this.prg);
        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}
class TrailUpdate {
    prg: WebGLProgram;
    uPosTex: WebGLUniformLocation;
    uVelTex: WebGLUniformLocation;
    uTime: WebGLUniformLocation;
    time = 0;
    constructor() {}
    init(gl: WebGL2RenderingContext) {
        const prg = createProgram(gl, vert2, frag2, [], gl.INTERLEAVED_ATTRIBS);
        if (!prg) return;
        this.prg = prg;

        const uniform = setUniformLocation(gl, prg, ['uPosTex', 'uVelTex', 'time']);
        const u1 = uniform.get('uPosTex');
        const u2 = uniform.get('uVelTex');
        const u3 = uniform.get('time');
        if (!u1 || !u2 || !u3) return;
        this.uPosTex = u1;
        this.uVelTex = u2;
        this.uTime = u3;
        return 1;
    }
    render(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject, mrt: WebGLTexture[]) {
        gl.useProgram(this.prg);
        gl.bindVertexArray(vao);
        setUniformTexture(gl, 0, mrt[0], this.uPosTex);
        setUniformTexture(gl, 1, mrt[1], this.uVelTex);
        this.time += 0.01;
        gl.uniform1f(this.uTime, this.time);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}
class TrailRender {
    prg: WebGLProgram;
    uniforms: {
        [k: string]: WebGLUniformLocation;
    };
    vpMat: mat4;
    constructor() {}
    init(gl: WebGL2RenderingContext) {
        const prg = createProgram(gl, vert3, frag3, [], gl.INTERLEAVED_ATTRIBS);
        if (!prg) return;
        this.prg = prg;
        const uniform = setUniformLocation(gl, prg, ['uPosTex', 'vpMat', 'uAlpha', 'uColor']);
        console.log(uniform);
        this.uniforms = Object.fromEntries(uniform);

        const pMat = mat4.create();
        const vMat = mat4.create();
        const vpMat = mat4.create();
        mat4.lookAt(vMat, [0, 0, 150], [0, 0, 0], [0, 1, 0]);
        // mat4.invert(vMat, vMat);
        mat4.perspective(pMat, Math.PI / 2, innerWidth / innerHeight, 0.01, 5000);
        mat4.mul(vpMat, pMat, vMat);
        this.vpMat = vpMat;

        return 1;
    }
    render(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject, mrt: WebGLTexture[]) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.useProgram(this.prg);
        //gl.bindVertexArray(vao);
        setUniformTexture(gl, 0, mrt[1], this.uniforms['uPosTex']);
        gl.uniformMatrix4fv(this.uniforms['vpMat'], false, this.vpMat);
        gl.drawArraysInstanced(gl.LINE_STRIP, 0, nVERTEX, nTRAIL);
        gl.disable(gl.BLEND);
    }
}
class Bloom1 {
    prg: WebGLProgram;
    uniforms: {
        [k: string]: WebGLUniformLocation;
    };
    ortho: mat4;
    constructor() {}
    init(gl: WebGL2RenderingContext) {
        const prg = createProgram(gl, vBloom, fBloom1, null);
        if (!prg) return;
        this.prg = prg;
        const uniform = setUniformLocation(gl, prg, ['vpMat', 'img']);
        this.uniforms = Object.fromEntries(uniform);
        const vMat = mat4.create();
        const pMat = mat4.create();
        this.ortho = mat4.create();
        mat4.lookAt(vMat, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(this.ortho, pMat, vMat);
        return 1;
    }
    render(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject, tex: WebGLTexture) {
        gl.useProgram(this.prg);
        gl.bindVertexArray(vao);
        setUniformTexture(gl, 0, tex, this.uniforms['img']);
        gl.uniformMatrix4fv(this.uniforms['vpMat'], false, this.ortho);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}
class Viewer {
    prg: WebGLProgram;
    uniforms: {
        [k: string]: WebGLUniformLocation;
    };
    vpMat: mat4;
    init(gl: WebGL2RenderingContext) {
        const prg = createProgram(gl, vert4, frag4, []);
        if (!prg) return;
        this.prg = prg;

        const uniform = setUniformLocation(gl, prg, ['vpMat', 'img']);
        console.log(uniform);
        this.uniforms = Object.fromEntries(uniform);

        const vMat = mat4.create();
        const pMat = mat4.create();
        const vpMat = mat4.create();
        mat4.lookAt(vMat, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(vpMat, pMat, vMat);
        this.vpMat = vpMat;

        return 1;
    }
    render(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject, mrt: WebGLTexture[]) {
        gl.useProgram(this.prg);
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(this.uniforms['vpMat'], false, this.vpMat);
        setUniformTexture(gl, 0, mrt[0], this.uniforms['img']);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}
window.onload = () => {
    const m = new Main();
    m.init();
};
