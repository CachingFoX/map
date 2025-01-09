import {App} from "./app";
import {Color} from "./color";
import {Coordinates, CoordinatesFormat, parseCoordinatesFormat} from "./coordinates";
import {Distance, DistanceUnit, parseDistanceFormat} from "./distance";
import {ILineJson, Line} from "./line";
import {MapStateObserver} from "./map_state_observer";
import {MapType, maptype2string, string2maptype} from "./map_type";
import {IMarkerJson, Marker} from "./marker";
import {Storage} from "./storage";
import {parse_float, parse_int} from "./utilities";

export enum MapStateChange {
    NOTHING = 0,
    SIDEBAR = 1,
    MAPTYPE = 2,
    CENTER = 4,
    ZOOM = 8,
    MARKERS = 16,
    LINES = 32,
    LANGUAGE = 64,
    EVERYTHING = 255,
}

interface IMarkerSettingsDict {
    coordinates_format: CoordinatesFormat;
    random_color: boolean;
    color: Color;
    radius: number;
    filled: boolean;
}
interface ILineSettingsDict {
    random_color: boolean;
    color: Color;
}
export class MapState {
    public app: App;
    public language: string = "";
    public sidebar_open: string | null = null;
    public map_type: MapType | null = null;
    public zoom: number | null = null;
    public center: Coordinates | null = null;
    public german_npa: boolean = false;
    public markers: Marker[] = [];
    public markers_hash: Map<number, Marker>;
    public lines: Line[] = [];
    public lines_hash: Map<number, Line>;
    public settings_coordinates_format: CoordinatesFormat = CoordinatesFormat.DMM;
    public settings_marker_random_color: boolean;
    public settings_marker_color: Color = Color.default_color();
    public settings_marker_radius: number = 0;
    public settings_marker_draggable: boolean = false;
    public settings_marker_filled: boolean = true;
    public settings_distance_unit: DistanceUnit = DistanceUnit.m;
    public settings_line_random_color: boolean = true;
    public settings_line_color: Color = Color.default_color();
    public settings_line_display_distance: boolean = true;
    public observers: MapStateObserver[] = [];
    public storage: Storage;

    public constructor(app: App) {
        this.app = app;
        this.markers_hash = new Map();
        this.lines_hash = new Map();
        this.storage = new Storage();
    }

    public store(): void {
        this.storage.set("language", this.language);

        this.storage.set("sidebar_open", this.sidebar_open);
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.storage.set("map_type", maptype2string(this.map_type));
        this.storage.set_bool("german_npa", this.german_npa);
        this.storage.set("markers", this.get_marker_ids_string());
        this.markers.forEach((marker: Marker): void => {
            this.update_marker_storage(marker);
        });
        this.storage.set("lines", this.get_line_ids_string());
        this.lines.forEach((line: Line): void => {
            this.update_line_storage(line);
        });

        this.storage.set(
            "settings.coordinates_format",
            this.settings_coordinates_format,
        );
        this.storage.set_bool("settings.marker.random_color", this.settings_marker_random_color);
        this.storage.set_color("settings.marker.color", this.settings_marker_color);
        this.storage.set_float("settings.marker.radius", this.settings_marker_radius);
        this.storage.set_bool("settings.marker.draggable", this.settings_marker_draggable);
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);

        this.storage.set("settings.distance_unit", this.settings_distance_unit);
        this.storage.set_bool("settings.line.random_color", this.settings_line_random_color);
        this.storage.set_color("settings.line.color", this.settings_line_color);
        this.storage.set_bool("settings.line.display_distance", this.settings_line_display_distance);
    }

    public restore(): void {
        // Sidebar
        this.set_sidebar_open(this.storage.get("sidebar_open", null));

        // Map view
        this.set_view(
            this.storage.get_coordinates("center", new Coordinates(48, 8))!,
            this.storage.get_int("zoom", 13),
        );
        this.set_map_type(
            string2maptype(this.storage.get("map_type", maptype2string(MapType.OPENSTREETMAP))!)!,
        );
        this.set_german_npa(this.storage.get_bool("german_npa", false));

        // Markers
        const marker_ids: Map<number, number> = new Map();
        this.storage
            .get("markers", "")!
            .split(";")
            .forEach((id: string): void => {
                if (id === "") {
                    return;
                }
                const coordinates = this.storage.get_coordinates(`marker[${id}].coordinates`, null);
                const name = this.storage.get(`marker[${id}].name`, id)!;
                const color = this.storage.get_color(`marker[${id}].color`, new Color("FF0000"));
                const radius = this.storage.get_float(`marker[${id}].radius`, 0)!;
                if (coordinates !== null) {
                    const marker = new Marker(coordinates);
                    marker.name = name;
                    marker.color = color;
                    marker.radius = radius;
                    this.markers.push(marker);
                    this.markers_hash.set(marker.get_id(), marker);
                    marker_ids.set(parseInt(id, 10), marker.get_id());
                }
            });

        // Lines
        this.storage
            .get("lines", "")!
            .split(";")
            .forEach((id: string): void => {
                if (id === "") {
                    return;
                }
                const old_marker1 = this.storage.get_int(`line[${id}].marker1`, -1);
                const old_marker2 = this.storage.get_int(`line[${id}].marker2`, -1);
                const color = this.storage.get_color(`line[${id}].color`, new Color("FF0000"));

                let marker1 = -1;
                if (marker_ids.has(old_marker1)) {
                    marker1 = marker_ids.get(old_marker1)!;
                }

                let marker2 = -1;
                if (marker_ids.has(old_marker2)) {
                    marker2 = marker_ids.get(old_marker2)!;
                }

                const line = new Line(marker1, marker2);
                line.color = color;
                this.lines.push(line);
                this.lines_hash.set(line.get_id(), line);
            });

        this.recompute_lines();

        // Settings
        const coordinates_format = parseCoordinatesFormat(
            this.storage.get("settings.coordinates_format", "")!,
            this.settings_coordinates_format,
        );
        this.set_default_marker_settings({
            coordinates_format,
            random_color: this.storage.get_bool("settings.marker.random_color", true),
            color: this.storage.get_color("settings.marker.color", new Color("FF0000")),
            radius: this.storage.get_float("settings.marker.radius", 0)!,
            filled: this.storage.get_bool("settings.marker.filled", true),
        });
        this.set_draggable_markers(this.storage.get_bool("settings.marker.draggable", false));

        // Settings
        const distance_unit = parseDistanceFormat(
            this.storage.get("settings.distance_unit", "")!,
            this.settings_distance_unit,
        );
        this.set_distance_unit(distance_unit);
        this.set_default_line_settings({
            random_color: this.storage.get_bool("settings.line.random_color", true),
            color: this.storage.get_color("settings.line.color", new Color("FF0000")),
        });
        

        this.set_display_distance(this.storage.get_bool("settings.line.display_distance", true));

        // Language
        this.set_language(this.storage.get("language", "")!);
    }

    public clear_storage(): void {
        const ok_keys = new Set();
        ok_keys.add("version");
        ok_keys.add("language");
        ok_keys.add("center");
        ok_keys.add("zoom");
        ok_keys.add("map_type");
        ok_keys.add("german_npa");
        ok_keys.add("sidebar_open");
        ok_keys.add("markers");
        this.markers.forEach((obj: Marker): void => {
            const id = obj.get_id();
            ok_keys.add(`marker[${id}].coordinates`);
            ok_keys.add(`marker[${id}].name`);
            ok_keys.add(`marker[${id}].color`);
            ok_keys.add(`marker[${id}].radius`);
        });
        ok_keys.add("lines");
        this.lines.forEach((obj: Line): void => {
            const id = obj.get_id();
            ok_keys.add(`line[${id}].marker1`);
            ok_keys.add(`line[${id}].marker2`);
            ok_keys.add(`line[${id}].color`);
        });
        ok_keys.add("settings.coordinates_format");
        ok_keys.add("settings.marker.random_color");
        ok_keys.add("settings.marker.color");
        ok_keys.add("settings.marker.radius");
        ok_keys.add("settings.marker.draggable");
        ok_keys.add("settings.marker.filled");
        ok_keys.add("settings.distance_unit");
        ok_keys.add("settings.line.random_color");
        ok_keys.add("settings.line.color");
        ok_keys.add("settings.line.display_distance");

        ok_keys.add("news.shown");
        ok_keys.add("i18nextLng");

        const bad_keys = this.storage
            .all_keys()
            .filter((key: string): boolean => !ok_keys.has(key));
        bad_keys.forEach((key: string): void => {
            console.log("bad key: ", key);
            this.storage.remove(key);
        });
    }

    public restore_from_url(): void {
        const params = new Map();
        window.location.search
            .substr(1)
            .split("&")
            .forEach((token: string): void => {
                const tokens = token.split("=", 2);
                if (tokens[0].length > 0) {
                    if (tokens.length === 1) {
                        params.set(tokens[0], "");
                    } else {
                        params.set(tokens[0], tokens[1]);
                    }
                }
            });

        let center: Coordinates | null = null;
        let zoom: number | null = null;
        let map_type: MapType | null = null;
        interface IMarkerDict {
            name: string;
            coordinates: Coordinates;
            color: Color;
            radius: number;
        }
        const markers: IMarkerDict[] = [];
        const marker_hash: Map<string, number> = new Map();
        interface ILineDict {
            from: number;
            to: number;
            color: Color;
        }
        const lines: ILineDict[] = [];

        params.forEach((value: string, key: string): void => {
            switch (key) {
                case "c":
                    center = Coordinates.from_string(value);
                    break;
                case "z":
                    zoom = parse_int(value);
                    break;
                case "t":
                    map_type = string2maptype(value);
                    if (map_type === null) {
                        switch (value) {
                            case "OSM":
                            case "OSM/DE":
                                map_type = MapType.OPENSTREETMAP;
                                break;
                            case "TOPO":
                                map_type = MapType.OPENTOPOMAP;
                                break;
                            default:
                                map_type = null;
                        }
                    }
                    break;
                case "m":
                    value.split("*").forEach((token: string): void => {
                        // A:47.984967:7.908317:1000:markerA:ff0000
                        const tokens = token.split(":");
                        if (tokens.length < 3 || tokens.length > 6) {
                            return;
                        }
                        const id = tokens[0];
                        const lat: number | null = parse_float(tokens[1]);
                        const lon: number | null = parse_float(tokens[2]);
                        let radius: number | null = 0;
                        if (tokens.length > 3) {
                            if (tokens[3] !== "") {
                                radius = parse_float(tokens[3]);
                            }
                        }
                        let name = id;
                        if (tokens.length > 4) {
                            name = this.decode(tokens[4]);
                        }
                        let color: Color | null = Color.random_from_palette();
                        if (tokens.length > 5) {
                            color = Color.from_string(tokens[5]);
                        }

                        if (
                            id.length > 0 &&
                            lat !== null &&
                            lon !== null &&
                            radius !== null &&
                            color !== null
                        ) {
                            marker_hash.set(id, markers.length);
                            markers.push({
                                name,
                                coordinates: new Coordinates(lat, lon),
                                color,
                                radius,
                            });
                        }
                    });
                    break;
                case "d":
                    value.split("*").forEach((token: string): void => {
                        // From:to:color
                        const tokens = token.split(":");
                        if (tokens.length < 2 || tokens.length > 3) {
                            return;
                        }

                        let from = null;
                        if (tokens[0].length === 0) {
                            from = -1;
                        } else if (marker_hash.has(tokens[0])) {
                            from = marker_hash.get(tokens[0])!;
                        }
                        let to = null;
                        if (tokens[1].length === 0) {
                            to = -1;
                        } else if (marker_hash.has(tokens[1])) {
                            to = marker_hash.get(tokens[1])!;
                        }
                        let color = Color.from_string("#ff0000");
                        if (tokens.length > 2) {
                            color = Color.from_string(tokens[2]);
                        }

                        if (from !== null && to !== null && color !== null) {
                            lines.push({from, to, color});
                        }
                    });
                    break;
                default:
                    console.log(`ignoring unsupported url parameter: ${key}=${value}`);
            }
        });

        // tslint:disable-next-line: strict-type-predicates
        if (center === null && markers.length === 0) {
            return;
        }

        this.clear_storage();

        // tslint:disable-next-line: strict-type-predicates
        if (center === null) {
            let lat = 0;
            let lon = 0;
            markers.forEach((marker: Marker): void => {
                lat += marker.coordinates.lat();
                lon += marker.coordinates.lng();
            });
            center = new Coordinates(lat / markers.length, lon / markers.length);
        }
        this.storage.set_coordinates("center", center);

        // tslint:disable-next-line: strict-type-predicates
        if (zoom !== null) {
            this.storage.set_int("zoom", zoom);
        }

        // tslint:disable-next-line: strict-type-predicates
        if (map_type !== null) {
            this.storage.set("map_type", map_type);
        }

        const marker_ids = markers.map((_m: IMarkerDict, i: number): number => i);
        this.storage.set("markers", marker_ids.join(";"));
        markers.forEach((obj: IMarkerDict, i: number): void => {
            this.storage.set(`marker[${i}].name`, obj.name);
            this.storage.set_coordinates(`marker[${i}].coordinates`, obj.coordinates);
            this.storage.set_float(`marker[${i}].radius`, obj.radius);
            this.storage.set_color(`marker[${i}].color`, obj.color);
        });

        const line_ids = lines.map((_l: ILineDict, i: number): number => i);
        this.storage.set("lines", line_ids.join(";"));
        lines.forEach((obj: ILineDict, i: number): void => {
            this.storage.set_int(`line[${i}].marker1`, obj.from);
            this.storage.set_int(`line[${i}].marker2`, obj.to);
            this.storage.set_color(`line[${i}].color`, obj.color);
        });
    }

    public encode_coordinates(coordinates: Coordinates): string {
        const lat = coordinates.lat().toFixed(6).replace(/\.?0+$/, "");
        const lng = coordinates.lng().toFixed(6).replace(/\.?0+$/, "");

        return `${lat}:${lng}`;
    }

    public encode_radius(radius: number): string {
        if (radius === 0) {
            return "";
        }

        return radius.toFixed(1).replace(/\.?0+$/, "");
    }

    public create_link(): string {
        const base = window.location.href.split("?")[0].split("#")[0];
        const markers = this.markers
            .map(
                (m: Marker): string =>
                    `${m.get_id()}:${this.encode_coordinates(m.coordinates)}:${this.encode_radius(m.radius)}:${this.encode(m.name)}:${m.color.to_string()}`,
            )
            .join("*");
        const lines = this.lines
            .map((obj: Line): string => `${obj.marker1}:${obj.marker2}:${obj.color.to_string()}`)
            .join("*");

        return `${base}?c=${this.encode_coordinates(this.center!)}&z=${this.zoom}&t=${this.map_type}&m=${markers}&d=${lines}`;
    }

    public decode(s: string): string {
        return decodeURIComponent(s);
    }

    public encode(s: string): string {
        return encodeURIComponent(s)
            .replace(new RegExp(/\*/, "g"), "%2A")
            .replace(new RegExp(/:/, "g"), "%3A");
    }

    public register_observer(observer: MapStateObserver): void {
        this.observers.push(observer);
    }

    public update_observers(changes: number, marker_id: number = -1): void {
        let updatedChanges = changes;
        if ((changes & (MapStateChange.MARKERS | MapStateChange.LINES)) !== 0) {
            if (this.recompute_lines()) {
                updatedChanges = changes | MapStateChange.LINES;
            }
        }
        this.observers.forEach((observer: MapStateObserver): void => {
            observer.update_state(updatedChanges, marker_id);
        });
    }

    public recompute_lines(): boolean {
        let changed = false;
        this.lines.forEach((line: Line): void => {
            const marker1 = this.get_marker(line.marker1);
            const marker2 = this.get_marker(line.marker2);
            if (marker1 !== null && marker2 !== null) {
                const db = marker1.coordinates.distance_bearing(marker2.coordinates);
                if (line.length === null) {
                    changed = true;
                    line.length = new Distance(db.distance, DistanceUnit.m);
                } else if (db.distance !== line.length.m()) {
                    changed = true;
                    line.length.set(db.distance, DistanceUnit.m);
                }
                if (db.distance < 1) {
                    if (line.bearing !== null) {
                        changed = true;
                        line.bearing = null;
                    }
                } else if (db.bearing !== line.bearing) {
                    changed = true;
                    line.bearing = db.bearing;
                }
            } else {
                if (line.length !== null) {
                    changed = true;
                    line.length = null;
                }
                if (line.bearing !== null) {
                    changed = true;
                    line.bearing = null;
                }
            }

            if (marker1 === null && line.marker1 >= 0) {
                changed = true;
                line.marker1 = -1;
            }
            if (marker2 === null && line.marker2 >= 0) {
                changed = true;
                line.marker2 = -1;
            }
        });

        return changed;
    }

    public set_language(language: string): void {
        if (language.toLowerCase().startsWith("de")) {
            this.language = "de";
        } else if (language.toLowerCase().startsWith("fr")) {
            this.language = "fr";
        } else {
            this.language = "en";
        }
        if (language !== this.language) {
            console.log(`Normalizing language settings: "${language}" => "${this.language}"`);
        }
        this.storage.set("language", this.language);
        this.update_observers(MapStateChange.LANGUAGE);
    }

    public set_sidebar_open(section: string | null): void {
        this.sidebar_open = section;
        this.storage.set("sidebar_open", section);
        this.update_observers(MapStateChange.SIDEBAR);
    }

    public set_map_type(map_type: MapType | null): void {
        this.map_type = map_type;
        this.storage.set("map_type", maptype2string(this.map_type));
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_german_npa(enabled: boolean): void {
        this.german_npa = enabled;
        this.storage.set_bool("german_npa", this.german_npa);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_view(center: Coordinates, zoom: number): void {
        this.center = center;
        this.zoom = zoom;
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(MapStateChange.CENTER|MapStateChange.ZOOM);
    }

    public set_zoom(zoom: number): void {
        this.zoom = zoom;
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(MapStateChange.ZOOM);
    }

    public set_center(coordinates: Coordinates): void {
        this.center = coordinates;
        this.storage.set_coordinates("center", this.center);
        this.update_observers(MapStateChange.CENTER);
    }

    public add_marker(coordinates: Coordinates | null): Marker {
        const marker = new Marker(coordinates === null ? this.center! : coordinates);
        if (!this.settings_marker_random_color) {
            marker.color = this.settings_marker_color;
        }
        marker.radius = this.settings_marker_radius;

        this.markers.push(marker);
        this.markers_hash.set(marker.get_id(), marker);
        this.update_marker_storage(marker);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS, marker.get_id());

        this.app.message(this.app.translate("messages.marker_created"));

        return marker;
    }

    public get_marker(id: number): Marker | null {
        const marker = this.markers_hash.get(id);
        if (marker === undefined) {
            return null;
        }

        return marker;
    }

    public delete_marker(id: number): void {
        this.markers = this.markers.filter(
            (marker: Marker, _index: number, _arr: Marker[]): boolean => marker.get_id() !== id,
        );
        this.markers_hash.delete(id);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS, id);
    }

    public delete_all_markers(): void {
        Marker.reset_ids();
        this.markers = [];
        this.markers_hash.clear();
        this.storage.set("markers", null);
        this.update_observers(MapStateChange.MARKERS);
    }

    public set_marker_coordinates(id: number, coordinates: Coordinates): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);

            return;
        }

        const marker = this.markers_hash.get(id)!;
        if (!coordinates.equals(marker.coordinates)) {
            marker.coordinates = coordinates;
            this.storage.set_coordinates(`marker[${id}].coordinates`, coordinates);
            this.update_observers(MapStateChange.MARKERS, id);
        }
    }

    public set_marker_name(id: number, name: string): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);

            return;
        }

        const marker = this.markers_hash.get(id)!;
        if (name !== marker.name) {
            marker.name = name;
            this.storage.set(`marker[${id}].name`, name);
            this.update_observers(MapStateChange.MARKERS, id);
        }
    }

    public set_marker_color(id: number, color: Color): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);

            return;
        }

        const marker = this.markers_hash.get(id)!;
        if (!color.equals(marker.color)) {
            marker.color = color;
            this.storage.set_color(`marker[${id}].color`, color);
            this.update_observers(MapStateChange.MARKERS, id);
        }
    }

    public set_marker_radius(id: number, radius: number): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);

            return;
        }

        const marker = this.markers_hash.get(id)!;
        if (radius !== marker.radius) {
            marker.radius = radius;
            this.storage.set_float(`marker[${id}].radius`, radius);
            this.update_observers(MapStateChange.MARKERS, id);
        }
    }

    public update_marker_storage(marker: Marker): void {
        const id = marker.get_id();
        this.storage.set_coordinates(`marker[${id}].coordinates`, marker.coordinates);
        this.storage.set(`marker[${id}].name`, marker.name);
        this.storage.set_color(`marker[${id}].color`, marker.color);
        this.storage.set_float(`marker[${id}].radius`, marker.radius);
    }

    public get_marker_ids_string(): string {
        return this.markers.map((m: Marker): string => `${m.get_id()}`).join(";");
    }

    public sort_markers_by_name(): void {
        this.markers.sort((a: Marker, b: Marker): number => {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return +1;
            }
            return 0;
        });
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public sort_markers_by_distance(): void {
        if (this.center === null) {
            return;
        }

        const distances = new Map();
        this.markers.forEach((marker: Marker): void => {
            distances.set(marker.marker_id, marker.coordinates.distance(this.center!));
        });
        this.markers.sort((a: Marker, b: Marker): number => {
            return distances.get(a.marker_id) - distances.get(b.marker_id);
        });
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public reorder_markers(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this.markers.splice(new_index, 0, this.markers.splice(old_index, 1)[0]);
        this.storage.set("markers", this.get_marker_ids_string());
    }

    public add_line(): Line {
        const line = new Line(-1, -1);
        if (!this.settings_line_random_color) {
            line.color = this.settings_line_color;
        }

        this.lines.push(line);
        this.lines_hash.set(line.get_id(), line);
        this.update_line_storage(line);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);

        this.app.message(this.app.translate("messages.line_created"));

        return line;
    }

    public get_line(id: number): Line | null {
        const line = this.lines_hash.get(id);
        if (line === undefined) {
            return null;
        }

        return line;
    }

    public delete_line(id: number): void {
        this.lines = this.lines.filter(
            (line: Line, _index: number, _arr: Line[]): boolean => line.get_id() !== id,
        );
        this.lines_hash.delete(id);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);
    }

    public delete_all_lines(): void {
        Line.reset_ids();
        this.lines = [];
        this.lines_hash.clear();
        this.storage.set("lines", null);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_marker1(id: number, marker_id: number): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);

            return;
        }
        this.lines_hash.get(id)!.marker1 = marker_id;
        this.storage.set_int(`line[${id}].marker1`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_marker2(id: number, marker_id: number): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);

            return;
        }
        this.lines_hash.get(id)!.marker2 = marker_id;
        this.storage.set_int(`line[${id}].marker2`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_color(id: number, color: Color): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);

            return;
        }
        this.lines_hash.get(id)!.color = color;
        this.storage.set_color(`line[${id}].color`, color);
        this.update_observers(MapStateChange.LINES);
    }

    public update_line_storage(line: Line): void {
        const id = line.get_id();
        this.storage.set_int(`line[${id}].marker1`, line.marker1);
        this.storage.set_int(`line[${id}].marker2`, line.marker2);
        this.storage.set_color(`line[${id}].color`, line.color);
    }

    public get_line_ids_string(): string {
        return this.lines.map((line: Line): string => String(line.get_id())).join(";");
    }

    public reorder_lines(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this.lines.splice(new_index, 0, this.lines.splice(old_index, 1)[0]);
        this.storage.set("lines", this.get_line_ids_string());
    }

    public show_line(line: Line): void {
        const marker1 = this.get_marker(line.marker1);
        const marker2 = this.get_marker(line.marker2);

        if (marker1 !== null) {
            if (marker2 !== null && line.marker1 !== line.marker2) {
                const distance_bearing = marker1.coordinates.distance_bearing(marker2.coordinates);
                const center = marker1.coordinates.project(
                    distance_bearing.bearing,
                    distance_bearing.distance * 0.5,
                );
                this.set_center(center);
            } else {
                this.set_center(marker1.coordinates);
            }
        } else if (marker2 !== null) {
            this.set_center(marker2.coordinates);
        } else {
            // Nothing
        }
    }

    public set_coordinates_format(coordinates_format: CoordinatesFormat) : void {
        this.settings_coordinates_format = coordinates_format;
        this.storage.set(
            "settings.coordinates_format",
            this.settings_coordinates_format,
        );
        this.update_observers(MapStateChange.MARKERS)
    }

    public set_default_marker_settings(settings: IMarkerSettingsDict): void {
        this.settings_coordinates_format = settings.coordinates_format;
        this.storage.set(
            "settings.coordinates_format",
            this.settings_coordinates_format,
        );

        this.settings_marker_random_color = settings.random_color;
        this.storage.set_bool("settings.marker.random_color", this.settings_marker_random_color);

        this.settings_marker_color = settings.color;
        this.storage.set_color("settings.marker.color", this.settings_marker_color);

        this.settings_marker_radius = settings.radius;
        this.storage.set_float("settings.marker.radius", this.settings_marker_radius);

        this.settings_marker_filled = settings.filled;
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);

        this.update_observers(MapStateChange.MARKERS);
    }

    public set_draggable_markers(value: boolean): void {
        this.settings_marker_draggable = value;
        this.storage.set_bool("settings.marker.draggable", this.settings_marker_draggable);
        this.update_observers(MapStateChange.MARKERS);
    }

    public draggable_markers(): boolean {
        return this.settings_marker_draggable;
    }

    public set_filled_markers(value: boolean): void {
        this.settings_marker_filled = value;
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);
        this.update_observers(MapStateChange.MARKERS);
    }

    public filled_markers(): boolean {
        return this.settings_marker_filled;
    }

    public set_distance_unit(distance_unit: DistanceUnit) : void {
        this.settings_distance_unit = distance_unit;
        this.storage.set("settings.distance_unit", this.settings_distance_unit);
        this.update_observers(MapStateChange.LINES);
    }

    public set_default_line_settings(settings: ILineSettingsDict): void {
        this.settings_line_random_color = settings.random_color;
        this.storage.set_bool("settings.line.random_color", this.settings_line_random_color);

        this.settings_line_color = settings.color;
        this.storage.set_color("settings.line.color", this.settings_line_color);

        this.update_observers(MapStateChange.LINES);
    }

    public set_display_distance(d: boolean): void {
        this.settings_line_display_distance = d;
        this.storage.set_bool("settings.line.display_distance", this.settings_line_display_distance);

        this.update_observers(MapStateChange.LINES);
    }

    public to_gpx(): string {
        const data: string[] = [];
        data.push('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>');
        data.push('<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns="http://www.topografix.com/GPX/1/1" creator="Flopp\'s Map - http://flopp.net/" xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd  http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www.garmin.com/xmlschemas/WaypointExtensionv1.xsd" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">');
        data.push("    <metadata>");
        data.push("        <name>Export from Flopp's Map (flopp.net)</name>");
        data.push("    </metadata>");

        this.markers.forEach((marker: Marker): void => {
            data.push(marker.to_gpx());
        });

        this.lines.forEach((line: Line): void => {
            data.push(line.to_gpx(this));
        });

        data.push("</gpx>");

        return data.join("\n");
    }

    public from_gpx(data: string, clear: boolean): void {
        let xml: null|Document = null;
        try {
            const parser = new DOMParser();
            xml = parser.parseFromString(data, "text/xml");
        } catch(e) {
            this.app.message_error(this.app.translate("sidebar.tools.import-gpx-bad-file"));

            return;
        }

        const markerIdMap = new Map<number, number>();
        markerIdMap.set(-1, -1);

        const markers: Marker[] = [];
        let badWaypoints = 0;
        const waypoints: Element[] = Array.from(xml.getElementsByTagName("wpt"));
        waypoints.forEach((waypoint: Element, index: number): void => {
            let name = "";
            let color: Color|null = null;
            let radius = 0;

            const nameEl = waypoint.getElementsByTagName("name");
            if (nameEl.length > 0 && nameEl[0].textContent !== null) {
                name = nameEl[0].textContent;
            }
            name = name.trim();
            if (name.length === 0) {
                name = `GPX WAYPOINT ${index}`;
            }
            
            const descEl = waypoint.getElementsByTagName("desc");
            if (descEl.length > 0 && descEl[0].textContent !== null) {
                [...descEl[0].textContent.matchAll(/color="([^"]+)"/g)].forEach((match: string[]): void => {
                    const c = Color.from_string(match[1]);
                    if (c !== null) {
                        color = c;
                    }
                });
            }

            const radiusEl = waypoint.getElementsByTagName("wptx1:Proximity");
            if (radiusEl.length > 0 && radiusEl[0].textContent !== null) {
                const r = parse_float(radiusEl[0].textContent);
                if (r !== null && r >= 0) {
                    radius = r;
                }
            }

            const latS = waypoint.getAttribute("lat");
            if (latS === null) {
                badWaypoints += 1;

                return;
            }
            const lat = parse_float(latS);
            if (lat === null || lat < -90 || lat > 90) {
                badWaypoints += 1;

                return;
            }
            const lonS = waypoint.getAttribute("lon");
            if (lonS === null) {
                badWaypoints += 1;

                return;
            }
            const lon = parse_float(lonS);
            if (lon === null) {
                badWaypoints += 1;

                return;
            }

            const marker = new Marker(new Coordinates(lat, lon));
            if (color !== null) {
                marker.color = color;
            } else if (!this.settings_marker_random_color) {
                marker.color = this.settings_marker_color;
            }
            if (clear) {
                marker.marker_id = markers.length;
            }
            markerIdMap.set(markers.length, marker.marker_id);
            marker.name = name;
            marker.radius = radius;
            markers.push(marker);
        });
        
        const lines: Line[] = [];
        let badLines = 0;
        Array.from(xml.getElementsByTagName("trk")).forEach((trk: Element, index: number): void => {
            let name = "";
            const nameEl = trk.getElementsByTagName("name");
            if (nameEl.length > 0 && nameEl[0].textContent !== null) {
                name = nameEl[0].textContent;
            }
            const m = name.match(/^\s*LINE:(-1|\d+):(-1|\d+):([0-9a-f]{6})\s*$/i);
            if (m === null) {
                badLines += 1;
                
                return;
            }
            
            const m1 = parse_int(m[1]);
            const m2 = parse_int(m[2]);
            if (m1 === null || !markerIdMap.has(m1) ||
            m2 === null || !markerIdMap.has(m2)) {
                badLines += 1;
                
                return;
            }
            
            const line = new Line(markerIdMap.get(m1)!, markerIdMap.get(m2)!);
            if (clear) {
                line.line_id = lines.length;
            }
            line.color = Color.from_string(m[3])!;
            lines.push(line);
        });
        this.app.message(this.app.translate("sidebar.tools.import-gpx-markers", `${markers.length}`, `${lines.length}`, `${badWaypoints}`, `${badLines}`));

        if (clear) {
            this.delete_all_lines();
            this.delete_all_markers();
        }

        markers.forEach((marker: Marker): void => {
            this.markers.push(marker);
            this.markers_hash.set(marker.get_id(), marker);
            this.update_marker_storage(marker);
        });
        if (clear) {
            Marker.reset_ids(markers.length);
        }
        this.storage.set("markers", this.get_marker_ids_string());

        lines.forEach((line: Line): void => {
            this.lines.push(line);
            this.lines_hash.set(line.get_id(), line);
            this.update_line_storage(line);
        });
        if (clear) {
            Line.reset_ids(lines.length);
        }
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES | MapStateChange.MARKERS);

        this.app.leaflet.fit_objects();
    }

    public to_json(): object {
        const data = {
            maptype: this.map_type,
            center: this.center!.to_string_DEC(),
            zoom: this.zoom,
            german_npa: this.german_npa,
            settings: {
                coordinates_format: this.settings_coordinates_format,
                distance_unit: this.settings_distance_unit,
                markers: {
                    random_color: this.settings_marker_random_color,
                    color: this.settings_marker_color.to_hash_string(),
                    radius: this.settings_marker_radius,
                    draggable: this.settings_marker_draggable,
                    filled: this.settings_marker_filled,
                },
                lines: {
                    random_color: this.settings_line_random_color,
                    color: this.settings_line_color.to_hash_string(),
                    display_distance: this.settings_line_display_distance,
                },
            },
            markers: [] as IMarkerJson[],
            lines: [] as ILineJson[],
        };

        this.markers.forEach((marker: Marker): void => {
            data.markers.push(marker.to_json());
        });
        this.lines.forEach((line: Line): void => {
            data.lines.push(line.to_json());
        });

        return data;
    }

    public from_json(data: any): void {
        if ("maptype" in data) {
            const map_type = string2maptype(data.maptype);
            if (map_type !== null) {
                this.map_type = map_type;
            }
        }
        if ("zoom" in data) {
            const zoom = parseInt(data.zoom, 10);
            this.zoom = zoom;
        }
        if ("center" in data) {
            const center = Coordinates.from_string(data.center);
            if (center !== null) {
                this.center = center;
            }
        }

        if ("german_npa" in data) {
            this.german_npa = data.german_npa;
        }

        if ("settings" in data) {
            if ("coordinates_format" in data.settings) {
                this.settings_coordinates_format = parseCoordinatesFormat(
                    data.settings.coordinates_format,
                    this.settings_coordinates_format,
                );
            }
            if ("distance_unit" in data.settings) {
                this.settings_distance_unit = parseDistanceFormat(
                    data.settings.distance_unit,
                    this.settings_distance_unit,
                );
            }
            if ("markers" in data.settings) {
                if ("random_color" in data.settings.markers) {
                    this.settings_marker_random_color = data.settings.markers.random_color;
                }
                if ("color" in data.settings.markers) {
                    const color = Color.from_string(data.settings.markers.color);
                    if (color !== null) {
                        this.settings_marker_color = color;
                    }
                }
                if ("radius" in data.settings.markers) {
                    const radius = parse_float(data.settings.markers.radius);
                    if (radius !== null) {
                        this.settings_marker_radius = radius;
                    }
                }
                if ("draggable" in data.settings.markers) {
                    this.settings_marker_draggable = data.settings.markers.draggable;
                }
                if ("filled" in data.settings.markers) {
                    this.settings_marker_filled = data.settings.markers.filled;
                }
            }
            if ("lines" in data.settings) {
                if ("random_color" in data.settings.lines) {
                    this.settings_line_random_color = data.settings.lines.random_color;
                }
                if ("color" in data.settings.lines) {
                    const color = Color.from_string(data.settings.lines.color);
                    if (color !== null) {
                        this.settings_line_color = color;
                    }
                }
                if ("display_distance" in data.settings.lines) {
                    this.settings_line_display_distance = data.settings.lines.display_distance;
                }
            }
        }

        const marker_ids: Map<number, number> = new Map();
        if ("markers" in data && Array.isArray(data.markers)) {
            this.markers = [];
            this.markers_hash.clear();
            Marker.reset_ids();
            data.markers.forEach((m: any): void => {
                let id = null;
                let coordinates = null;
                let name = null;
                let color = null;
                let radius = null;
                if ("marker_id" in m) {
                    id = parseInt(m.marker_id, 10);
                }
                if ("coordinates" in m) {
                    coordinates = Coordinates.from_string(m.coordinates);
                }
                if ("name" in m) {
                    name = String(m.name);
                }
                if ("color" in m) {
                    color = Color.from_string(m.color);
                }
                if ("radius" in m) {
                    radius = parseFloat(m.radius);
                }

                if (coordinates !== null) {
                    const marker = new Marker(coordinates);
                    this.markers.push(marker);
                    this.markers_hash.set(marker.get_id(), marker);
                    if (id !== null) {
                        marker_ids.set(id, marker.get_id());
                    }

                    if (name !== null) {
                        marker.name = name;
                    }
                    if (color !== null) {
                        marker.color = color;
                    }
                    if (radius !== null) {
                        marker.radius = radius;
                    }
                }
            });
        }

        if ("lines" in data && Array.isArray(data.lines)) {
            this.lines = [];
            this.lines_hash.clear();
            Line.reset_ids();
            data.lines.forEach((l: any): void => {
                let old_marker1 = -1;
                let old_marker2 = -1;
                let color = null;
                if ("marker1" in l) {
                    old_marker1 = parseInt(l.marker1, 10);
                }
                if ("marker2" in l) {
                    old_marker2 = parseInt(l.marker2, 10);
                }
                if ("color" in l) {
                    color = Color.from_string(l.color);
                }

                let marker1 = -1;
                if (marker_ids.has(old_marker1)) {
                    marker1 = marker_ids.get(old_marker1)!;
                }

                let marker2 = -1;
                if (marker_ids.has(old_marker2)) {
                    marker2 = marker_ids.get(old_marker2)!;
                }

                const line = new Line(marker1, marker2);
                if (color !== null) {
                    line.color = color;
                }

                this.lines.push(line);
                this.lines_hash.set(line.get_id(), line);
            });
        }

        this.store();
        this.update_observers(MapStateChange.EVERYTHING);
    }
}
