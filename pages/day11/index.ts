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
    img: HTMLImageElement;
    // first
    prg1: WebGLProgram;

    matrix: Matrix;
    texture: WebGLTexture;

    // final draw
    prg2: WebGLProgram;

    state: State;

    index: WebGLBuffer;
    position: WebGLBuffer;
    texCoord: WebGLBuffer;

    constructor() {}
    init() {
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 1024 * dpr;
        canvas.height = 1024 * dpr;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;
        gl.getExtension('EXT_color_buffer_float');
        this.loadImg('/assets/noise.png').then(() => this.setUp(gl, canvas));
    }
    setUp(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
        const shader = this.createShader(gl, fVert, fFrag);
        if (!shader) return;

        const varyings = ['vPosition', 'vAge', 'vLife', 'vVelocity'];
        const prg = this.createProgram(gl, shader, varyings);
        if (!prg) return;
        this.prg1 = prg;

        const shader2 = this.createShader(gl, sVert, sFrag);
        if (!shader2) return;
        const prg2 = this.createProgram(gl, shader2, null);
        if (!prg2) return;
        this.prg2 = prg2;

        const d = this.createAttribute(gl);
        if (!d) return;
        const force_field_texture = gl.createTexture();
        if (!force_field_texture) return;
        gl.bindTexture(gl.TEXTURE_2D, force_field_texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB8,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            this.img
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const texture = this.createBuffer(gl, 512, this.randRGData(512, 512));
        if (!texture) return;

        this.state = {
            particle_sys_buffers: d[0],
            particle_sys_vaos: d[1],
            read: 0,
            write: 1,
            num_particles: 10000,
            old_timestamp: 0.0,
            rg_noise: texture.textures[0],
            force: force_field_texture,
            total_time: 0.0,
            born_particles: 0.0,
            birth_rate: 0.5,
            gravity: [0, -0.4],
            origin: [0.0, 0.0],
            min_theta: Math.PI / 2 - 0.5,
            max_theta: Math.PI / 2 + 0.5,
            min_speed: 0.5,
            max_speed: 1,
        };
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.render(gl, 0);
        console.log(this.state);

        canvas.onmousemove = (e) => {
            console.log(e);
            const x = (4.0 * e.pageX) / canvas.width - 1.0;
            const y = -((4.0 * e.pageY) / canvas.height - 1.0);
            console.log([x, y]);
            this.state.origin = [x, y];
        };
    }

    render(gl: WebGL2RenderingContext, time: number) {
        const nParticle = this.state.born_particles;
        let dTime = 0;
        if (this.state.old_timestamp !== 0) {
            dTime = time - this.state.old_timestamp;
            if (dTime > 500) {
                dTime = 0;
            }
        }

        if (this.state.born_particles < this.state.num_particles) {
            this.state.born_particles = Math.min(
                this.state.num_particles,
                Math.floor(
                    this.state.born_particles + this.state.birth_rate * dTime
                )
            );
        }
        this.state.old_timestamp = time;
        gl.useProgram(this.prg1);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //   gl.bindVertexArray(state.particle_sys_vaos[state.read]);

        gl.uniform1f(gl.getUniformLocation(this.prg1, 'dTime'), dTime / 1000);
        gl.uniform2f(
            gl.getUniformLocation(this.prg1, 'gravity'),
            this.state.gravity[0],
            this.state.gravity[1]
        );
        gl.uniform2f(
            gl.getUniformLocation(this.prg1, 'origin'),
            this.state.origin[0],
            this.state.origin[1]
        );
        gl.uniform1f(
            gl.getUniformLocation(this.prg1, 'minTheta'),
            this.state.min_theta
        );
        gl.uniform1f(
            gl.getUniformLocation(this.prg1, 'maxTheta'),
            this.state.max_theta
        );
        gl.uniform1f(
            gl.getUniformLocation(this.prg1, 'minSpeed'),
            this.state.min_speed
        );
        gl.uniform1f(
            gl.getUniformLocation(this.prg1, 'maxSpeed'),
            this.state.max_speed
        );
        this.state.total_time += dTime;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.state.rg_noise);
        gl.uniform1i(gl.getUniformLocation(this.prg1, 'noise'), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.state.force);
        gl.uniform1i(gl.getUniformLocation(this.prg1, 'force'), 1);

        gl.bindVertexArray(this.state.particle_sys_vaos[this.state.read]);

        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            0,
            this.state.particle_sys_buffers[this.state.write]
        );
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, nParticle);
        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        gl.bindVertexArray(this.state.particle_sys_vaos[this.state.read + 2]);
        gl.useProgram(this.prg2);
        gl.drawArrays(gl.POINTS, 0, nParticle);

        this.state.read = 1 - this.state.read;
        this.state.write = 1 - this.state.write;

        requestAnimationFrame((t) => this.render(gl, t));
        gl.flush();
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
                this.img = img;
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
    createProgram(
        gl: WebGL2RenderingContext,
        shader: Shader,
        varyings: string[] | null
    ) {
        const prg = gl.createProgram();
        if (!prg) return;
        gl.attachShader(prg, shader.vert);
        gl.attachShader(prg, shader.frag);
        if (varyings) {
            gl.transformFeedbackVaryings(prg, varyings, gl.INTERLEAVED_ATTRIBS);
        }
        gl.linkProgram(prg);
        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prg));
            return;
        }
        return prg;
    }
    randRGData(x: number, y: number) {
        const d = [];
        for (let i = 0; i < x * y; ++i) {
            d.push(Math.random() * 255);
            d.push(Math.random() * 255);
        }
        return new Uint8Array(d);
    }
    initParticle(num: number, minAge: number, maxAge: number) {
        const data = [];
        for (let i = 0; i < num; ++i) {
            // position
            data.push(0);
            data.push(0);

            const life = minAge + Math.random() * (maxAge - minAge);
            data.push(life + 1);
            data.push(life);

            // velocity
            data.push(0);
            data.push(0);
        }
        return data;
    }
    setUniformLocation<T extends LocationName | LocationName2 | LocationName4>(
        gl: WebGL2RenderingContext,
        prg: WebGLProgram,
        uniforms: T[]
    ) {
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
        const update_attrib_locations = {
            position: {
                location: gl.getAttribLocation(this.prg1, 'position'),
                numcomponents: 2,
            },
            age: {
                location: gl.getAttribLocation(this.prg1, 'age'),
                numcomponents: 1,
            },
            life: {
                location: gl.getAttribLocation(this.prg1, 'life'),
                numcomponents: 1,
            },
            velocity: {
                location: gl.getAttribLocation(this.prg1, 'velocity'),
                numcomponents: 2,
            },
        };
        const render_attrib_locations = {
            position: {
                location: gl.getAttribLocation(this.prg2, 'position'),
                numcomponents: 2,
            },
            age: {
                location: gl.getAttribLocation(this.prg2, 'age'),
                numcomponents: 1,
            },
            life: {
                location: gl.getAttribLocation(this.prg2, 'life'),
                numcomponents: 1,
            },
        };
        const buffer1 = gl.createBuffer();
        const buffer2 = gl.createBuffer();
        if (!buffer1 || !buffer2) return;

        const vao1 = gl.createVertexArray();
        const vao2 = gl.createVertexArray();
        const vao3 = gl.createVertexArray();
        const vao4 = gl.createVertexArray();
        if (!vao1 || !vao2 || !vao3 || !vao4) return;

        const init = new Float32Array(this.initParticle(10000, 1.01, 1.05));
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
        gl.bufferData(gl.ARRAY_BUFFER, init, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
        gl.bufferData(gl.ARRAY_BUFFER, init, gl.STREAM_DRAW);

        const vaos = [
            {
                vao: vao1,
                buffers: [
                    {
                        object: buffer1,
                        stride: 4 * 6,
                        attribs: update_attrib_locations,
                    },
                ],
            },
            {
                vao: vao2,
                buffers: [
                    {
                        object: buffer2,
                        stride: 4 * 6,
                        attribs: update_attrib_locations,
                    },
                ],
            },
            {
                vao: vao3,
                buffers: [
                    {
                        object: buffer1,
                        stride: 4 * 6,
                        attribs: render_attrib_locations,
                    },
                ],
            },
            {
                vao: vao4,
                buffers: [
                    {
                        object: buffer2,
                        stride: 4 * 6,
                        attribs: render_attrib_locations,
                    },
                ],
            },
        ];
        vaos.forEach((v) => {
            this.setVAO2(gl, v.buffers, v.vao);
        });
        return [
            [buffer1, buffer2],
            [vao1, vao2, vao3, vao4],
        ];
    }
    setVAO2(
        gl: WebGL2RenderingContext,
        buffers: Buffer[],
        vao: WebGLVertexArrayObject
    ) {
        gl.bindVertexArray(vao);
        for (let i = 0; i < buffers.length; i++) {
            const buffer = buffers[i];
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.object);
            let offset = 0;
            for (var attrib_name in buffer.attribs) {
                if (buffer.attribs.hasOwnProperty(attrib_name)) {
                    const attrib_desc = buffer.attribs[attrib_name];

                    gl.enableVertexAttribArray(attrib_desc.location);
                    gl.vertexAttribPointer(
                        attrib_desc.location,
                        attrib_desc.numcomponents,
                        gl.FLOAT,
                        false,
                        buffer.stride,
                        offset
                    );
                    var type_size = 4;
                    offset += attrib_desc.numcomponents * type_size;

                    // if (attrib_desc.hasOwnProperty('divisor')) {
                    //     gl.vertexAttribDivisor(
                    //         attrib_desc.location,
                    //         attrib_desc.divisor
                    //     );
                    //}
                }
            }
        }
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
    createBuffer(
        gl: WebGL2RenderingContext,
        size: number,
        data: ArrayBufferView
    ) {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RG8,
            size,
            size,
            0,
            gl.RG,
            gl.UNSIGNED_BYTE,
            data
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {
            frameBuffer,
            textures: [texture],
        };
    }
}

interface Shader {
    frag: WebGLShader;
    vert: WebGLShader;
}

type LocationName =
    | 'dTime'
    | 'noise'
    | 'gravity'
    | 'origin'
    | 'minTheta'
    | 'maxTheta'
    | 'minSpeed'
    | 'maxSpeed';
type LocationName2 = 'mvpMatrix' | 'img1' | 'img2' | 'img0';
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

interface Buffer {
    object: WebGLBuffer;
    stride: number;
    attribs: {
        [key: string]: {
            location: number;
            numcomponents: number;
        };
    };
}
interface Image {
    width: number;
    height: number;
    data: ImageData;
}
interface State {
    particle_sys_buffers: WebGLBuffer[];
    particle_sys_vaos: WebGLVertexArrayObject[];
    read: number;
    write: number;
    num_particles: number;
    old_timestamp: number;
    rg_noise: WebGLTexture;
    force: WebGLTexture;
    total_time: number;
    born_particles: number;
    birth_rate: number;
    gravity: number[];
    origin: number[];
    min_theta: number;
    max_theta: number;
    min_speed: number;
    max_speed: number;
}
window.onload = () => {
    const m = new Main();
    m.init();
};
