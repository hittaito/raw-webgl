import { mat4, vec3 } from 'gl-matrix';
import fragment from './glsl/main.frag';
import vertex from './glsl/main.vert';
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
        cameraPos: WebGLUniformLocation;
        mMatrix: WebGLUniformLocation;
        cubeTexture: WebGLUniformLocation;
        reflection: WebGLUniformLocation;
    };
    private aLocation: {
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
    private torusVBO: vbo;
    private cubeVBO: vbo;

    private camera: {
        position: vec3;
        upDir: vec3;
        quat: quat.quat;
    };
    private cubeTex: WebGLTexture;
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

        this.aLocation = {
            position: { len: 3, loc: gl.getAttribLocation(prog, 'position') },
            color: { len: 4, loc: gl.getAttribLocation(prog, 'color') },
            normal: { len: 3, loc: gl.getAttribLocation(prog, 'normal') },
        };

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

        this.uLocation = {
            mvpMatrix: gl.getUniformLocation(
                prog,
                'mvpMatrix'
            ) as WebGLUniformLocation,
            cameraPos: gl.getUniformLocation(
                prog,
                'cameraPos'
            ) as WebGLUniformLocation,
            mMatrix: gl.getUniformLocation(
                prog,
                'mMatrix'
            ) as WebGLUniformLocation,
            cubeTexture: gl.getUniformLocation(
                prog,
                'cubeTexture'
            ) as WebGLUniformLocation,
            reflection: gl.getUniformLocation(
                prog,
                'reflection'
            ) as WebGLUniformLocation,
        };

        this.camera = {
            position: [0, 0, 20],
            upDir: [0, 1, 0],
            quat: quat.identity(quat.create()),
        };

        mat4.lookAt(this.uniforms.vMat, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
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

        this.createCubeTexure(gl, [
            { name: 'negx', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
            { name: 'negy', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
            { name: 'negz', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
            { name: 'posx', target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
            { name: 'posy', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
            { name: 'posz', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
        ]);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        this.loop(gl, 0);
    }
    render(gl: WebGLRenderingContext, counter: number) {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const rad = ((counter % 360) * Math.PI) / 180;
        const rad2 = ((counter % 720) * Math.PI) / 360;

        quat.rotate(rad2, [1, 0, 0], this.camera.quat);
        quat.toVecIII([0.0, 0.0, 10.0], this.camera.quat, this.camera.position);
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
        gl.uniform3fv(this.uLocation.cameraPos, this.camera.position);
        // set image
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeTex);
        gl.uniform1i(this.uLocation.cubeTexture, 0);

        // cube
        gl.uniform1i(this.uLocation.reflection, 1);
        mat4.identity(this.uniforms.mMat);
        mat4.scale(this.uniforms.mMat, this.uniforms.mMat, [100, 100, 100]);
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
        this.setAttr(gl, this.cubeVBO);
        gl.drawElements(
            gl.TRIANGLES,
            this.cubeVBO.rawIndex.length,
            gl.UNSIGNED_SHORT,
            0
        );

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
    createFramebuffer(gl: WebGLRenderingContext, w: number, h: number) {
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

        gl.bindTexture(gl.TEXTURE_2D, null);
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
    setAttr(gl: WebGLRenderingContext, vbo: vbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo.position);
        gl.enableVertexAttribArray(this.aLocation.position.loc);
        gl.vertexAttribPointer(
            this.aLocation.position.loc,
            this.aLocation.position.len,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo.color);
        gl.enableVertexAttribArray(this.aLocation.color.loc);
        gl.vertexAttribPointer(
            this.aLocation.color.loc,
            this.aLocation.color.len,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo.normal);
        gl.enableVertexAttribArray(this.aLocation.normal.loc);
        gl.vertexAttribPointer(
            this.aLocation.normal.loc,
            this.aLocation.normal.len,
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
