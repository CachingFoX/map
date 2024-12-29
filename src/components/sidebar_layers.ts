import {App} from "./app";
import {MapStateChange} from "./map_state";
import {MapType, maptype2human, maptype2string, string2maptype} from "./map_type";
import {SidebarItem} from "./sidebar_item";

interface IBaseLayerDict {
    type: MapType;
    option: HTMLOptionElement | null;
}

export class SidebarLayers extends SidebarItem {
    private readonly base_layers: IBaseLayerDict[];
    private readonly base_layer_select: HTMLSelectElement;
    private readonly german_npa_checkbox: HTMLInputElement;

    public constructor(app: App, id: string) {
        super(app, id);

        this.base_layers = [
            {type: MapType.OPENSTREETMAP, option: null},
            {type: MapType.OPENTOPOMAP, option: null},
            {type: MapType.STAMEN_TERRAIN, option: null},
            {type: MapType.HUMANITARIAN, option: null},
            {type: MapType.ARCGIS_WORLDIMAGERY, option: null},
            {type: MapType.ARCGIS_WORLDIMAGERY_OVERLAY, option: null},
            {type: MapType.GOOGLE_MAPS, option: null},
            {type: MapType.GOOGLE_SATELLITE, option: null},
            {type: MapType.GOOGLE_HYBRID, option: null},
        ];

        this.base_layer_select = this._div.querySelector("[data-base-layer]")!;
        this.base_layers.forEach((base_layer: IBaseLayerDict): void => {
            base_layer.option = new Option(
                maptype2human(base_layer.type),
                maptype2string(base_layer.type),
                false,
                base_layer.type === this.app.map_state.map_type,
            );
            this.base_layer_select.append(base_layer.option);
        });
        this.base_layer_select.onchange = (): void => {
            app.switch_map(string2maptype(this.base_layer_select.value));
        };

        this.german_npa_checkbox = this._div.querySelector("[data-german-npa-layer]")!;
        this.german_npa_checkbox.checked = this.app.map_state.german_npa;
        this.german_npa_checkbox.onchange = (): void => {
            this.app.map_state.set_german_npa(this.german_npa_checkbox.checked);
        };
    }

    public update_state(changes: number, _marker_id: number = -1): void {
        if ((changes & MapStateChange.MAPTYPE) === MapStateChange.NOTHING) {
            return;
        }
        if (this.app.map_state.map_type === null) {
            return;
        }

        /* base_layer */
        this.base_layer_select.value = maptype2string(this.app.map_state.map_type);
    }
}
