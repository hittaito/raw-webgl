import { mat4, ReadonlyVec3, ReadonlyVec4, vec3 } from 'gl-matrix';
import mFragment from './glsl/main.frag';
import mVertex from './glsl/main.vert';
import dVertex from './glsl/depth.vert';
import dFragment from './glsl/depth.frag';
import { Torus } from './models/torus';
import * as quat from './math/quat';
import * as images from '../assets/*.jpg';
import { Plane } from './models/plane';

type vbo = {
    position: WebGLBuffer;
    color: WebGLBuffer;
    normal: WebGLBuffer;
    index: WebGLBuffer;
    rawIndex: number[];
};
type aloc = {
    len: number;
    loc: number;
};

class main {
    private uniforms: {
        mMat: mat4;
        vMat: mat4;
        pMat: mat4;
        vpMat: mat4;
        mvpMat: mat4;
        normMat: mat4;
        tMatrix: mat4;
        lmMat: mat4;
        lvMat: mat4;
        lpMat: mat4;
        lvpMat: mat4;
        lmvpMat: mat4;
        lightPos: vec3;
    } = {
        mMat: mat4.create(),
        vMat: mat4.create(),
        pMat: mat4.create(),
        vpMat: mat4.create(),
        mvpMat: mat4.create(),
        normMat: mat4.create(),
        tMatrix: mat4.create(),
        lmMat: mat4.create(),
        lvMat: mat4.create(),
        lpMat: mat4.create(),
        lvpMat: mat4.create(),
        lmvpMat: mat4.create(),
        lightPos: [0, 1, 0],
    };
    private mProg: {
        prog: WebGLProgram;
        uni: {
            mvpMatrix: WebGLUniformLocation;
            mMatrix: WebGLUniformLocation;
            tMatrix: WebGLUniformLocation;
            lightMatrix: WebGLUniformLocation;
            texture: WebGLUniformLocation;
            lightPos: WebGLUniformLocation;
            invMatrix: WebGLUniformLocation;
        };
        attr: {
            position: {
                len: number;
                loc: number;
            };
            color: {
                len: number;
                loc: number;
            };
            normal: {
                len: number;
                loc: number;
            };
        };
    };
    private dProg: {
        prog: WebGLProgram;
        uni: {
            mvpMatrix: WebGLUniformLocation;
        };
        attr: {
            position: {
                len: number;
                loc: number;
            };
        };
    };

    private torusVBO: vbo;
    private planeVBO: vbo;

    private camera: {
        position: vec3;
        upDir: vec3;
        quat: quat.quat;
    };
    private light: {
        position: vec3;
        upDir: vec3;
        quat: quat.quat;
    };
    private texGroup: { [key: string]: WebGLTexture } = {};

    private buff: {
        f: WebGLFramebuffer;
        d: WebGLRenderbuffer;
        t: WebGLTexture;
    };

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

        // MAIN SHADER
        const mShader = this.compile(gl, mVertex, mFragment);
        if (!mShader) {
            return;
        }
        const mProg = this.createProgram(gl, mShader.vert, mShader.frag);
        if (!mProg) {
            return;
        }
        this.mProg = {
            prog: mProg,
            uni: {
                mvpMatrix: gl.getUniformLocation(
                    mProg,
                    'mvpMatrix'
                ) as WebGLUniformLocation,
                invMatrix: gl.getUniformLocation(
                    mProg,
                    'invMatrix'
                ) as WebGLUniformLocation,
                mMatrix: gl.getUniformLocation(
                    mProg,
                    'mMatrix'
                ) as WebGLUniformLocation,
                lightMatrix: gl.getUniformLocation(
                    mProg,
                    'lightMatrix'
                ) as WebGLUniformLocation,
                texture: gl.getUniformLocation(
                    mProg,
                    'texture'
                ) as WebGLUniformLocation,
                lightPos: gl.getUniformLocation(
                    mProg,
                    'lightPos'
                ) as WebGLUniformLocation,
                tMatrix: gl.getUniformLocation(
                    mProg,
                    'tMatrix'
                ) as WebGLUniformLocation,
            },
            attr: {
                position: {
                    len: 3,
                    loc: gl.getAttribLocation(mProg, 'position'),
                },
                color: { len: 4, loc: gl.getAttribLocation(mProg, 'color') },
                normal: { len: 3, loc: gl.getAttribLocation(mProg, 'normal') },
            },
        };

        // DEPTH SHADER
        const dShader = this.compile(gl, dVertex, dFragment);
        if (!dShader) return;
        const dProg = this.createProgram(gl, dShader.vert, dShader.frag);
        if (!dProg) return;

        this.dProg = {
            prog: dProg,
            uni: {
                mvpMatrix: gl.getUniformLocation(
                    dProg,
                    'mvpMatrix'
                ) as WebGLUniformLocation,
            },
            attr: {
                position: {
                    len: 3,
                    loc: gl.getAttribLocation(dProg, 'position'),
                },
            },
        };

        // Bind buffer
        const torus = new Torus(80, 100, 1, 2);
        this.torusVBO = {
            position: this.createVBO(gl, torus.pos),
            color: this.createVBO(gl, torus.col),
            normal: this.createVBO(gl, torus.normal),
            index: this.createIBO(gl, torus.idx),
            rawIndex: torus.idx,
        };

        const plane = new Plane();
        this.planeVBO = {
            position: this.createVBO(gl, plane.pos),
            color: this.createVBO(gl, plane.col),
            normal: this.createVBO(gl, plane.normal),
            index: this.createIBO(gl, plane.idx),
            rawIndex: plane.idx,
        };

        // this.createTexture(gl, 'posy');
        this.camera = {
            position: [0, 70, 30],
            upDir: [0, 1, 0],
            quat: quat.identity(quat.create()),
        };
        this.light = {
            position: [0, 1, 0],
            upDir: [0, 0, -1],
            quat: quat.identity(quat.create()),
        };

        this.uniforms.tMatrix = [
            0.5,
            0,
            0,
            0,
            0,
            0.5,
            0,
            0,
            0,
            0,
            1,
            0,
            0.5,
            0.5,
            0,
            1,
        ];
        const b = this.createFrameBuffer(gl, innerWidth, innerHeight);
        if (!b) return;
        this.buff = b;
        console.log(b);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        this.loop(gl, 0);
    }
    render(gl: WebGLRenderingContext, counter: number) {
        // vpMatrix
        quat.rotate((Math.PI / 180) * 20, [0, 0, 1], this.camera.quat);
        quat.toVecIII([0, 70, 0], this.camera.quat, this.camera.position);
        quat.toVecIII([0, 0, -1], this.camera.quat, this.camera.upDir);
        mat4.lookAt(
            this.uniforms.vMat,
            this.camera.position,
            [0, 0, 0],
            this.camera.upDir
        );
        mat4.perspective(
            this.uniforms.pMat,
            Math.PI / 4,
            window.innerWidth / window.innerHeight,
            0.1,
            150
        );
        mat4.multiply(
            this.uniforms.vpMat,
            this.uniforms.pMat,
            this.uniforms.vMat
        );

        // light
        this.light.position = [0, 20, 0];
        this.uniforms.tMatrix = [
            0.5,
            0,
            0,
            0,
            0,
            0.5,
            0,
            0,
            0,
            0,
            1,
            0,
            0.5,
            0.5,
            0,
            1,
        ];

        mat4.lookAt(
            this.uniforms.lvMat,
            this.light.position,
            [0, -10, 0],
            this.light.upDir
        );
        mat4.perspective(this.uniforms.lpMat, Math.PI / 2, 1, 0.1, 150);
        mat4.multiply(
            this.uniforms.lvpMat,
            this.uniforms.tMatrix,
            this.uniforms.lpMat
        );
        mat4.multiply(
            this.uniforms.tMatrix,
            this.uniforms.lvpMat,
            this.uniforms.lvMat
        );
        // vpMatrix
        mat4.multiply(
            this.uniforms.lvpMat,
            this.uniforms.lpMat,
            this.uniforms.lvMat
        );

        // depth shader
        gl.useProgram(this.dProg.prog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buff.f);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.setAttr(gl, this.dProg.attr, this.torusVBO);
        [...new Array(1)].forEach((_, i) => {
            const rad1 = ((counter + i * 36) * Math.PI) / 180;
            const rad2 = ((((i % 5) * 72) % 360) * Math.PI) / 180;
            const tVal = -Math.floor(i / 5) + 1;

            mat4.identity(this.uniforms.mMat);
            /* mat4.rotate(this.uniforms.mMat, this.uniforms.mMat, rad2, [
                0,
                1,
                0,
            ]);
            mat4.translate(this.uniforms.mMat, this.uniforms.mMat, [
                0,
                tVal * 10 + 10,
                (tVal - 2) * 7,
            ]);
            mat4.rotate(this.uniforms.mMat, this.uniforms.mMat, rad1, [
                1,
                1,
                1,
            ]);*/
            mat4.multiply(
                this.uniforms.lmvpMat,
                this.uniforms.lvpMat,
                this.uniforms.mMat
            );
            gl.uniformMatrix4fv(
                this.dProg.uni.mvpMatrix,
                false,
                this.uniforms.lmvpMat
            );
            gl.drawElements(
                gl.TRIANGLES,
                this.torusVBO.rawIndex.length,
                gl.UNSIGNED_SHORT,
                0
            );
        });

        // plane
        this.setAttr(gl, this.dProg.attr, this.planeVBO);
        mat4.identity(this.uniforms.mMat);
        mat4.translate(this.uniforms.mMat, this.uniforms.mMat, [10, -10, 0]);
        mat4.scale(this.uniforms.mMat, this.uniforms.mMat, [30, 0, 30]);
        mat4.multiply(
            this.uniforms.lmvpMat,
            this.uniforms.lvpMat,
            this.uniforms.mMat
        );
        gl.uniformMatrix4fv(
            this.dProg.uni.mvpMatrix,
            false,
            this.uniforms.lmvpMat
        );
        gl.drawElements(
            gl.TRIANGLES,
            this.planeVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );

        // main shader

        gl.useProgram(this.mProg.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.buff.t);

        gl.clearColor(0, 0.7, 0.7, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.setAttr(gl, this.mProg.attr, this.torusVBO);
        [...new Array(1)].forEach((_, i) => {
            const rad1 = ((counter + i * 36) * Math.PI) / 180;
            const rad2 = ((((i % 5) * 72) % 360) * Math.PI) / 180;
            const tVal = -Math.floor(i / 5) + 1;

            mat4.identity(this.uniforms.mMat);
            mat4.multiply(
                this.uniforms.mvpMat,
                this.uniforms.vpMat,
                this.uniforms.mMat
            );
            mat4.invert(this.uniforms.normMat, this.uniforms.mMat);
            mat4.multiply(
                this.uniforms.lmvpMat,
                this.uniforms.lvpMat,
                this.uniforms.mMat
            );

            gl.uniformMatrix4fv(
                this.mProg.uni.mvpMatrix,
                false,
                this.uniforms.mvpMat
            );
            gl.uniformMatrix4fv(
                this.mProg.uni.mMatrix,
                false,
                this.uniforms.mMat
            );
            gl.uniformMatrix4fv(
                this.mProg.uni.invMatrix,
                false,
                this.uniforms.normMat
            );
            gl.uniformMatrix4fv(
                this.mProg.uni.tMatrix,
                false,
                this.uniforms.tMatrix
            );
            gl.uniformMatrix4fv(
                this.mProg.uni.lightMatrix,
                false,
                this.uniforms.lmvpMat
            );
            gl.uniform3fv(this.mProg.uni.lightPos, this.light.position);
            gl.uniform1i(this.mProg.uni.texture, 0);
            gl.drawElements(
                gl.TRIANGLES,
                this.torusVBO.rawIndex.length,
                gl.UNSIGNED_SHORT,
                0
            );
        });

        this.setAttr(gl, this.mProg.attr, this.planeVBO);
        mat4.identity(this.uniforms.mMat);
        mat4.translate(this.uniforms.mMat, this.uniforms.mMat, [10, -10, 0]);
        mat4.scale(this.uniforms.mMat, this.uniforms.mMat, [30, 0, 30]);
        mat4.multiply(
            this.uniforms.mvpMat,
            this.uniforms.vpMat,
            this.uniforms.mMat
        );
        mat4.invert(this.uniforms.normMat, this.uniforms.mMat);
        mat4.multiply(
            this.uniforms.lmvpMat,
            this.uniforms.lvpMat,
            this.uniforms.mMat
        );
        gl.uniformMatrix4fv(
            this.mProg.uni.mvpMatrix,
            false,
            this.uniforms.mvpMat
        );
        gl.uniformMatrix4fv(this.mProg.uni.mMatrix, false, this.uniforms.mMat);
        gl.uniformMatrix4fv(
            this.mProg.uni.invMatrix,
            false,
            this.uniforms.normMat
        );
        gl.uniformMatrix4fv(
            this.mProg.uni.tMatrix,
            false,
            this.uniforms.tMatrix
        );
        gl.uniformMatrix4fv(
            this.mProg.uni.lightMatrix,
            false,
            this.uniforms.lmvpMat
        );
        gl.drawElements(
            gl.TRIANGLES,
            this.planeVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );

        gl.flush();
    }
    loop(gl: WebGLRenderingContext, counter: number) {
        counter++;
        this.render(gl, counter);
        setTimeout(() => this.loop(gl, counter), 1000 / 60);
    }
    compile(gl: WebGLRenderingContext, v: string, f: string) {
        const vs = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
        gl.shaderSource(vs, v);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(`compile ${v}vert fail`);
            console.log(gl.getShaderInfoLog(vs));
            return;
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
        gl.shaderSource(fs, f);
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
    createFrameBuffer(gl: WebGLRenderingContext, w: number, h: number) {
        const fbuf = gl.createFramebuffer();
        if (!fbuf) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbuf);

        const dbuf = gl.createRenderbuffer();
        if (!dbuf) return;
        gl.bindRenderbuffer(gl.RENDERBUFFER, dbuf);

        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            dbuf
        );

        const fTex = gl.createTexture();
        if (!fTex) return;
        gl.bindTexture(gl.TEXTURE_2D, fTex);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            w,
            h,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            fTex,
            0
        );

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { f: fbuf, d: dbuf, t: fTex };
    }
    createTexture(gl: WebGLRenderingContext, souce: string) {
        const img = new Image();
        img.onload = () => {
            const tex = gl.createTexture() as WebGLTexture;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );
            this.texGroup[souce] = tex;
            gl.bindTexture(gl.TEXTURE_2D, null);
            console.log(tex);
        };
        img.src = images[souce];
    }
    setAttr(
        gl: WebGLRenderingContext,
        loc: {
            position: aloc;
            color?: aloc;
            normal?: aloc;
            index?: WebGLBuffer;
            rawIndex?: number[];
        },
        vbo: vbo
    ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo.position);
        gl.enableVertexAttribArray(loc.position.loc);
        gl.vertexAttribPointer(
            loc.position.loc,
            loc.position.len,
            gl.FLOAT,
            false,
            0,
            0
        );

        if (loc.color) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo.color);
            gl.enableVertexAttribArray(loc.color.loc);
            gl.vertexAttribPointer(
                loc.color.loc,
                loc.color.len,
                gl.FLOAT,
                false,
                0,
                0
            );
        }

        if (loc.normal) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo.normal);
            gl.enableVertexAttribArray(loc.normal.loc);
            gl.vertexAttribPointer(
                loc.normal.loc,
                loc.normal.len,
                gl.FLOAT,
                false,
                0,
                0
            );
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo.index);
    }
}

window.onload = () => {
    const m = new main();
};
