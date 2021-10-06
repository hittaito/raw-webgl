import { mat4 } from 'gl-matrix';
import * as webfont from 'webfontloader';
import fFrag from './glsl/first.frag';
import fVert from './glsl/first.vert';
import sFrag from './glsl/second.frag';
import sVert from './glsl/second.vert';
import tFrag from './glsl/third.frag';
import tVert from './glsl/third.vert';
import dVert from './glsl/final.vert';
import dFrag from './glsl/final.frag';

class Main {
    // first
    prg1: WebGLProgram;
    uniform1: Map<LocationName, WebGLUniformLocation>;
    attribute1: WebGLVertexArrayObject;
    matrix: Matrix;
    texture: WebGLTexture;

    // second
    prg2: WebGLProgram;
    uniform2: Map<LocationName2, WebGLUniformLocation>;
    attribute2: WebGLVertexArrayObject;

    // third
    prg3: WebGLProgram;
    uniform3: Map<LocationName2, WebGLUniformLocation>;
    attribute3: WebGLVertexArrayObject;

    frameBuffer1: frameBuffer;
    frameBuffer2: frameBuffer;
    frameBuffer3: frameBuffer;

    // final draw
    prg4: WebGLProgram;
    uniform4: Map<LocationName4, WebGLUniformLocation>;
    attribute4: WebGLVertexArrayObject;
    frameBuffer4: frameBuffer;

    index: WebGLBuffer;
    position: WebGLBuffer;
    texCoord: WebGLBuffer;

    constructor() {}
    init() {
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        //if (dpr === 1) dpr = 2;
        canvas.width = 1024 * dpr;
        canvas.height = 1024 * dpr;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;
        gl.getExtension('OES_texture_float');
        const n = gl.getExtension('EXT_color_buffer_float');
        // console.log(n);
        this.createTextCanvas(gl).then(() => {
            this.setUp(gl);
        });
    }
    setUp(gl: WebGL2RenderingContext) {
        const shader = this.createShader(gl, fVert, fFrag);
        if (!shader) return;

        const prg = this.createProgram(gl, shader);
        if (!prg) return;
        this.prg1 = prg;

        this.uniform1 = this.setUniformLocation(gl, prg, ['mvpMatrix', 'img', 'flag']);
        const vao = this.createAttribute(gl);
        if (!vao) return;
        this.attribute1 = vao;

        const shader2 = this.createShader(gl, sVert, sFrag);
        if (!shader2) return;
        const prg2 = this.createProgram(gl, shader2);
        if (!prg2) return;
        this.prg2 = prg2;
        this.uniform2 = this.setUniformLocation(gl, prg2, ['mvpMatrix', 'img1', 'img2', 'img3', 'img4']);
        const vao2 = this.create2ndAttribute(gl);
        if (!vao2) return;
        this.attribute2 = vao2;

        const shader3 = this.createShader(gl, tVert, tFrag);
        if (!shader3) return;
        const prg3 = this.createProgram(gl, shader3);
        if (!prg3) return;
        this.prg3 = prg3;
        this.uniform3 = this.setUniformLocation(gl, prg3, ['mvpMatrix', 'img1', 'img2']);
        const vao3 = this.create2ndAttribute(gl);
        if (!vao3) return;
        this.attribute3 = vao3;

        const shader4 = this.createShader(gl, dVert, dFrag);
        if (!shader4) return;
        const prg4 = this.createProgram(gl, shader4);
        if (!prg4) return;
        this.prg4 = prg4;

        this.uniform4 = this.setUniformLocation(gl, prg4, ['mvpMatrix', 'img', 'split', 'time']);
        const vao4 = this.create3rdAttribute(gl);
        if (!vao4) return;
        this.attribute4 = vao4;

        this.matrix = {
            vMat: mat4.create(),
            pMat: mat4.create(),
            vpMat: mat4.create(),
        };
        mat4.lookAt(this.matrix.vMat, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(this.matrix.pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(this.matrix.vpMat, this.matrix.pMat, this.matrix.vMat);

        // create frame buffer
        const buffer1 = this.createMRTBuffer(gl, 1024, 4);
        if (!buffer1) return;
        this.frameBuffer1 = buffer1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1.frameBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

        const buffer2 = this.createMRTBuffer(gl, 1024, 4);
        if (!buffer2) return;
        this.frameBuffer2 = buffer2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer2.frameBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

        const buffer3 = this.createMRTBuffer(gl, 1024, 4);
        if (!buffer3) return;
        this.frameBuffer3 = buffer3;
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer3.frameBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

        const buffer4 = this.createBuffer(gl, 1024);
        if (!buffer4) return;
        this.frameBuffer4 = buffer4;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, buffer1.textures[0]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, buffer1.textures[1]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, buffer1.textures[2]);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, buffer1.textures[3]);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, buffer2.textures[0]);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, buffer2.textures[1]);
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, buffer2.textures[2]);
        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_2D, buffer2.textures[3]);
        gl.activeTexture(gl.TEXTURE9);
        gl.bindTexture(gl.TEXTURE_2D, buffer3.textures[0]);
        gl.activeTexture(gl.TEXTURE10);
        gl.bindTexture(gl.TEXTURE_2D, buffer3.textures[1]);
        gl.activeTexture(gl.TEXTURE11);
        gl.bindTexture(gl.TEXTURE_2D, buffer3.textures[2]);
        gl.activeTexture(gl.TEXTURE12);
        gl.bindTexture(gl.TEXTURE_2D, buffer3.textures[3]);
        gl.activeTexture(gl.TEXTURE13);
        gl.bindTexture(gl.TEXTURE_2D, buffer4.textures[0]);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        this.prepare(gl);
    }
    prepare(gl: WebGL2RenderingContext) {
        console.log('prepare');
        this.prepare2(gl, false);
        console.log('prepare2');
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer3.frameBuffer);
        gl.useProgram(this.prg2);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(this.attribute2);
        const img1b = this.uniform2.get('img1');
        const img2b = this.uniform2.get('img2');
        const img3b = this.uniform2.get('img3');
        const img4b = this.uniform2.get('img4');
        const mvpMatrix2a = this.uniform2.get('mvpMatrix');
        console.log(this.uniform3);
        if (!img1b || !img2b || !mvpMatrix2a || !img3b || !img4b) return;
        gl.uniform1i(img1b, 5);
        gl.uniform1i(img2b, 6);
        gl.uniform1i(img3b, 7);
        gl.uniform1i(img4b, 8);
        gl.uniformMatrix4fv(mvpMatrix2a, false, this.matrix.vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        console.log('prepare3');
        // outside
        this.prepare2(gl, true);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer4.frameBuffer);
        console.log('third');
        // third
        gl.useProgram(this.prg3);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(this.attribute3);
        const img3 = this.uniform3.get('img1');
        const img4 = this.uniform3.get('img2');
        const mvpMatrix3 = this.uniform3.get('mvpMatrix');
        if (!img3 || !img4 || !mvpMatrix3) return;
        gl.uniform1i(img3, 11);
        gl.uniform1i(img4, 3);
        gl.uniformMatrix4fv(mvpMatrix3, false, this.matrix.vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        console.log('fin');
        gl.flush();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        // this.render(gl, 0);
        requestAnimationFrame(() => this.render(gl, 0));
    }
    prepare2(gl: WebGL2RenderingContext, b: boolean) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer1.frameBuffer);

        // first
        gl.useProgram(this.prg1);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.attribute1);
        const img = this.uniform1.get('img');
        const flag = this.uniform1.get('flag');
        const mvpMatrix = this.uniform1.get('mvpMatrix');
        if (!img || !mvpMatrix || !flag) return;
        gl.uniform1i(img, 0);
        gl.uniform1f(flag, b ? 0 : 1);
        gl.uniformMatrix4fv(mvpMatrix, false, this.matrix.vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        // second

        for (let i = 0; i < 4; i++) {
            console.log('aa');
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer2.frameBuffer);
            gl.useProgram(this.prg2);
            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bindVertexArray(this.attribute2);
            const img1 = this.uniform2.get('img1');
            const img2 = this.uniform2.get('img2');
            const img3 = this.uniform2.get('img3');
            const img4 = this.uniform2.get('img4');

            const mvpMatrix2 = this.uniform2.get('mvpMatrix');
            if (!img1 || !img2 || !img3 || !img4 || !mvpMatrix2) return;
            gl.uniform1i(img1, 1);
            gl.uniform1i(img2, 2);
            gl.uniform1i(img3, 3);
            gl.uniform1i(img4, 4);
            gl.uniformMatrix4fv(mvpMatrix2, false, this.matrix.vpMat);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer1.frameBuffer);
            gl.useProgram(this.prg2);
            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bindVertexArray(this.attribute2);
            const img1a = this.uniform2.get('img1');
            const img2a = this.uniform2.get('img2');
            const img3a = this.uniform2.get('img3');
            const img4a = this.uniform2.get('img4');
            const mvpMatrix2a = this.uniform2.get('mvpMatrix');
            if (!img1a || !img2a || !mvpMatrix2a || !img3a || !img4a) return;
            gl.uniform1i(img1a, 5);
            gl.uniform1i(img2a, 6);
            gl.uniform1i(img3a, 7);
            gl.uniform1i(img4a, 8);
            gl.uniformMatrix4fv(mvpMatrix2a, false, this.matrix.vpMat);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
    }
    render(gl: WebGL2RenderingContext, step: number) {
        gl.useProgram(this.prg4);
        gl.clearColor(1, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(this.attribute4);
        const img = this.uniform4.get('img');
        const split = this.uniform4.get('split');
        const time = this.uniform4.get('time');
        const mvpMatrix3 = this.uniform4.get('mvpMatrix');

        if (!img || !split || !time || !mvpMatrix3) return;
        gl.uniform1i(img, 13);
        gl.uniform1f(split, 5);
        gl.uniform1f(time, step);
        gl.uniformMatrix4fv(mvpMatrix3, false, this.matrix.vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        console.log('end');
        requestAnimationFrame(() => this.render(gl, step + 1));
        gl.flush();
    }
    async createTextCanvas(gl: WebGL2RenderingContext) {
        await this.loadfont();

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const SIZE = 1024;
        const text = 'あいうえおabcdef12345漢字カタカナ';

        canvas.width = SIZE;
        canvas.height = SIZE;
        const fontSize = SIZE / Math.ceil(Math.sqrt(text.length));

        context.clearRect(0, 0, SIZE, SIZE);
        context.font = `normal ${fontSize * 1.1}px Notp Sans JP`;
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        text.split('').forEach((c, i) => {
            const x = (i % (SIZE / fontSize)) * fontSize + fontSize / 2;
            const y = Math.floor(i / (SIZE / fontSize)) * fontSize + fontSize * 0.9;
            context.fillText(c, x, y, fontSize);
        });

        const c = document.body.appendChild(canvas);
        c.style.backgroundColor = 'blue';

        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.texture = texture;
        console.log(texture);

        return canvas;
    }
    loadfont() {
        return new Promise((resolve) => {
            webfont.load({
                google: {
                    families: ['Noto+Sans+JP:700'],
                },
                active: () => resolve(null),
            });
        });
    }

    createShader(gl: WebGL2RenderingContext, vert: string, frag: string) {
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (!vs) return;
        gl.shaderSource(vs, vert);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vs));
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
        return {
            frag: fs,
            vert: vs,
        };
    }
    createProgram(gl: WebGL2RenderingContext, shader: Shader) {
        const prg = gl.createProgram();
        if (!prg) return;
        gl.attachShader(prg, shader.vert);
        gl.attachShader(prg, shader.frag);
        gl.linkProgram(prg);
        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prg));
            return;
        }
        return prg;
    }
    setUniformLocation<T extends LocationName | LocationName2 | LocationName4>(gl: WebGL2RenderingContext, prg: WebGLProgram, uniforms: T[]) {
        const locations = new Map<T, WebGLUniformLocation>();
        uniforms.forEach((key) => {
            const u = gl.getUniformLocation(prg, key);
            if (!u) return;
            locations.set(key, u);
        });
        console.log(locations);
        return locations;
    }
    createAttribute(gl: WebGL2RenderingContext) {
        const position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
        const texCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
        const index = [0, 2, 1, 2, 3, 1];

        const vao = gl.createVertexArray();
        if (!vao) return;

        gl.bindVertexArray(vao);
        this.setVAO(gl, position, 0, 3);
        this.setVAO(gl, texCoord, 1, 2);

        const ibo = gl.createBuffer();
        if (!ibo) return;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return vao;
    }
    create2ndAttribute(gl: WebGL2RenderingContext) {
        const position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
        const texCoord = [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0];
        const texCoord2 = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
        const index = [0, 2, 1, 2, 3, 1];

        const vao = gl.createVertexArray();
        if (!vao) return;

        gl.bindVertexArray(vao);
        this.setVAO(gl, position, 0, 3);
        this.setVAO(gl, texCoord, 1, 2);
        this.setVAO(gl, texCoord2, 2, 2);

        const ibo = gl.createBuffer();
        if (!ibo) return;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return vao;
    }
    create3rdAttribute(gl: WebGL2RenderingContext) {
        const position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
        const texCoord = [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0];
        const i = 9;
        const id = [i, i, i, i];
        const index = [0, 2, 1, 2, 3, 1];

        const vao = gl.createVertexArray();
        if (!vao) return;

        gl.bindVertexArray(vao);
        this.setVAO(gl, position, 0, 3);
        this.setVAO(gl, texCoord, 1, 2);
        this.setVAO(gl, id, 2, 1);

        const ibo = gl.createBuffer();
        if (!ibo) return;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return vao;
    }
    setVAO(gl: WebGL2RenderingContext, data: number[], location: number, length: number) {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, length, gl.FLOAT, false, 0, 0);
    }
    createVBO(gl: WebGL2RenderingContext, data: number[]) {
        const vbo = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    createIBO(gl: WebGL2RenderingContext, data: number[]) {
        const ibo = gl.createBuffer();
        if (!ibo) return;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
    createBuffer(gl: WebGL2RenderingContext, size: number) {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {
            frameBuffer,
            textures: [texture],
        };
    }
    createMRTBuffer(gl: WebGL2RenderingContext, size: number, count: number) {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) return;
        const textures: WebGLTexture[] = [];
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        for (let i = 0; i < count; i++) {
            const tex = gl.createTexture();
            if (!tex) return;
            textures[i] = tex;
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, textures[i], 0);
            console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));
            console.log(gl.FRAMEBUFFER_COMPLETE);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {
            frameBuffer,
            textures,
        };
    }
}

interface Shader {
    frag: WebGLShader;
    vert: WebGLShader;
}

type LocationName = 'mvpMatrix' | 'img' | 'flag';
type LocationName2 = 'mvpMatrix' | 'img1' | 'img2' | 'img3' | 'img4';
type LocationName4 = 'mvpMatrix' | 'img' | 'split' | 'time';

interface Matrix {
    vMat: mat4;
    pMat: mat4;
    vpMat: mat4;
}
interface frameBuffer {
    frameBuffer: WebGLFramebuffer;
    textures: WebGLTexture[];
}
window.onload = () => {
    const m = new Main();
    m.init();
};
