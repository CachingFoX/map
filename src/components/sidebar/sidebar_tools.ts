import {App} from "../app";
import {MapStateChange} from "../map_state";
import {SidebarItem} from "./sidebar_item";
import {create_element} from "../utilities";

export class SidebarTools extends SidebarItem {

    public constructor(app: App, id: string) {
        super(app, id);

        interface ITitleShort {
            title: string;
            short: string;
        }

        document.querySelector("#btn-link")!.addEventListener("click", (): void => {
            this.app.show_link_dialog();
        });

        document.querySelector("#btn-export-gpx")!.addEventListener("click", (): void => {
            this.export_gpx();
        });

        document
            .querySelector("#btn-import-gpx")!
            .addEventListener("click", (event: InputEvent): void => {
                (document.querySelector("#inp-import-gpx") as HTMLButtonElement).click();
                event.preventDefault();
            });
        (document.querySelector("#inp-import-gpx") as HTMLInputElement).onchange = (
            event: InputEvent,
        ): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            this.import_gpx(files[0], true);
        };

        document
            .querySelector("#btn-import-gpx-keep")!
            .addEventListener("click", (event: InputEvent): void => {
                (document.querySelector("#inp-import-gpx") as HTMLButtonElement).click();
                event.preventDefault();
            });
        (document.querySelector("#inp-import-gpx") as HTMLInputElement).onchange = (
            event: InputEvent,
        ): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            this.import_gpx(files[0], false);
        };

        document.querySelector("#btn-export-json")!.addEventListener("click", (): void => {
            this.export_json();
        });

        document
            .querySelector("#btn-import-json")!
            .addEventListener("click", (event: InputEvent): void => {
                (document.querySelector("#inp-import-json") as HTMLButtonElement).click();
                event.preventDefault();
            });
        (document.querySelector("#inp-import-json") as HTMLInputElement).onchange = (
            event: InputEvent,
        ): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            this.import_json(files[0]);
        };

        document.querySelector("#btn-multi-markers")!.addEventListener("click", (): void => {
            this.app.show_multi_markers_dialog();
        });
    }

    public update_state(changes: number, _marker_id: number = -1): void {
    }

    public export_gpx(): void {
        const data = this.app.map_state.to_gpx();
        const element = create_element("a", [], {
            href: `data:application/gpx+xml;charset=utf-8,${encodeURIComponent(data)}`,
            download: "map.gpx",
        });
        element.style.display = "none";
        document.body.append(element);
        element.click();
        document.body.removeChild(element);
    }

    public import_gpx(file: File, clear: boolean): void {
        const reader = new FileReader();
        reader.onloadend = (): void => {
            const data = (reader.result as string);
            this.app.map_state.from_gpx(data, clear);
        };
        reader.readAsText(file);

        // Reset file input
        (document.querySelector("#inp-import-gpx") as HTMLInputElement).value = "";
    }

    public export_json(): void {
        const data = JSON.stringify(this.app.map_state.to_json());
        const element = create_element("a", [], {
            href: `data:application/json;charset=utf-8,${encodeURIComponent(data)}`,
            download: "map_state.json",
        });
        element.style.display = "none";
        document.body.append(element);
        element.click();
        document.body.removeChild(element);
    }

    public import_json(file: File): void {
        const reader = new FileReader();
        reader.onloadend = (): void => {
            const data = JSON.parse(reader.result as string);
            this.app.map_state.from_json(data);
            this.app.switch_map(this.app.map_state.map_type);
        };
        reader.readAsText(file);

        // Reset file input
        (document.querySelector("#inp-import-json") as HTMLInputElement).value = "";
    }
}
