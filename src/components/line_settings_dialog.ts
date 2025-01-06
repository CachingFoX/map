import {App} from "./app";
import {Color} from "./color";
import {Dialog} from "./dialog";
import {DistanceUnit, parseDistanceFormat} from "./distance";

interface IDistanceFormatDict {
    id: DistanceUnit;
    name: string;
}

export class LineSettingsDialog extends Dialog {
    private readonly _distanceFormatInput: HTMLInputElement;
    private readonly _randomColorInput: HTMLInputElement;
    private readonly _colorInput: HTMLInputElement;
    private readonly _displayDistance: HTMLInputElement;

    public constructor(app: App) {
        super("line-settings-dialog", app);

        this._distanceFormatInput = this._div.querySelector("[data-distance-format]")!;
        this._randomColorInput = this._div.querySelector("[data-random-color]")!;
        this._colorInput = this._div.querySelector("[data-color]")!;
        this._displayDistance = this._div.querySelector("[data-display-distance]")!;

        [
            {id: DistanceUnit.m, name: "m"},
            {id: DistanceUnit.km, name: "km"},
            {id: DistanceUnit.ft, name: "ft"},
            {id: DistanceUnit.mi, name: "mi"},
        ].forEach((item: IDistanceFormatDict): void => {
            this._distanceFormatInput.append(
                new Option(
                    item.name,
                    item.id,
                    item.id === DistanceUnit.m,
                    item.id === this._app.map_state.settings_distance_unit,
                ),
            );
        });
    }

    public show(): void {
        this._distanceFormatInput.value = this._app.map_state.settings_distance_unit;
        this._randomColorInput.checked = this._app.map_state.settings_line_random_color;
        this._colorInput.value = this._app.map_state.settings_line_color.to_hash_string();
        this._displayDistance.checked = this._app.map_state.settings_line_display_distance;

        super.show();
    }

    public ok(): void {
        const distance_unit = parseDistanceFormat(
            this._distanceFormatInput.value,
            DistanceUnit.m,
        );
        const random_color = this._randomColorInput.checked;
        const color = Color.from_string(this._colorInput.value);
        if (color === null) {
            this._app.message_error(this._app.translate("dialog.line-settings.bad_values_message"));

            return;
        }

        this._app.map_state.set_default_line_settings({
            distance_unit: distance_unit,
            random_color,
            color,
        });

        this._app.map_state.set_display_distance(this._displayDistance.checked);

        this.hide();
    }
}
