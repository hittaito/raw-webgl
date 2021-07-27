import { mat4 } from 'gl-matrix';
import fFrag from './glsl/first.frag';
import fVert from './glsl/first.vert';
import sFrag from './glsl/second.frag';
import sVert from './glsl/second.vert';

class Main {
    img: Image;
    matrix: Matrix;
    tfPrg: WebGLProgram;
    prg: WebGLProgram;
    attributes: Attributes[];
    uniforms: Uniforms;

    constructor() {}
    init() {
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;

        this.loadImg('/assets/lenna.jpg').then(() => this.setUp(gl));
    }
    setUp(gl: WebGL2RenderingContext) {
        const tf = gl.createTransformFeedback();
        if (!tf) return;
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

        const varyings = ['vPosition', 'vVelocity', 'vColor'];
        const tfShader = this.createShader(gl, fVert, fFrag);
        if (!tfShader) return;
        console.log('test');
        const tfPrg = this.createTFProgram(gl, tfShader, varyings);
        if (!tfPrg) return;
        this.tfPrg = tfPrg;
        const u1 = gl.getUniformLocation(tfPrg, 'time');
        if (!u1) return;
        const u2 = gl.getUniformLocation(tfPrg, 'mouse');
        if (!u2) return;
        const u3 = gl.getUniformLocation(tfPrg, 'move');
        if (!u3) return;
        const shader = this.createShader(gl, sVert, sFrag);
        if (!shader) return;
        const prg = this.createProgram(gl, shader);
        if (!prg) return;
        this.prg = prg;
        const u4 = gl.getUniformLocation(prg, 'vpMatrix');
        if (!u4) return;
        const u5 = gl.getUniformLocation(prg, 'move');
        if (!u5) return;
        // uniform 設定
        console.log('te');
        this.uniforms = {
            time: u1,
            mouse: u2,
            move: u3,
            vpMatrix: u4,
            move2: u5,
        };

        this.attributes = this.createAttribute(gl, this.img);
        this.matrix = {
            vMat: mat4.create(),
            pMat: mat4.create(),
            vpMat: mat4.create(),
        };
        mat4.lookAt(this.matrix.vMat, [0, 0, 2], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(
            this.matrix.pMat,
            Math.PI / 3,
            window.innerWidth / window.innerHeight,
            0.01,
            1000
        );
        mat4.mul(this.matrix.vpMat, this.matrix.pMat, this.matrix.vMat);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        gl.disable(gl.RASTERIZER_DISCARD);

        console.log('end');

        this.render(gl, true);
    }
    async loadImg(url: string) {
        const img = new Image();
        img.src = url;
        return new Promise((resolve) => {
            img.onload = () => {
                console.log('img load');
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = 256;
                c.height = 256;
                ctx?.drawImage(img, 0, 0, c.width, c.height);
                const data = ctx?.getImageData(0, 0, img.width, img.height);
                if (!data) return;

                console.log(img.height);
                this.img = {
                    width: img.width,
                    height: img.height,
                    data: data,
                };
                resolve(null);
            };
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
    createTFProgram(
        gl: WebGL2RenderingContext,
        shader: Shader,
        varyings: string[]
    ) {
        const prg = gl.createProgram();
        if (!prg) return;
        gl.attachShader(prg, shader.vert);
        gl.attachShader(prg, shader.frag);
        gl.transformFeedbackVaryings(prg, varyings, gl.SEPARATE_ATTRIBS);
        gl.linkProgram(prg);
        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prg));
            return;
        }
        return prg;
    }
    createAttribute(gl: WebGL2RenderingContext, img: Image): Attributes[] {
        const position = [];
        const velocity = [];
        const color = [];

        for (let i = 0; i < img.height; ++i) {
            let y = (i / img.height) * 2 - 1;
            let k = i * img.width;

            for (let j = 0; j < img.width; ++j) {
                let x = (j / img.width) * 2 - 1;
                let l = (k + j) * 4;
                let m = Math.sqrt(x * x + y * y);

                position.push(x, -y, 0);
                velocity.push(x / m, -y / m, 0);
                color.push(
                    img.data.data[l] / 255,
                    img.data.data[l + 1] / 255,
                    img.data.data[l + 2] / 255,
                    img.data.data[l + 3] / 255
                );
            }
        }
        console.log(position);
        return [
            {
                position: {
                    location: 0,
                    length: 3,
                    buffer: this.createVBO(gl, position),
                },
                velocity: {
                    location: 1,
                    length: 3,
                    buffer: this.createVBO(gl, velocity),
                },
                color: {
                    location: 2,
                    length: 4,
                    buffer: this.createVBO(gl, color),
                },
            },
            {
                position: {
                    location: 0,
                    length: 3,
                    buffer: this.createVBO(gl, position),
                },
                velocity: {
                    location: 1,
                    length: 3,
                    buffer: this.createVBO(gl, velocity),
                },
                color: {
                    location: 2,
                    length: 4,
                    buffer: this.createVBO(gl, color),
                },
            },
        ];
    }
    createVBO(gl: WebGL2RenderingContext, data: number[]) {
        const vbo = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    setAttribute(gl: WebGL2RenderingContext, attrs: Attributes) {
        (Object.keys(attrs) as Attr[]).forEach((key: Attr) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, attrs[key].buffer);
            gl.enableVertexAttribArray(attrs[key].location);
            gl.vertexAttribPointer(
                attrs[key].location,
                attrs[key].length,
                gl.FLOAT,
                false,
                0,
                0
            );
        });
    }
    render(gl: WebGL2RenderingContext, flag: boolean) {
        console.log('render');
        gl.useProgram(this.tfPrg);

        const idx = flag ? 0 : 1;
        this.setAttribute(gl, this.attributes[idx]);
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            0,
            this.attributes[1 - idx].position.buffer
        );
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            1,
            this.attributes[1 - idx].velocity.buffer
        );
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            2,
            this.attributes[1 - idx].color.buffer
        );
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);

        gl.uniform1f(this.uniforms.time, 100);
        gl.uniform2fv(this.uniforms.mouse, [0.0, 0]);
        gl.uniform1f(this.uniforms.move, 0.1);
        gl.drawArrays(gl.POINTS, 0, this.img.width * this.img.height);

        gl.disable(gl.RASTERIZER_DISCARD);
        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);

        gl.useProgram(this.prg);
        this.setAttribute(gl, this.attributes[1 - idx]);
        gl.uniformMatrix4fv(this.uniforms.vpMatrix, false, this.matrix.vpMat);
        gl.uniform1f(this.uniforms.move2, 0);
        gl.drawArrays(gl.POINTS, 0, this.img.width * this.img.height);
        gl.flush();
        requestAnimationFrame(() => this.render(gl, !flag));
    }
}
interface Image {
    width: number;
    height: number;
    data: ImageData;
}
interface Shader {
    frag: WebGLShader;
    vert: WebGLShader;
}
interface Attribute {
    location: number;
    length: number;
    buffer: WebGLBuffer;
}
type Attr = 'position' | 'velocity' | 'color';
type Attributes = {
    [key in Attr]: Attribute;
};
interface Uniforms {
    time: WebGLUniformLocation;
    mouse: WebGLUniformLocation;
    move: WebGLUniformLocation;
    vpMatrix: WebGLUniformLocation;
    move2: WebGLUniformLocation;
}
interface Matrix {
    vMat: mat4;
    pMat: mat4;
    vpMat: mat4;
}
window.onload = () => {
    const m = new Main();
    m.init();
};
