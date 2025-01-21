import {App} from "../app";
import {MapState, MapStateChange} from "../map_state";
import {SidebarItem} from "./sidebar_item";
import {create_element} from "../utilities";
import {CoordinatesFormat, parseCoordinatesFormat} from "../coordinates";
import {Distance, DistanceUnit, parseDistanceFormat} from "../distance";

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
