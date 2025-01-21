export enum DistanceUnit {
    m = "m",
    km = "km",
    ft = "ft",
    mi = "mi",
}

export const parseDistanceFormat = (value: string, fallback: DistanceUnit): DistanceUnit => {
    switch (value.toLowerCase()) {
        case "m":
            return DistanceUnit.m;
        case "km":
            return DistanceUnit.km;
        case "ft":
            return DistanceUnit.ft;
        case "mi":
            return DistanceUnit.mi;
        default:
            return fallback;
    }
};

export class Distance {
    private _raw_m: number;

    public constructor(value: number, format: DistanceUnit) {
        this.set(value, format);
    }

    public set(value: number, format: DistanceUnit): void {
        switch (format) {
            case DistanceUnit.m:
                this._raw_m = value;
            case DistanceUnit.km:
                this._raw_m = value * 1000;
            case DistanceUnit.ft:
                this._raw_m = value * 0.3048;
            case DistanceUnit.mi:
                this._raw_m = value * 1609.344;
            default:
                this._raw_m = value;
        }
    }

    public to_string(format: DistanceUnit): string {
        let value = this._raw_m;
        let precision = 2;
        switch (format) {
            case DistanceUnit.m:
                value = this._raw_m;
                precision = 2;
                break;
            case DistanceUnit.km:
                value = this._raw_m / 1000;
                precision = 3;
                break;
            case DistanceUnit.ft:
                value = this._raw_m / 0.3048;
                precision = 1;
                break;
            case DistanceUnit.mi:
                value = this._raw_m / 1609.344;
                precision = 3;
                break;
            default:
                value = this._raw_m;
                precision = 2;
        }

        return `${value.toFixed(precision)} ${format}`;
    }

    public m(): number {
        return this._raw_m;
    }
}
