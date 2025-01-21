import {App} from "../app";
import {Color} from "../color";
import {Dialog} from "./dialog";
import {DistanceUnit, parseDistanceFormat} from "../distance";

interface IDistanceFormatDict {
    id: DistanceUnit;
    name: string;
}

export class LineSettingsDialog extends Dialog {
    private readonly _randomColorInput: HTMLInputElement;
    private readonly _colorInput: HTMLInputElement;
    private readonly _displayDistance: HTMLInputElement;

    public constructor(app: App) {
        super("line-settings-dialog", app);

        this._randomColorInput = this._div.querySelector("[data-random-color]")!;
        this._colorInput = this._div.querySelector("[data-color]")!;
        this._displayDistance = this._div.querySelector("[data-display-distance]")!;
    }

    public show(): void {
        this._randomColorInput.checked = this._app.map_state.settings_line_random_color;
        this._colorInput.value = this._app.map_state.settings_line_color.to_hash_string();
        this._displayDistance.checked = this._app.map_state.settings_line_display_distance;

        super.show();
    }

    public ok(): void {
        const random_color = this._randomColorInput.checked;
        const color = Color.from_string(this._colorInput.value);
        if (color === null) {
            this._app.message_error(this._app.translate("dialog.line-settings.bad_values_message"));

            return;
        }

        this._app.map_state.set_default_line_settings({
            random_color,
            color,
        });

        this._app.map_state.set_display_distance(this._displayDistance.checked);

        this.hide();
    }
}
