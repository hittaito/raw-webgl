import { hsva } from '../util';
export class Plane {
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
    constructor() {
        this.init();
    }
    init(): void {
        this._pos = [
            -1.0,
            0.0,
            -1.0,
            1.0,
            0.0,
            -1.0,
            -1.0,
            0.0,
            1.0,
            1.0,
            0.0,
            1.0,
        ];
        this._norm = [
            0.0,
            1.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            1.0,
            0.0,
        ];
        this._col = [
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
            1.0,
        ];
        this._idx = [0, 2, 1, 3, 1, 2];
    }
}
