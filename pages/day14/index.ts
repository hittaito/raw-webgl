import frag1 from './glsl/first.frag';
import vert1 from './glsl/first.vert';
import { mat4, ReadonlyVec3, vec3 } from 'gl-matrix';

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
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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

class Main {
    prg: Program;
    init() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;
        gl.getExtension('EXT_color_buffer_float');
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const prg = new Program();
        prg.init(gl);
        this.prg = prg;

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        this.render(gl, 0, false);
    }
    render(gl: WebGL2RenderingContext, time: number, frag: boolean) {
        clear(gl);
        this.prg.render(gl);
        gl.flush();
        requestAnimationFrame(() => this.render(gl, time + 1, !frag));
    }
}
const nSEGMENT = 1000;
class Program {
    prg: WebGLProgram;
    location: Map<'mMat' | 'vMat' | 'pMat' | 'cPos', WebGLUniformLocation>;
    mat: {
        mMat: mat4;
        vMat: mat4;
        pMat: mat4;
        cPos: vec3;
    };
    vao: WebGLVertexArrayObject;
    init(gl: WebGL2RenderingContext) {
        // create program
        const prg = createProgram(gl, vert1, frag1, null, gl.SEPARATE_ATTRIBS);
        if (!prg) return;
        this.prg = prg;

        // uniform
        this.location = setUniformLocation(gl, prg, ['mMat', 'vMat', 'pMat', 'cPos']);
        // attribute
        const vao = this.setGeometry(gl);
        console.log(vao);
        if (!vao) return;
        this.vao = vao;

        const pMat = mat4.create();
        const vMat = mat4.create();
        const mMat = mat4.create();
        const camera: vec3 = [0, 0, 200];
        mat4.lookAt(vMat, camera, [0, 0, 0], [0, 1, 0]);
        mat4.perspective(pMat, (75 * Math.PI) / 180, innerWidth / innerHeight, 0.1, 1000);
        this.mat = {
            mMat,
            vMat,
            pMat,
            cPos: camera,
        };
        console.log(this.mat);
    }
    render(gl: WebGL2RenderingContext) {
        gl.useProgram(this.prg);
        gl.bindVertexArray(this.vao);
        // uniform set
        gl.uniformMatrix4fv(this.location.get('mMat')!, false, this.mat.mMat);
        gl.uniformMatrix4fv(this.location.get('vMat')!, false, this.mat.vMat);
        gl.uniformMatrix4fv(this.location.get('pMat')!, false, this.mat.pMat);
        gl.uniform3fv(this.location.get('cPos')!, this.mat.cPos);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, nSEGMENT);
    }
    setGeometry(gl: WebGL2RenderingContext) {
        const nVert = nSEGMENT;
        const positions = new Array(nVert * 3);
        const signs = new Array(nVert);
        for (let i = 0; i < nSEGMENT; i++) {
            positions[i * 3] = 50.0 * Math.sin(0.032 * i + 0.35) * Math.sin(-0.029 * i + 4.86); // x
            positions[i * 3 + 1] = 50.0 * Math.sin(i * 0.041 - 1.96);
            positions[i * 3 + 2] = 50.0 * Math.sin(i * 0.078 - 5.21);
            signs[i] = ((i % 2) - 0.5) * -2;
        }

        const pos = [...positions];
        const f = positions.splice(0, 3);
        const e = positions.splice(positions.length - 3, 3);
        const prevPos = [...f, ...f, ...positions];
        const nextPos = [...positions, ...e, ...e];

        const vao = gl.createVertexArray();
        if (!vao) return;
        gl.bindVertexArray(vao);
        setVAO(gl, pos, 0, 3);
        setVAO(gl, prevPos, 1, 3);
        setVAO(gl, nextPos, 2, 3);
        setVAO(gl, signs, 3, 1);
        // createIBO(gl, indexes);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return vao;
    }
}

window.onload = () => {
    const m = new Main();
    m.init();
};
