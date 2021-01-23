import { hsva } from '../util';

export class Plane {
    private _pos: number[] = [];
    private _col: number[] = [];
    private _idx: number[] = [];
    private _norm: number[] = [];
    private _tex: number[] = [];

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
    get tex(): number[] {
        return this._tex;
    }
    constructor() {
        this.init();
    }
    init(): void {
        this._pos = [
            -1.0,
            1.0,
            0.0,
            1.0,
            1.0,
            0.0,
            -1.0,
            -1.0,
            0.0,
            1.0,
            -1.0,
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
        this._idx = [0, 1, 2, 3, 2, 1];
        this._tex = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    }
}
