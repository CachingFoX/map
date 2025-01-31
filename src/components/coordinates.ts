// @ts-ignore
import {Geodesic} from "geographiclib-geodesic";

export enum CoordinatesFormat {
    DEC = "DEC",
    DMM = "DMM",
    DMS = "DMS",
}

export const parseCoordinatesFormat = (
    value: string,
    fallback: CoordinatesFormat,
): CoordinatesFormat => {
    switch (value.toUpperCase()) {
        case "D":
        case "DEC":
            return CoordinatesFormat.DEC;
        case "DM":
        case "DMM":
            return CoordinatesFormat.DMM;
        case "DMS":
            return CoordinatesFormat.DMS;
        default:
            return fallback;
    }
};

const pad = (num: number | string, width: number): string => {
    let s = String(num);
    while (s.length < width) {
        s = `0${s}`;
    }

    return s;
};

export interface IDistanceBearing {
    distance: number;
    bearing: number;
}

export class Coordinates {
    private readonly _raw_lat: number;
    private readonly _raw_lng: number;

    public constructor(lat: number, lng: number) {
        this._raw_lat = lat;
        this._raw_lng = lng;
    }

    public equals(other: Coordinates): boolean {
        return this._raw_lat === other._raw_lat &&
               this._raw_lng === other._raw_lng;
    }

    public raw_lat(): number {
        return this._raw_lat;
    }

    public raw_lng(): number {
        return this._raw_lng;
    }

    public lat(): number {
        return this.raw_lat();
    }

    public lng(): number {
        let lng = this.raw_lng();
        while (lng < -180) {
            lng += 360;
        }
        while (lng > 180) {
            lng -= 360;
        }

        return lng;
    }

    public next_lng(other: number): number {
        let lng = this.raw_lng();
        while (lng < other - 180) {
            lng += 360;
        }
        while (lng > other + 180) {
            lng -= 360;
        }

        return lng;
    }

    public static from_components(
        h1: string,
        d1: number,
        m1: number,
        s1: number,
        h2: string,
        d2: number,
        m2: number,
        s2: number,
    ): Coordinates | null {
        let lat: number;
        let lng: number;

        // check if latitude and longitude to continue
        if (((h1 === "N" || h1 === "S") && (h2 === "N" || h2 === "S")) ||
            ((h1 === "E" || h1 === "W") && (h2 === "E" || h2 === "W"))) {
            return null
        }

        // is order longitude/latitude
        if ((h1 === "E" || h1 === "W") && (h2 === "N" || h2 === "S")) {
            return Coordinates.from_components(h2,d2,m2,s2,h1,d1,m1,s1);
        }

        // verify latitude values
        // is degree negative (instead decimal format)
        // avoid N-12° 34.567
        if (h1 !== "+" && d1 < 0) {
            return null;
        }
        // Allow for m/s = 60 for supporting UNESCO style coordinates.
        // See https://github.com/flopp/FloppsMap/issues/77
        if (m1 < 0 || m1 >= 61) {
            return null;
        }
        if (s1 < 0 || s1 >= 61) {
            return null;
        }

        // verify longitude values
        // is degree negative (instead decimal format)
        if (h2 !== "+" && d2 < 0) {
            return null;
        }
        if (m2 < 0 || m2 >= 61) {
            return null;
        }
        if (s2 < 0 || s2 >= 61) {
            return null;
        }

        // calculate latitude and longitude
        lat = d1 + m1 / 60 + s1 / 3600;
        lng = d2 + m2 / 60 + s2 / 3600;

        if (h1 === "S") {
            lat = -lat;
        }
        if (h2 === "W") {
            lng = -lng;
        }

        return new Coordinates(lat, lng);
    }

    public static from_reverse_wherigo(varA: number, varB: number, varC: number) : Coordinates | null {
        let latSign = 1.0;
        let lonSign = 1.0;
        let lonValue = 0.0;
        let latValue = 0.0;

        if ((varA % 1000 - varA % 100) / 100 == 1) {
            latSign = 1;
            lonSign = 1;
        }
        else if ((varA % 1000 - varA % 100) / 100 == 2) {
            latSign = -1;
            lonSign = 1;
        }
        else if ((varA % 1000 - varA % 100) / 100 == 3) {
            latSign = 1;
            lonSign = -1;
        }
        else if ((varA % 1000 - varA % 100) / 100 == 4) {
            latSign = -1;
            lonSign = -1;
        }
      
        if ( ((varC % 100000 - varC % 10000) / 10000 + (varC % 100 - varC % 10) / 10) % 2 === 0) {
            // A4 B2  B5 C3 A6 C2 A1
            latValue = Number(((varA % 10000 - varA % 1000) / 1000 * 10 + (varB % 100 - varB % 10) / 10 + (varB % 100000 - varB % 10000) / 10000 * 0.1 + (varC % 1000 - varC % 100) / 100 * 0.01 + (varA % 1000000 - varA % 100000) / 100000 * 0.001 + (varC % 100 - varC % 10) / 10 * 1.0E-4 + varA % 10 * 1.0E-5));
        }
        else if ( ((varC % 100000 - varC % 10000) / 10000 + (varC % 100 - varC % 10) / 10) % 2 !== 0) {
            // B6 A1   A4 C6 C3 C2 A6
            latValue = Number(((varB % 1000000 - varB % 100000) / 100000 * 10 + varA % 10 + (varA % 10000 - varA % 1000) / 1000 * 0.1 + (varC % 1000000 - varC % 100000) / 100000 * 0.01 + (varC % 1000 - varC % 100) / 100 * 0.001 + (varC % 100 - varC % 10) / 10 * 1.0E-4 + (varA % 1000000 - varA % 100000) / 100000 * 1.0E-5))
        }
      
        if ( ((varC % 100000 - varC % 10000) / 10000 + (varC % 100 - varC % 10) / 10) % 2 === 0 ) {
            // A5 C6  C1 B3 B6 A2
            lonValue = Number(((varA % 100000 - varA % 10000) / 10000 * 100 + (varC % 1000000 - varC % 100000) / 100000 * 10 + varC % 10 + (varB % 1000 - varB % 100) / 100 * 0.1 + (varB % 1000000 - varB % 100000) / 100000 * 0.01 + (varA % 100 - varA % 10) / 10 * 0.001 + (varC % 100000 - varC % 10000) / 10000 * 1.0E-4 + varB % 10 * 1.0E-5));
        }
        else if ( ((varC % 100000 - varC % 10000) / 10000 + (varC % 100 - varC % 10) / 10) % 2 !== 0 ) {
            // B2 C1 A2  A5 B3 B1 ??
            lonValue = Number(((varB % 100 - varB % 10) / 10 * 100 + varC % 10 * 10 + (varA % 100 - varA % 10) / 10 + (varA % 100000 - varA % 10000) / 10000 * 0.1 + (varB % 1000 - varB % 100) / 100 * 0.01 + varB % 10 * 0.001 + (varC % 100000 - varC % 10000) / 10000 * 1.0E-4 + (varB % 100000 - varB % 10000) / 10000 * 1.0E-5));
        }
      
        latValue = latSign * latValue;
        lonValue = lonSign * lonValue;

        return new Coordinates(latValue,lonValue)
    }

    public static from_string(str: string): Coordinates | null {
        const s = Coordinates.sanitize_string(str);

        // factory method for Reverse Wherigo coordinates
        const read_reverse_wherigo = (m: RegExpMatchArray, p: any) : Coordinates | null => {
            let a = parseInt(m[1]);
            let b = parseInt(m[2]);
            let c = parseInt(m[3]);
            return Coordinates.from_reverse_wherigo(a, b, c)
        };

        // factory method for all kind of WGS coordinates
        const read_DMS_groups = (m: RegExpMatchArray, p: any) : Coordinates | null => {
            const extract_hemisphere = (match: RegExpMatchArray, index: string | number): string => {
                if (typeof index === "number") {
                    return match[index];
                }
    
                return index;
            };
    
            const extract_component = (match: RegExpMatchArray, index: number): number => {
                if (index > 0) {
                    return parseFloat(match[index]);
                }
    
                return 0;
            };
            const c = Coordinates.from_components(
                extract_hemisphere(m, p.groups[0]),
                extract_component(m, p.groups[1] as number),
                extract_component(m, p.groups[2] as number),
                extract_component(m, p.groups[3] as number),
                extract_hemisphere(m, p.groups[4]),
                extract_component(m, p.groups[5] as number),
                extract_component(m, p.groups[6] as number),
                extract_component(m, p.groups[7] as number),
            );
            return c
        }

        const patterns = [
            // DMM / H D M (prefix hemisphere)
            {
                regexp: /^([NEWS]) ?(\d+) (\d+\.?\d*) ?([NEWS]) ?(\d+) (\d+\.?\d*)$/,
                groups: [1, 2, 3, 0, 4, 5, 6, 0],
                factory: read_DMS_groups,
            },
            // DMM / D H M (semi-postfix hemisphere)
            {
                regexp: /^(\d+) ?([NEWS]) ?(\d+\.?\d*) (\d+) ?([NEWS]) ?(\d+\.?\d*)$/,
                groups: [2, 1, 3, 0, 5, 4, 6, 0],
                factory: read_DMS_groups,
            },
            // DMM / D M H (postfix hemisphere)
            {
                regexp: /^(\d+) (\d+\.?\d*) ?([NEWS]) ?(\d+) (\d+\.?\d*) ?([NEWS])$/,
                groups: [3, 1, 2, 0, 6, 4, 5, 0],
                factory: read_DMS_groups,
            },
            // DMM / D M (without hemisphere)
            {
                regexp: /^(\d+) (\d+\.?\d*) (\d+) (\d+\.?\d*)$/,
                groups: ["N", 1, 2, 0, "E", 3, 4, 0],
                factory: read_DMS_groups,
            },
            // DMS / H D M S (prefix hemisphere)
            {
                regexp: /^([NEWS]) ?(\d+) (\d+) (\d+\.?\d*) ?([NEWS]) ?(\d+) (\d+) (\d+\.?\d*)$/,
                groups: [1, 2, 3, 4, 5, 6, 7, 8],
                factory: read_DMS_groups,
            },
            // DMS / D H M S (semi-postfix hemisphere)
            {
                regexp: /^(\d+) ?([NEWS]) ?(\d+) (\d+\.?\d*) (\d+) ?([NEWS]) ?(\d+) (\d+\.?\d*)$/,
                groups: [2, 1, 3, 4, 6, 5, 7, 8],
                factory: read_DMS_groups,
            },
            // DMS / D M S H (postfix hemisphere)
            {
                regexp: /^\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*$/,
                groups: [4, 1, 2, 3, 8, 5, 6, 7],
                factory: read_DMS_groups,
            },
            // DMS / D M S - without hemisphere
            {
                regexp: /^(\d+) (\d+) (\d+\.?\d*) (\d+) (\d+) (\d+\.?\d*)$/,
                groups: ["N", 1, 2, 3, "E", 4, 5, 6],
                factory: read_DMS_groups,
            },
            // DEC - prefix hemisphere
            {
                regexp: /^([NEWS]) ?(\d+\.?\d*) ?([NEWS]) ?(\d+\.?\d*)$/,
                groups: [1, 2, 0, 0, 3, 4, 0, 0],
                factory: read_DMS_groups,
            },
            // DEC - postfix hemisphere
            {
                regexp: /^(\d+\.?\d*) ?([NEWS]) ?(\d+\.?\d*) ?([NEWS])$/,
                groups: [2, 1, 0, 0, 4, 3, 0, 0],
                factory: read_DMS_groups,
            },
            // DEC - without hemisphere
            {
                regexp: /^(-?\d+\.?\d*) (-?\d+\.?\d*)$/,
                groups: ["+", 1, 0, 0, "+", 2, 0, 0],
                factory: read_DMS_groups,
            },
            // Reverse Wherigo
            {
                regexp: /^(\d+) (\d+) (\d+)$/,
                factory: read_reverse_wherigo,
            }
        ];

        for (const p of patterns) {
            const m = s.match(p.regexp);
            if (m !== null) {
                const c = p.factory(m, p);
                if (c !== null) {
                    return c;
                }
            }
        }

        return null;
    }

    public to_string(format: string): string {
        switch (format) {
            case CoordinatesFormat.DEC:
                return this.to_string_DEC();
            case CoordinatesFormat.DMS:
                return this.to_string_DMS();
            case CoordinatesFormat.DMM:
            default:
                return this.to_string_DMM();
        }
    }

    public to_string_DMM(): string {
        let lat = Math.abs(this.lat());
        let lat_minutes: number;
        let lat_milli_minutes: number;
        let lng = Math.abs(this.lng());
        let lng_minutes: number;
        let lng_milli_minutes: number;

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        lat_minutes = Math.floor(lat * 60);
        lat = lat * 60 - lat_minutes;
        lat_milli_minutes = Math.floor(Math.round(lat * 1000));
        while (lat_milli_minutes >= 1000) {
            lat_milli_minutes -= 1000;
            lat_minutes += 1;
        }

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        lng_minutes = Math.floor(lng * 60);
        lng = lng * 60 - lng_minutes;
        lng_milli_minutes = Math.floor(Math.round(lng * 1000));
        while (lng_milli_minutes >= 1000) {
            lng_milli_minutes -= 1000;
            lng_minutes += 1;
        }

        return (
            // tslint:disable-next-line: prefer-template
            this.NS() +
            " " +
            pad(lat_deg, 2) +
            "° " +
            pad(lat_minutes, 2) +
            "." +
            pad(lat_milli_minutes, 3) +
            "' " +
            this.EW() +
            " " +
            pad(lng_deg, 3) +
            "° " +
            pad(lng_minutes, 2) +
            "." +
            pad(lng_milli_minutes, 3) +
            "'"
        );
    }

    public to_string_DMS(): string {
        let lat = Math.abs(this.lat());
        let lng = Math.abs(this.lng());

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        const lat_minutes = Math.floor(lat * 60);
        lat = lat * 60 - lat_minutes;
        const lat_seconds = lat * 60;

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        const lng_minutes = Math.floor(lng * 60);
        lng = lng * 60 - lng_minutes;
        const lng_seconds = lng * 60;

        return (
            // tslint:disable-next-line: prefer-template
            this.NS() +
            " " +
            pad(lat_deg, 2) +
            "° " +
            pad(lat_minutes, 2) +
            "' " +
            pad(lat_seconds.toFixed(2), 5) +
            "\" " +
            this.EW() +
            " " +
            pad(lng_deg, 3) +
            "° " +
            pad(lng_minutes, 2) +
            "' " +
            pad(lng_seconds.toFixed(2), 5) +
            "\""
        );
    }

    public to_string_DEC(): string {
        let lat = pad(Math.abs(this.lat()).toFixed(6),9);
        let lng = pad(Math.abs(this.lng()).toFixed(6),10);
        return `${this.NS()} ${lat}° ${this.EW()} ${lng}°`;
    }

    public distance(other: Coordinates): number {
        const geod = Geodesic.WGS84;
        const r = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.LONG_UNROLL,
        );

        return r.s12!;
    }

    public distance_bearing(other: Coordinates): IDistanceBearing {
        const geod = Geodesic.WGS84;
        const r = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.AZIMUTH | Geodesic.LONG_UNROLL,
        );

        let bearing: number = r.azi1!;
        while (bearing < 0) {
            bearing += 360;
        }
        while (bearing >= 360) {
            bearing -= 360;
        }

        return {distance: r.s12!, bearing};
    }

    public project(angle: number, distance: number): Coordinates {
        const geod = Geodesic.WGS84;
        const r = geod.Direct(
            this.lat(),
            this.lng(),
            angle,
            distance,
            Geodesic.LONGITUDE | Geodesic.LATITUDE | Geodesic.LONG_UNROLL,
        );

        return new Coordinates(r.lat2!, r.lon2!);
    }

    public interpolate_geodesic_line(other: Coordinates, _zoom: number): Coordinates[] {
        // Const d = 6000000 / Math.pow(2, zoom);
        const max_k = 50;
        const geod = Geodesic.WGS84;
        const t = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.LONG_UNROLL,
        );

        // Const k = Math.min(max_k, Math.max(1, Math.ceil(t.s12 / d)));
        const k = max_k;
        const points = new Array(k + 1);
        points[0] = this;
        points[k] = new Coordinates(other.raw_lat(), other.next_lng(this.raw_lng()));

        if (k > 1) {
            const line = geod.InverseLine(
                this.raw_lat(),
                this.raw_lng(),
                other.raw_lat(),
                other.next_lng(this.raw_lng()),
                Geodesic.LATITUDE | Geodesic.LONGITUDE | Geodesic.LONG_UNROLL,
            );
            const da12 = t.a12 / k;
            for (let i = 1; i < k; i += 1) {
                const point = line.GenPosition(
                    true,
                    i * da12,
                    Geodesic.LATITUDE | Geodesic.LONGITUDE | Geodesic.LONG_UNROLL,
                );
                points[i] = new Coordinates(point.lat2, point.lon2);
            }
        }

        return points;
    }

    public geodesic_circle(radius: number): Coordinates[] {
        const delta_angle = 1;
        const points = [];
        for (let angle = 0; angle < 360; angle += delta_angle) {
            points.push(this.project(angle, radius));
        }

        return points;
    }

    public NS(): string {
        if (this.lat() >= 0) {
            return "N";
        }

        return "S";
    }

    public EW(): string {
        if (this.lng() >= 0) {
            return "E";
        }

        return "W";
    }

    public static sanitize_string(s: string): string {
        let sanitized = "";
        let commas = 0;
        let periods = 0;

        for (const c of s) {
            if (c === "o" || c === "O") {
                // Map 'O'/'o' to 'E' (German 'Ost' = 'East')
                sanitized += "E";
            } else if (c.match(/[nswe0-9-]/i) !== null) {
                sanitized += c.toUpperCase();
            } else if (c === ".") {
                periods += 1;
                sanitized += c;
            } else if (c === ",") {
                commas += 1;
                sanitized += c;
            } else {
                sanitized += " ";
            }
        }

        // Try to map commas to spaces or periods
        if (commas === 1 && (periods === 0 || periods >= 2)) {
            sanitized = sanitized.replace(/,/g, " ");
        } else if (commas >= 1 && periods === 0) {
            sanitized = sanitized.replace(/,/g, ".");
        }

        sanitized = sanitized.replace(/\s\s+/g, " ");

        // remove trailing and ... whitespace characters
        sanitized = sanitized.trim();

        return sanitized;
    }
}
