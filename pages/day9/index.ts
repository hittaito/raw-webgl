import { mat4 } from 'gl-matrix';
import * as webfont from 'webfontloader';
import fFrag from './glsl/first.frag';
import fVert from './glsl/first.vert';
import sFrag from './glsl/second.frag';
import sVert from './glsl/second.vert';

class Main {
    prg1: WebGLProgram;
    uniform1: Map<LocationName, WebGLUniformLocation>;
    attribute1: WebGLVertexArrayObject;
    matrix: Matrix;
    texture: WebGLTexture;

    index: WebGLBuffer;
    position: WebGLBuffer;
    texCoord: WebGLBuffer;

    constructor() {}
    init() {
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 512 * dpr;
        canvas.height = 512 * dpr;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;

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

        this.uniform1 = this.setUniformLocation(gl, prg, ['mvpMatrix', 'img']);
        console.log(this.uniform1);
        const vao = this.createAttribute(gl);
        if (!vao) return;
        this.attribute1 = vao;

        this.matrix = {
            vMat: mat4.create(),
            pMat: mat4.create(),
            vpMat: mat4.create(),
        };
        mat4.lookAt(this.matrix.vMat, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(this.matrix.pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(this.matrix.vpMat, this.matrix.pMat, this.matrix.vMat);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        this.render(gl);
    }
    render(gl: WebGL2RenderingContext) {
        gl.useProgram(this.prg1);

        gl.clearColor(0.2, 0.2, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.attribute1);
        const img = this.uniform1.get('img');
        const mvpMatrix = this.uniform1.get('mvpMatrix');
        if (!img || !mvpMatrix) return;
        gl.uniform1i(img, 0);
        gl.uniformMatrix4fv(mvpMatrix, false, this.matrix.vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.flush();
        requestAnimationFrame(() => this.render(gl));
    }
    async createTextCanvas(gl: WebGL2RenderingContext) {
        await this.loadfont();

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const SIZE = 512;
        const text = 'あいうえおabcdef12345漢字カタカナ';

        canvas.width = SIZE;
        canvas.height = SIZE;
        const fontSize = SIZE / Math.ceil(Math.sqrt(text.length));

        context.clearRect(0, 0, SIZE, SIZE);
        context.font = `normal ${fontSize}px Notp Sans JP`;
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        text.split('').forEach((c, i) => {
            const x = (i % (SIZE / fontSize)) * fontSize + fontSize / 2;
            const y =
                Math.floor(i / (SIZE / fontSize)) * fontSize + fontSize * 0.8;
            context.fillText(c, x, y, fontSize);
        });

        const c = document.body.appendChild(canvas);
        c.style.backgroundColor = 'blue';

        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            canvas
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_NEAREST
        );
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
    setUniformLocation(
        gl: WebGL2RenderingContext,
        prg: WebGLProgram,
        uniforms: LocationName[]
    ) {
        const locations = new Map<LocationName, WebGLUniformLocation>();
        uniforms.forEach((key) => {
            const u = gl.getUniformLocation(prg, key);
            if (!u) return;
            locations.set(key, u);
        });
        return locations;
    }
    createAttribute(gl: WebGL2RenderingContext) {
        const position = [
            -1.0,
            1.0,
            0.0,
            1.0,
            1.0,
            0.0,
            -1.0,
            -1.0,
            0.0,
            1.0,
            -1.0,
            0.0,
        ];
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
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Int16Array(index),
            gl.STATIC_DRAW
        );

        gl.bindVertexArray(null);

        return vao;
    }
    setVAO(
        gl: WebGL2RenderingContext,
        data: number[],
        location: number,
        length: number
    ) {
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
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Int16Array(data),
            gl.STATIC_DRAW
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
}

interface Shader {
    frag: WebGLShader;
    vert: WebGLShader;
}

type LocationName = 'mvpMatrix' | 'img';

interface Matrix {
    vMat: mat4;
    pMat: mat4;
    vpMat: mat4;
}
window.onload = () => {
    const m = new Main();
    m.init();
};
