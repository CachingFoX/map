import {App} from "../app";
import {Color} from "../color";
import {Dialog} from "./dialog";
import {parse_float} from "../utilities";


export class MarkerSettingsDialog extends Dialog {
    public constructor(app: App) {
        super("marker-settings-dialog", app);
    }

    public show(): void {
        const random_input = this._div.querySelector("[data-random-color]") as HTMLInputElement;
        const color_input = this._div.querySelector("[data-color]") as HTMLInputElement;
        const radius_input = this._div.querySelector("[data-radius]") as HTMLInputElement;
        const filled_input = this._div.querySelector("[data-filled]") as HTMLInputElement;
        
        random_input.checked = this._app.map_state.settings_marker_random_color;
        color_input.value = this._app.map_state.settings_marker_color.to_hash_string();
        radius_input.value = String(this._app.map_state.settings_marker_radius);
        filled_input.checked = this._app.map_state.settings_marker_filled;

        super.show();
    }

    public ok(): void {
        const random_input = this._div.querySelector("[data-random-color]") as HTMLInputElement;
        const color_input = this._div.querySelector("[data-color]") as HTMLInputElement;
        const radius_input = this._div.querySelector("[data-radius]") as HTMLInputElement;
        const filled_input = this._div.querySelector("[data-filled]") as HTMLInputElement;

        const random_color = random_input.checked;
        const color = Color.from_string(color_input.value);
        const radius = parse_float(radius_input.value);
        const filled = filled_input.checked;
        if (color === null || radius === null) {
            this._app.message_error(
                this._app.translate("dialog.marker-settings.bad_values_message"),
            );

            return;
        }

        this._app.map_state.set_default_marker_settings({
            random_color,
            color,
            radius,
            filled,
        });

        this.hide();
    }
}
