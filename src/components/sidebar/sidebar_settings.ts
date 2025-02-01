import {App} from "../app";
import {MapState, MapStateChange} from "../map_state";
import {SidebarItem} from "./sidebar_item";
import {create_element,create_color_palette} from "../utilities";
import {CoordinatesFormat, parseCoordinatesFormat} from "../coordinates";
import {Distance, DistanceUnit, parseDistanceFormat} from "../distance";
import { ColorPalette } from "../color_palette";


interface ICoordinatesFormatDict {
    id: string;
    name: string;
}

interface IDistanceFormatDict {
    id: DistanceUnit;
    name: string;
}

export class SidebarSettings extends SidebarItem {
    private readonly language_select: HTMLInputElement;
    private readonly coordinates_format_select: HTMLInputElement;
    private readonly units_format_select: HTMLInputElement;
    private readonly centerField: HTMLParagraphElement;
    private readonly distanceField: HTMLParagraphElement;
    private colorpalette_marker : ColorPalette;
    private colorpalette_line : ColorPalette;
    private marker_color_palette : HTMLDivElement;
    private marker_random_color : HTMLInputElement;
    private marker_filled : HTMLInputElement;
    private marker_radius : HTMLInputElement;
    private line_color_palette : HTMLDivElement;
    private line_random_color : HTMLInputElement;
    private line_display_distance : HTMLInputElement;


    public constructor(app: App, id: string) {
        super(app, id);

        this.language_select = this._div.querySelector("[data-language]")!;

        interface ITitleShort {
            title: string;
            short: string;
        }

        [
            {title: "English", short: "en"},
            {title: "Deutsch", short: "de"},
            {title: "Français", short: "fr"},
        ].forEach((language: ITitleShort): void => {
            this.language_select.append(
                new Option(
                    language.title,
                    language.short,
                    language.short === "en",
                    language.short === this.app.map_state.language,
                ),
            );
        });
        this.language_select.onchange = (): void => {
            this.app.map_state.set_language(this.language_select.value);
        };

        this.coordinates_format_select = this._div.querySelector("[data-coordinates-format]")!;
        [
            {id: CoordinatesFormat.DEC, name: "H DDD.DDDDDD°"},
            {id: CoordinatesFormat.DMM, name: "H DDD° MM.MMM'"},
            {id: CoordinatesFormat.DMS, name: "H DDD° MM' SS.SS\""},
        ].forEach((item: ICoordinatesFormatDict): void => {
            this.coordinates_format_select.append(
                new Option(
                    item.name,
                    item.id,
                    item.id === CoordinatesFormat.DMM,
                    item.id === this.app.map_state.settings_coordinates_format,
                ),
            );
        });
        this.coordinates_format_select.onchange = (): void => {
            this.app.map_state.set_coordinates_format(
                parseCoordinatesFormat(this.coordinates_format_select.value, CoordinatesFormat.DMM)
            );
        };

        this.units_format_select = this._div.querySelector("[data-distance-format]")!;
        [
            {id: DistanceUnit.m, name: "m"},
            {id: DistanceUnit.km, name: "km"},
            {id: DistanceUnit.ft, name: "ft"},
            {id: DistanceUnit.mi, name: "mi"},
        ].forEach((item: IDistanceFormatDict): void => {
            this.units_format_select.append(
                new Option(
                    item.name,
                    item.id,
                    item.id === DistanceUnit.m,
                    item.id === this.app.map_state.settings_distance_unit,
                ),
            );
        });
        this.units_format_select.onchange = (): void => {
            this.app.map_state.set_distance_unit(parseDistanceFormat(this.units_format_select.value, DistanceUnit.m))
        };

        this.centerField = this._div.querySelector("#sidebar-settings-center")!;
        this.distanceField = this._div.querySelector("#sidebar-settings-distance")!;

        this.marker_color_palette = this._div.querySelector("#color-palette")!;

        this.colorpalette_marker = new ColorPalette(this.marker_color_palette,
                                            this.app.map_state.settings_marker_color,
                                            (color) => {
                                                this.app.map_state.set_default_marker_settings({
                                                    random_color: this.app.map_state.settings_marker_random_color,
                                                    color: color,
                                                    radius: this.app.map_state.settings_marker_radius,
                                                    filled: this.app.map_state.settings_marker_filled
                                                });
                                            });

        this.marker_random_color = this._div.querySelector("[data-marker-random-color]")!;
        this.marker_random_color.checked = this.app.map_state.settings_marker_random_color;
        this.marker_random_color.onchange = (): void => {
            this.app.map_state.set_default_marker_settings({
                random_color: this.marker_random_color.checked,
                color: this.app.map_state.settings_marker_color,
                radius: this.app.map_state.settings_marker_radius,
                filled: this.app.map_state.settings_marker_filled
            });
            if (this.marker_random_color.checked) {
                this.marker_color_palette.style.display = "none";
            } else {
                this.marker_color_palette.style.display = "block";
            }
        };
        if (this.marker_random_color.checked) {
            this.marker_color_palette.style.display = "none";
        } else {
            this.marker_color_palette.style.display = "block";
        }

        this.marker_radius = this._div.querySelector("[data-marker-radius]")!;
        this.marker_radius.value = String(this.app.map_state.settings_marker_radius);
        this.marker_radius.onchange = () : void => {
            var radius = 0
            if (this.marker_radius.value != "") {
                radius = Number(this.marker_radius.value) 
                if (radius === null || Number.isNaN(radius)) {
                    this.app.message_error(
                        this.app.translate("dialog.marker-settings.bad_values_message"),
                    );
                    return;
                }
            }
            this.app.map_state.set_default_marker_settings({
                random_color: this.app.map_state.settings_marker_random_color,
                color: this.app.map_state.settings_marker_color,
                radius: radius,
                filled: this.app.map_state.settings_marker_filled
            });
        }

        this.marker_filled = this._div.querySelector("[data-marker-filled]")!;
        this.marker_filled.checked = this.app.map_state.settings_marker_filled;
        this.marker_filled.onchange = () : void => {
            this.app.map_state.set_default_marker_settings({
                random_color: this.app.map_state.settings_marker_random_color,
                color: this.app.map_state.settings_marker_color,
                radius: this.app.map_state.settings_marker_radius,
                filled: this.marker_filled.checked
            });
        }

        this.line_color_palette = this._div.querySelector("#color-palette-line")!;

        this.colorpalette_line = new ColorPalette(this.line_color_palette,
                                        this.app.map_state.settings_line_color,
                                        (color) => {
                                            this.app.map_state.set_default_line_settings({
                                                random_color: this.app.map_state.settings_line_random_color,
                                                color: color
                                            });
                                        });

        this.line_random_color = this._div.querySelector("[data-line-random-color]")!;
        this.line_random_color.checked = this.app.map_state.settings_line_random_color;
        this.line_random_color.onchange = (): void => {
            this.app.map_state.set_default_line_settings({
                random_color: this.line_random_color.checked,
                color: this.app.map_state.settings_line_color
            });
            if (this.line_random_color.checked) {
                this.line_color_palette.style.display = "none";
            } else {
                this.line_color_palette.style.display = "block";
            }
        };
        if (this.line_random_color.checked) {
            this.line_color_palette.style.display = "none";
        } else {
            this.line_color_palette.style.display = "block";
        }

        this.line_display_distance = this._div.querySelector("[data-line-display-distance]")!;
        this.line_display_distance.checked = this.app.map_state.settings_line_display_distance;
        this.line_display_distance.onchange = (): void => {
            this.app.map_state.set_display_distance(this.line_display_distance.checked);
        };
    }

    public update_state(changes: number, _marker_id: number = -1): void {
        console.log(changes, _marker_id);
        // if ((changes & (MapStateChange.MARKERS | MapStateChange.LINES | MapStateChange.CENTER | MapStateChange.LANGUAGE)) === MapStateChange.NOTHING) {
        //    return;
        // }

        // language
        if (changes & MapStateChange.LANGUAGE) {
            this.language_select.value = this.app.map_state.language;
        }
        
        // coordinates format
        if (changes & (MapStateChange.MARKERS | MapStateChange.CENTER)) {
            this.coordinates_format_select.value = this.app.map_state.settings_coordinates_format;
            // show an example of current selected coordinates format
            this.centerField.innerText =
                (this.app.map_state.center === null) ?
                "n/a" :
                this.app.map_state.center.to_string(this.app.map_state.settings_coordinates_format);
        }

        // distance unit
        if (changes & (MapStateChange.LINES | MapStateChange.CENTER | MapStateChange.ZOOM)) {
            this.units_format_select.value = this.app.map_state.settings_distance_unit;
            // show an example for the current selected distance unit
            var d = this.app.leaflet.distance_swne();
            var diagonal = `${d.to_string(this.app.map_state.settings_distance_unit)}`

            if (this.app.map_state.settings_distance_unit != DistanceUnit.m && this.app.map_state.settings_distance_unit != DistanceUnit.km) {
                var metric = d.to_string(DistanceUnit.m);
                if (d.m() >= 100000) {
                    metric = d.to_string(DistanceUnit.km)
                }
                diagonal += ` (${metric})` 
            }
            this.distanceField.innerText = diagonal
            
        }        
    }

}
