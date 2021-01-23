import { hsva } from '../util';

export class Sphere {
    private _pos: number[] = [];
    private _col: number[] = [];
    private _idx: number[] = [];
    private _norm: number[] = [];

    get pos(): number[] {
        return this._pos;
    }
    get col(): number[] {
        return this._col;
    }
    get normal(): number[] {
        return this._norm;
    }
    get idx(): number[] {
        return this._idx;
    }
    constructor(row: number, column: number, rad: number, color: number[]) {
        this.init(row, column, rad, color);
    }
    init(row: number, column: number, rad: number, color: number[]): void {
        const pos: number[] = [];
        const col: number[] = [];
        const norm: number[] = [];
        const idx: number[] = [];
        [...new Array(row + 1)].forEach((_, i) => {
            const r = ((Math.PI * 2) / row) * i;
            const rcos = Math.cos(r);
            const rsin = Math.sin(r);

            [...new Array(column + 1)].forEach((_, j) => {
                const tr = ((Math.PI * 2) / column) * j;
                const tx = rcos * rad * Math.cos(tr);
                const ty = rsin * rad;
                const tz = rcos * rad * Math.sin(tr);

                const rx = rcos * Math.cos(tr);
                const rz = rcos * Math.sin(tr);

                const tc =
                    color ?? (hsva((360 / column) * j, 1, 1, 1) as number[]);

                pos.push(tx, ty, tz);
                norm.push(rx, rsin, rz);
                col.push(...tc);
            });
        });
        [...new Array(row)].forEach((_, i) => {
            [...new Array(column)].forEach((_, j) => {
                const id = (column + 1) * i + j;
                idx.push(id, id + column + 1, id + 1);
                idx.push(id + column + 1, id + column + 2, id + 1);
            });
        });
        this._pos = pos;
        this._col = col;
        this._norm = norm;
        this._idx = idx;
    }
}
