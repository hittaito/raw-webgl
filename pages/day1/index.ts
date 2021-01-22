import { mat4 } from 'gl-matrix';
import fragment from './glsl/main.frag';
import vertex from './glsl/main.vert';

class main {
    constructor() {
        this.init();
    }
    init() {
        const WIDTH = window.innerWidth * window.devicePixelRatio;
        const HEIGHT = window.innerHeight * window.devicePixelRatio;
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const gl = canvas.getContext('webgl') as WebGLRenderingContext;

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const shader = this.compile(gl);
        if (!shader) {
            return;
        }
        const prog = this.createProgram(gl, shader.vert, shader.frag);
        if (!prog) {
            return;
        }

        const aLocation = gl.getAttribLocation(prog, 'position');
        const position = [0, 2, 0, 1, 0, 0, -1, 0, 0];
        const vbo = this.createVBO(gl, position);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(aLocation);
        gl.vertexAttribPointer(aLocation, 3, gl.FLOAT, false, 0, 0);

        const mMat = mat4.create();
        const vMat = mat4.create();
        const pMat = mat4.create();
        const mvpMat = mat4.create();

        mat4.lookAt(vMat, [0, 1, 3], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(pMat, Math.PI / 2, WIDTH / HEIGHT, 0.1, 100);

        mat4.multiply(mvpMat, pMat, vMat);
        mat4.multiply(mvpMat, mvpMat, mMat);
        console.log(mvpMat);

        const uLocation = gl.getUniformLocation(prog, 'mvpMatrix');
        gl.uniformMatrix4fv(uLocation, false, mvpMat);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.canvas;
        gl.flush();
    }
    compile(gl: WebGLRenderingContext) {
        const vs = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
        gl.shaderSource(vs, vertex);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error('compile vert fail');
            console.log(gl.getShaderInfoLog(vs));
            return;
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
        gl.shaderSource(fs, fragment);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error('compile frag fail');
            console.log(gl.getShaderInfoLog(fs));
            return;
        }
        return {
            vert: vs,
            frag: fs,
        };
    }
    createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
        const prog = gl.createProgram() as WebGLProgram;

        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);

        gl.linkProgram(prog);

        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            gl.useProgram(prog);
            return prog;
        } else {
            console.error(gl.getProgramInfoLog(prog));
        }
    }
    createVBO(gl: WebGLRenderingContext, data: number[]) {
        const vbo = gl.createBuffer() as WebGLBuffer;

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
}

window.onload = () => {
    new main();
};
