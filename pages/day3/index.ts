import { mat4 } from 'gl-matrix';
import fragment from './glsl/main.frag';
import vertex from './glsl/main.vert';
import { Sphere } from './models/sphere';
import { Torus } from './models/torus';

class main {
    private uniforms: {
        mMat: mat4;
        vMat: mat4;
        pMat: mat4;
        vpMat: mat4;
        mvpMat: mat4;
        normMat: mat4;
    } = {
        mMat: mat4.create(),
        vMat: mat4.create(),
        pMat: mat4.create(),
        vpMat: mat4.create(),
        mvpMat: mat4.create(),
        normMat: mat4.create(),
    };
    private uLocation: {
        mvpMatrix: WebGLUniformLocation;
        normMatrix: WebGLUniformLocation;
        lightDir: WebGLUniformLocation;
        ambLightColor: WebGLUniformLocation;
        cameraDir: WebGLUniformLocation;
        lightPos: WebGLUniformLocation;
        mMatrix: WebGLUniformLocation;
    };
    private index: number[] = [];
    constructor() {
        this.init();
    }
    init() {
        const WIDTH = window.innerWidth; // * window.devicePixelRatio;
        const HEIGHT = window.innerHeight; //* window.devicePixelRatio;
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

        const torus = new Torus(100, 100, 1, 2);
        console.log(torus);
        this.setAttribute(gl, prog, 'position', torus.pos, 3);
        this.setAttribute(gl, prog, 'color', torus.col, 4);
        this.setAttribute(gl, prog, 'normal', torus.normal, 3);
        this.index = torus.idx;
        const ibo = this.createIBO(gl, torus.idx);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        this.uLocation = {
            mvpMatrix: gl.getUniformLocation(
                prog,
                'mvpMatrix'
            ) as WebGLUniformLocation,
            normMatrix: gl.getUniformLocation(
                prog,
                'normMatrix'
            ) as WebGLUniformLocation,

            lightDir: gl.getUniformLocation(
                prog,
                'lightDir'
            ) as WebGLUniformLocation,
            ambLightColor: gl.getUniformLocation(
                prog,
                'ambLightColor'
            ) as WebGLUniformLocation,
            cameraDir: gl.getUniformLocation(
                prog,
                'cameraDir'
            ) as WebGLUniformLocation,
            lightPos: gl.getUniformLocation(
                prog,
                'lightPos'
            ) as WebGLUniformLocation,
            mMatrix: gl.getUniformLocation(
                prog,
                'mMatrix'
            ) as WebGLUniformLocation,
        };

        gl.uniform4fv(this.uLocation.ambLightColor, [0.1, 0.1, 0.1, 1]);
        gl.uniform3fv(this.uLocation.lightDir, [-0.5, 0.2, 0.5]);
        gl.uniform3fv(this.uLocation.cameraDir, [0, 10, 20]);
        gl.uniform3fv(this.uLocation.lightPos, [0, 0, 3]);

        mat4.lookAt(this.uniforms.vMat, [0, 1, 3], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(
            this.uniforms.pMat,
            Math.PI / 2,
            WIDTH / HEIGHT,
            0.1,
            100
        );
        mat4.multiply(
            this.uniforms.vpMat,
            this.uniforms.pMat,
            this.uniforms.vMat
        );

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.loop(gl, 0);
    }
    render(gl: WebGLRenderingContext, counter: number) {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const rad = ((counter % 360) * Math.PI) / 180;

        mat4.identity(this.uniforms.mMat);
        mat4.translate(this.uniforms.mMat, this.uniforms.mMat, [0, 0, -3]);
        mat4.rotate(this.uniforms.mMat, this.uniforms.mMat, rad, [0, 1, 1]);
        mat4.multiply(
            this.uniforms.mvpMat,
            this.uniforms.vpMat,
            this.uniforms.mMat
        );
        gl.uniformMatrix4fv(
            this.uLocation.mvpMatrix,
            false,
            this.uniforms.mvpMat
        );
        gl.uniformMatrix4fv(this.uLocation.mMatrix, false, this.uniforms.mMat);

        mat4.invert(this.uniforms.normMat, this.uniforms.mMat);
        gl.uniformMatrix4fv(
            this.uLocation.normMatrix,
            false,
            this.uniforms.normMat
        );

        gl.drawElements(gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);

        gl.flush();
    }
    loop(gl: WebGLRenderingContext, counter: number) {
        counter++;
        this.render(gl, counter);
        setTimeout(() => this.loop(gl, counter), 1000 / 60);
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
    createIBO(gl: WebGLRenderingContext, data: number[]) {
        const ibo = gl.createBuffer() as WebGLBuffer;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Int16Array(data),
            gl.STATIC_DRAW
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }
    setAttribute(
        gl: WebGLRenderingContext,
        prog: WebGLProgram,
        name: string,
        data: number[],
        dim: number
    ) {
        const aValue = gl.getAttribLocation(prog, name);
        const colorVbo = this.createVBO(gl, data);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
        gl.enableVertexAttribArray(aValue);
        gl.vertexAttribPointer(aValue, dim, gl.FLOAT, false, 0, 0);
    }
}

window.onload = () => {
    new main();
};
