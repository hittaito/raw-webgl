import { vec3 } from 'gl-matrix';

export type quat = [number, number, number, number] | Float32Array;
export function create(): Float32Array {
    return new Float32Array(4);
}
export function identity(dest: quat): quat {
    dest[0] = 0;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 1;
    return dest;
}
export function inverse(qtn: quat, dest: quat): quat {
    dest[0] = -qtn[0];
    dest[1] = -qtn[1];
    dest[2] = -qtn[2];
    dest[3] = qtn[3];
    return dest;
}
export function normalize(dest: quat): quat {
    const x = dest[0],
        y = dest[1],
        z = dest[2],
        w = dest[3];
    let l = Math.sqrt(x * x + y * y + z * z + w * w);
    if (l === 0) {
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
    } else {
        l = 1 / l;
        dest[0] = x * l;
        dest[1] = y * l;
        dest[2] = z * l;
        dest[3] = w * l;
    }
    return dest;
}
export function multiply(qtn1: quat, qtn2: quat, dest: quat): quat {
    const ax = qtn1[0],
        ay = qtn1[1],
        az = qtn1[2],
        aw = qtn1[3];
    const bx = qtn2[0],
        by = qtn2[1],
        bz = qtn2[2],
        bw = qtn2[3];
    dest[0] = ax * bw + aw * bx + ay * bz - az * by;
    dest[1] = ay * bw + aw * by + az * bx - ax * bz;
    dest[2] = az * bw + aw * bz + ax * by - ay * bx;
    dest[3] = aw * bw - ax * bx - ay * by - az * bz;
    return dest;
}
export function rotate(angle: number, axis: number[], dest: quat): quat | null {
    let sq = Math.sqrt(
        axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]
    );
    if (!sq) {
        return null;
    }
    let a = axis[0],
        b = axis[1],
        c = axis[2];
    if (sq != 1) {
        sq = 1 / sq;
        a *= sq;
        b *= sq;
        c *= sq;
    }
    const s = Math.sin(angle * 0.5);
    dest[0] = a * s;
    dest[1] = b * s;
    dest[2] = c * s;
    dest[3] = Math.cos(angle * 0.5);
    return dest;
}
export function toVecIII(vec: number[], qtn: quat, dest: vec3): vec3 {
    const qp = create();
    const qq = create();
    const qr = create();
    inverse(qtn, qr);
    qp[0] = vec[0];
    qp[1] = vec[1];
    qp[2] = vec[2];
    multiply(qr, qp, qq);
    multiply(qq, qtn, qr);
    dest[0] = qr[0];
    dest[1] = qr[1];
    dest[2] = qr[2];
    return dest;
}

export function toMatIV(qtn: quat, dest: number[]): number[] {
    const x = qtn[0],
        y = qtn[1],
        z = qtn[2],
        w = qtn[3];
    const x2 = x + x,
        y2 = y + y,
        z2 = z + z;
    const xx = x * x2,
        xy = x * y2,
        xz = x * z2;
    const yy = y * y2,
        yz = y * z2,
        zz = z * z2;
    const wx = w * x2,
        wy = w * y2,
        wz = w * z2;
    dest[0] = 1 - (yy + zz);
    dest[1] = xy - wz;
    dest[2] = xz + wy;
    dest[3] = 0;
    dest[4] = xy + wz;
    dest[5] = 1 - (xx + zz);
    dest[6] = yz - wx;
    dest[7] = 0;
    dest[8] = xz - wy;
    dest[9] = yz + wx;
    dest[10] = 1 - (xx + yy);
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
}
