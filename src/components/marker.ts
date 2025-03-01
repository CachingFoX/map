import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {xml_escape} from "./utilities";

let next_marker_id = 0;

export interface IMarkerJson {
    marker_id: number;
    coordinates: string;
    name: string;
    color: string;
    radius: number;
}

export class Marker {
    public marker_id: number;
    public coordinates: Coordinates;
    public name: string;
    public color: Color;
    public radius: number;

    public constructor(coordinates: Coordinates) {
        this.marker_id = next_marker_id;
        this.coordinates = coordinates;
        const id = this.get_id();
        const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.name = (id < abc.length) ? abc[id] : `${abc[id % abc.length]}${1 + Math.floor(id / abc.length)}`;
        this.color = Color.random_from_palette();
        this.radius = 0;

        next_marker_id += 1;
    }

    public static reset_ids(next: number = 0): void {
        next_marker_id = next;
    }

    public get_id(): number {
        return this.marker_id;
    }

    public to_gpx(): string {
        const symbol = "flag";
        const data: string[] = [];
        data.push(`<wpt lat="${this.coordinates.lat().toFixed(8)}" lon="${this.coordinates.lng().toFixed(8)}">`);
        data.push(`    <name>${xml_escape(this.name)}</name>`);
        data.push(`    <desc>color="${this.color.to_string()}"</desc>`);
        data.push(`    <sym>${symbol}</sym>`);
        if (this.radius > 0) {
            data.push("    <extensions>");
            data.push("      <wptx1:WaypointExtension>");
            data.push(`        <wptx1:Proximity>${this.radius}</wptx1:Proximity>`);
            data.push("      </wptx1:WaypointExtension>");
            data.push("    </extensions>");
        }
        data.push("</wpt>");

        return data.join("\n");
    }

    public to_json(): IMarkerJson {
        return {
            marker_id: this.get_id(),
            coordinates: this.coordinates.to_string_DEC(),
            name: this.name,
            color: this.color.to_string(),
            radius: this.radius,
        };
    }
}
