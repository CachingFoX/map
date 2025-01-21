import {Coordinates} from "./coordinates";
import {IconFactory} from "./icon_factory";
import {Language} from "./language";
import {LeafletWrapper} from "./leaflet_wrapper";
import {LinkDialog} from "./dialog/link_dialog";
import {MapMenu} from "./map_menu";
import {MapState, MapStateChange} from "./map_state";
import {MapType} from "./map_type";
import {Marker} from "./marker";
import {MultiMarkersDialog} from "./dialog/multi_markers_dialog";
import {NewsDialog} from "./dialog/news_dialog";
import {Notifications} from "./notifications";
import {ProjectionDialog} from "./dialog/projection_dialog";
import {Sidebar} from "./sidebar/sidebar";
import {VersionCheck} from "./version_check";

export class App {
    private readonly _lang: Language | null = null;
    private readonly notifications: Notifications;

    public map_state: MapState;
    public icon_factory: IconFactory;
    public projection_dialog: ProjectionDialog;
    public multi_markers_dialog: MultiMarkersDialog;
    public link_dialog: LinkDialog;
    public map_menu: MapMenu;
    public sidebar: Sidebar;
    public leaflet: LeafletWrapper;
    public news_dialog: NewsDialog;
    public version_check: VersionCheck;

    public constructor(id_leaflet: string) {
        this.notifications = new Notifications();

        this.map_state = new MapState(this);

        this._lang = new Language(this);

        this.map_state.restore_from_url();
        this.map_state.restore();
        this.map_state.clear_storage();

        this.icon_factory = new IconFactory();
        this.projection_dialog = new ProjectionDialog(this);
        this.multi_markers_dialog = new MultiMarkersDialog(this);
        this.link_dialog = new LinkDialog(this);
        this.map_menu = new MapMenu(this);
        this.news_dialog = new NewsDialog(this);
        this.version_check = new VersionCheck(this);

        this.leaflet = new LeafletWrapper(id_leaflet, this);
        this.leaflet.update_state(MapStateChange.EVERYTHING);
        this.switch_map(this.map_state.map_type);

        this.sidebar = new Sidebar(this);

        this.news_dialog.maybeShow();
    }

    public message(text: string): void {
        this.notifications.message(text, "info");
    }

    public message_error(text: string): void {
        this.notifications.message(text, "danger");
    }

    public switch_map(type: MapType | null): void {
        this.map_state.set_map_type(type);
    }

    public update_geometry(): void {
        this.leaflet.invalidate_size();
    }

    public locate_me(): void {
        // tslint:disable-next-line: strict-boolean-expressions
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location: GeolocationPosition): void => {
                    this.map_state.set_center(
                        new Coordinates(location.coords.latitude, location.coords.longitude),
                    );
                },
                (error: GeolocationPositionError): void => {
                    this.message_error(this.translate("messages.geolocation_error", error.message));
                },
            );
        } else {
            this.message_error(this.translate("messages.geolocation_not_available"));
        }
    }

    public show_projection_dialog(marker: Marker): void {
        this.projection_dialog.showMarker(marker);
    }

    public show_multi_markers_dialog(): void {
        this.multi_markers_dialog.show();
    }

    public show_link_dialog(): void {
        this.link_dialog.show();
    }

    public translate(key: string, ...args: string[]): string {
        if (this._lang === null) {
            return key;
        }

        const translated = this._lang.translate(key);
        let s = translated;
        for (let i: number = 1; i <= args.length; i += 1) {
            const pattern: string = `{${i}}`;
            if (s.indexOf(pattern) >= 0) {
                s = s.replace(pattern, args[i - 1]);
            } else {
                console.log(
                    `App.translate(${key}): cannot find pattern '${pattern}' in '${translated}'`,
                );
            }
        }

        return s;
    }

    public localize(tree: HTMLElement): void {
        if (this._lang !== null) {
            this._lang.localize(tree);
        }
    }

    public copyClipboard(text: string, success_message: string, error_message: string): void {
        navigator.clipboard.writeText(text).then(
            () => {
                this.message(success_message);
            },
            () => {
                this.message_error(error_message);
            },
        );
    }

    public yesNoDialog(title: string, text: string, yes: () => void): void {
        const dialogEl = document.querySelector("#yesno-dialog")!;
        const titleEl = document.querySelector("#yesno-title")!;
        const textEl = document.querySelector("#yesno-text")!;
        let yesButton = (document.querySelector("#yesno-yes") as HTMLButtonElement);
        let noButton = (document.querySelector("#yesno-no") as HTMLButtonElement);
        titleEl.innerHTML = title;
        textEl.innerHTML = text;
        
        // clone button to remove all event listeners, see https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type
        const yesButtonClone = yesButton.cloneNode(true);
        yesButton.parentNode!.replaceChild(yesButtonClone, yesButton);
        yesButton = (document.querySelector("#yesno-yes") as HTMLButtonElement);
        yesButton.addEventListener("click", () => {
            dialogEl.classList.remove("is-active");
            yes();
        });
        const noButtonClone = noButton.cloneNode(true);
        noButton.parentNode!.replaceChild(noButtonClone, noButton);
        noButton = (document.querySelector("#yesno-no") as HTMLButtonElement);
        noButton.addEventListener("click", () => {
            dialogEl.classList.remove("is-active");
        });

        dialogEl.classList.add("is-active");
        yesButton.focus();
    }
}
