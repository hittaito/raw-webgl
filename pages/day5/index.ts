import { mat4, ReadonlyVec3, ReadonlyVec4, vec3 } from 'gl-matrix';
import mFragment from './glsl/main.frag';
import mVertex from './glsl/main.vert';
import lFragment from './glsl/light.frag';
import lVertex from './glsl/light.vert';
import { Sphere } from './models/sphere';
import { Torus } from './models/torus';
import { Cube } from './models/cube';
import * as quat from './math/quat';
import * as images from '../assets/*.jpg';

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
    } = {
        mMat: mat4.create(),
        vMat: mat4.create(),
        pMat: mat4.create(),
        vpMat: mat4.create(),
        mvpMat: mat4.create(),
        normMat: mat4.create(),
    };
    private mProg: {
        prog: WebGLProgram;
        uni: {
            mvpMatrix: WebGLUniformLocation;
            mMatrix: WebGLUniformLocation;
            cameraPos: WebGLUniformLocation;
            cubeTexture: WebGLUniformLocation;
            reflection: WebGLUniformLocation;
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
    private lProg: {
        prog: WebGLProgram;
        uni: {
            mvpMatrix: WebGLUniformLocation;
            invMatrix: WebGLUniformLocation;
            lightDir: WebGLUniformLocation;
            cameraDir: WebGLUniformLocation;
            ambColor: WebGLUniformLocation;
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

    private torusVBO: vbo;
    private cubeVBO: vbo;
    private sphereVBO: vbo;

    private camera: {
        position: vec3;
        upDir: vec3;
        quat: quat.quat;
    };
    private cubeTex: WebGLTexture;
    private frameBuf: {
        f: WebGLFramebuffer;
        d: WebGLRenderbuffer;
        t: WebGLTexture;
    };
    private source: { name: string; target: number }[];
    private dir: {
        name: string;
        camera: ReadonlyVec3;
        upDir: ReadonlyVec3;
        pos: ReadonlyVec3;
        amb: ReadonlyVec4;
    }[] = [
        {
            name: 'posx',
            camera: [1, 0, 0],
            upDir: [0, -1, 0],
            pos: [9, 0, 0],
            amb: [1, 0.5, 0.5, 1],
        },
        {
            name: 'posy',
            camera: [0, 1, 0],
            upDir: [0, 0, 1],
            pos: [0, 9, 0],
            amb: [0.5, 1, 0.5, 1],
        },
        {
            name: 'posz',
            camera: [0, 0, 1],
            upDir: [0, -1, 0],
            pos: [2, 0, 9],
            amb: [0.5, 0.5, 1, 1],
        },
        {
            name: 'negx',
            camera: [-1, 0, 0],
            upDir: [0, -1, 0],
            pos: [-9, 0, 0],
            amb: [0.5, 0, 0, 1],
        },
        {
            name: 'negy',
            camera: [0, -1, 0],
            upDir: [0, 0, -1],
            pos: [0, -9, 0],
            amb: [0, 0.5, 0, 1],
        },
        {
            name: 'negz',
            camera: [0, 0, -1],
            upDir: [0, -1, 0],
            pos: [0, 0, -9],
            amb: [0, 0, 0.5, 1],
        },
    ];
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
                cameraPos: gl.getUniformLocation(
                    mProg,
                    'cameraPos'
                ) as WebGLUniformLocation,
                mMatrix: gl.getUniformLocation(
                    mProg,
                    'mMatrix'
                ) as WebGLUniformLocation,
                cubeTexture: gl.getUniformLocation(
                    mProg,
                    'cubeTexture'
                ) as WebGLUniformLocation,
                reflection: gl.getUniformLocation(
                    mProg,
                    'reflection'
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

        const lShader = this.compile(gl, lVertex, lFragment);
        if (!lShader) return;

        const lProg = this.createProgram(gl, lShader.vert, lShader.frag);
        if (!lProg) return;

        this.lProg = {
            prog: lProg,
            uni: {
                mvpMatrix: gl.getUniformLocation(
                    lProg,
                    'mvpMatrix'
                ) as WebGLUniformLocation,
                invMatrix: gl.getUniformLocation(
                    lProg,
                    'invMatrix'
                ) as WebGLUniformLocation,
                cameraDir: gl.getUniformLocation(
                    lProg,
                    'cameraDir'
                ) as WebGLUniformLocation,
                lightDir: gl.getUniformLocation(
                    lProg,
                    'lightDir'
                ) as WebGLUniformLocation,
                ambColor: gl.getUniformLocation(
                    lProg,
                    'ambColor'
                ) as WebGLUniformLocation,
            },
            attr: {
                position: {
                    len: 3,
                    loc: gl.getAttribLocation(lProg, 'position'),
                },
                color: { len: 4, loc: gl.getAttribLocation(lProg, 'color') },
                normal: { len: 3, loc: gl.getAttribLocation(lProg, 'normal') },
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

        const cube = new Cube(1);
        this.cubeVBO = {
            position: this.createVBO(gl, cube.pos),
            color: this.createVBO(gl, cube.col),
            normal: this.createVBO(gl, cube.normal),
            index: this.createIBO(gl, cube.idx),
            rawIndex: cube.idx,
        };
        const sphere = new Sphere(50, 50, 5, [1, 1, 1, 1]);
        this.sphereVBO = {
            position: this.createVBO(gl, sphere.pos),
            color: this.createVBO(gl, sphere.col),
            normal: this.createVBO(gl, sphere.normal),
            index: this.createIBO(gl, sphere.idx),
            rawIndex: sphere.idx,
        };

        // Cube texture
        this.source = [
            { name: 'posx', target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
            { name: 'posy', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
            { name: 'posz', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
            { name: 'negx', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
            { name: 'negy', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
            { name: 'negz', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
        ];
        this.createCubeTexure(gl, this.source);
        this.frameBuf = this.createFramebuffer(
            gl,
            1024,
            1024,
            this.source.map((v) => v.target)
        );

        this.camera = {
            position: [0, 0, 20],
            upDir: [0, 1, 0],
            quat: quat.identity(quat.create()),
        };

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        this.loop(gl, 0);
    }
    render(gl: WebGLRenderingContext, counter: number) {
        const lightDir = [-1, 1, 1];
        // render for frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuf.f);
        this.source.forEach((s, i) => {
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                s.target,
                this.frameBuf.t,
                0
            );
            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const dir = this.dir.find((v) => v.name === s.name);
            if (!dir) return;
            mat4.lookAt(this.uniforms.vMat, dir.camera, [0, 0, 0], dir.upDir);
            mat4.perspective(this.uniforms.pMat, Math.PI / 2, 1, 0.1, 200);
            mat4.multiply(
                this.uniforms.vpMat,
                this.uniforms.pMat,
                this.uniforms.vMat
            );

            // set cube texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeTex);

            // main program -> set background image -----------------------
            gl.useProgram(this.mProg.prog);

            // cube attribute
            this.setAttr(gl, this.mProg.attr, this.cubeVBO);

            // cube uniforms
            mat4.identity(this.uniforms.mMat);
            mat4.scale(this.uniforms.mMat, this.uniforms.mMat, [100, 100, 100]);
            mat4.multiply(
                this.uniforms.mvpMat,
                this.uniforms.vpMat,
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
            gl.uniform3fv(this.mProg.uni.cameraPos, [0, 0, 0]);
            gl.uniform1i(this.mProg.uni.cubeTexture, 0);
            gl.uniform1i(this.mProg.uni.reflection, 1);
            gl.drawElements(
                gl.TRIANGLES,
                this.cubeVBO.rawIndex.length,
                gl.UNSIGNED_SHORT,
                0
            );

            // torus for light shader ------------------------------------
            gl.useProgram(this.lProg.prog);
            this.setAttr(gl, this.lProg.attr, this.torusVBO);
            mat4.identity(this.uniforms.mMat);
            mat4.translate(this.uniforms.mMat, this.uniforms.mMat, dir.pos);
            mat4.rotate(
                this.uniforms.mMat,
                this.uniforms.mMat,
                rad,
                dir.camera
            );
            mat4.multiply(
                this.uniforms.mvpMat,
                this.uniforms.vpMat,
                this.uniforms.mMat
            );
            mat4.invert(this.uniforms.normMat, this.uniforms.mMat);
            gl.uniformMatrix4fv(
                this.lProg.uni.mvpMatrix,
                false,
                this.uniforms.mvpMat
            );
            gl.uniformMatrix4fv(
                this.lProg.uni.invMatrix,
                false,
                this.uniforms.normMat
            );
            gl.uniform3fv(this.lProg.uni.lightDir, lightDir);
            gl.uniform3fv(
                this.lProg.uni.cameraDir,
                dir.camera.map((v: number) => -1 * v)
            );
            gl.uniform4fv(this.lProg.uni.ambColor, dir.amb);
            gl.drawElements(
                gl.TRIANGLES,
                this.torusVBO.rawIndex.length,
                gl.UNSIGNED_SHORT,
                0
            );
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const rad = ((counter % 360) * Math.PI) / 180;
        const rad2 = ((counter % 720) * Math.PI) / 360;

        //  quat.rotate(rad2, [1, 0, 0], this.camera.quat);
        quat.toVecIII([0.0, 0.0, 20.0], this.camera.quat, this.camera.position);
        quat.toVecIII([0.0, 1.0, 0.0], this.camera.quat, this.camera.upDir);

        mat4.lookAt(
            this.uniforms.vMat,
            this.camera.position,
            [0, 0, 0],
            this.camera.upDir
        );
        mat4.perspective(
            this.uniforms.pMat,
            Math.PI / 2,
            innerWidth / innerHeight,
            0.1,
            200
        );
        mat4.multiply(
            this.uniforms.vpMat,
            this.uniforms.pMat,
            this.uniforms.vMat
        );

        // set image
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeTex);

        // 背景用 cube mapptin
        gl.useProgram(this.mProg.prog);
        this.setAttr(gl, this.mProg.attr, this.cubeVBO);
        mat4.identity(this.uniforms.mMat);
        mat4.scale(this.uniforms.mMat, this.uniforms.mMat, [100, 100, 100]);
        mat4.multiply(
            this.uniforms.mvpMat,
            this.uniforms.vpMat,
            this.uniforms.mMat
        );
        gl.uniformMatrix4fv(
            this.mProg.uni.mvpMatrix,
            false,
            this.uniforms.mvpMat
        );
        gl.uniformMatrix4fv(this.mProg.uni.mMatrix, false, this.uniforms.mMat);
        gl.uniform3fv(this.mProg.uni.cameraPos, this.camera.position);
        gl.uniform1i(this.mProg.uni.cubeTexture, 0);
        gl.uniform1i(this.mProg.uni.reflection, 1);
        gl.drawElements(
            gl.TRIANGLES,
            this.cubeVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );

        // sphere rendering
        this.setAttr(gl, this.mProg.attr, this.sphereVBO);
        mat4.identity(this.uniforms.mMat);
        mat4.multiply(
            this.uniforms.mvpMat,
            this.uniforms.vpMat,
            this.uniforms.mMat
        );
        gl.uniformMatrix4fv(
            this.mProg.uni.mvpMatrix,
            false,
            this.uniforms.mvpMat
        );
        gl.uniformMatrix4fv(this.mProg.uni.mMatrix, false, this.uniforms.mMat);
        gl.uniform3fv(this.mProg.uni.cameraPos, this.camera.position);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.frameBuf.t);
        gl.uniform1i(this.mProg.uni.cubeTexture, 0);
        gl.uniform1i(this.mProg.uni.reflection, 0);
        gl.drawElements(
            gl.TRIANGLES,
            this.sphereVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );

        gl.useProgram(this.lProg.prog);
        this.setAttr(gl, this.lProg.attr, this.torusVBO);
        this.source.forEach((s) => {
            const dir = this.dir.find((v) => v.name === s.name);
            if (!dir) return;
            mat4.identity(this.uniforms.mMat);
            mat4.translate(this.uniforms.mMat, this.uniforms.mMat, dir.pos);
            mat4.rotate(
                this.uniforms.mMat,
                this.uniforms.mMat,
                rad,
                dir.camera
            );
            mat4.multiply(
                this.uniforms.mvpMat,
                this.uniforms.vpMat,
                this.uniforms.mMat
            );
            mat4.invert(this.uniforms.normMat, this.uniforms.mMat);
            gl.uniformMatrix4fv(
                this.lProg.uni.mvpMatrix,
                false,
                this.uniforms.mvpMat
            );
            gl.uniformMatrix4fv(
                this.lProg.uni.invMatrix,
                false,
                this.uniforms.normMat
            );
            gl.uniform3fv(this.lProg.uni.lightDir, lightDir);
            gl.uniform3fv(this.lProg.uni.cameraDir, this.camera.position);
            gl.uniform4fv(this.lProg.uni.ambColor, dir.amb);
            gl.drawElements(
                gl.TRIANGLES,
                this.torusVBO.rawIndex.length,
                gl.UNSIGNED_SHORT,
                0
            );
        });

        /*
        // torus draw
        mat4.identity(this.uniforms.mMat);
        mat4.translate(this.uniforms.mMat, this.uniforms.mMat, [0, 0, 0]);
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

        gl.uniform1i(this.uLocation.reflection, 0);
        this.setAttr(gl, this.torusVBO);
        gl.drawElements(
            gl.TRIANGLES,
            this.torusVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );
            */
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
    createFramebuffer(
        gl: WebGLRenderingContext,
        w: number,
        h: number,
        target: number[]
    ) {
        const fbuf = gl.createFramebuffer() as WebGLFramebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbuf);

        const dbuf = gl.createRenderbuffer() as WebGLRenderbuffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, dbuf);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            dbuf
        );

        const fTex = gl.createTexture() as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, fTex);
        target.forEach((t) => {
            gl.texImage2D(
                t,
                0,
                gl.RGBA,
                w,
                h,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            );
        });

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE
        );
        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_S,
            gl.CLAMP_TO_EDGE
        );

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            f: fbuf,
            d: dbuf,
            t: fTex,
        };
    }
    createCubeTexure(
        gl: WebGLRenderingContext,
        source: { name: string; target: number; data?: HTMLImageElement }[]
    ) {
        let count = 0;
        source.forEach((s, id) => {
            const i = new Image();
            i.onload = () => {
                count++;
                source[id].data = i;
                if (count === 6) this.generateMap(gl, source);
            };
            i.src = images[s.name];
        });
    }
    generateMap(
        gl: WebGLRenderingContext,
        source: { name: string; target: number; data?: HTMLImageElement }[]
    ) {
        const tex = gl.createTexture() as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

        source.forEach((s) => {
            gl.texImage2D(
                s.target,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                s.data as HTMLImageElement
            );
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_S,
            gl.CLAMP_TO_EDGE
        );
        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE
        );
        this.cubeTex = tex;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    setAttr(
        gl: WebGLRenderingContext,
        loc: {
            position: aloc;
            color: aloc;
            normal: aloc;
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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo.index);
    }
}

window.onload = () => {
    const m = new main();
};
