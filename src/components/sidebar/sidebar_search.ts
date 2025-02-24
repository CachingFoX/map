import {App} from "../app";
import {Coordinates} from "../coordinates";
import Handlebars from "handlebars";
import {MapStateChange} from "../map_state";
import {SidebarItem} from "./sidebar_item";
import { create_element } from "../utilities";
import {INameCoordinates, NominationSearch, Search, CoordinateSearch } from "./search";


export class SidebarSearch extends SidebarItem {
    private readonly result_item_template : any;
    private readonly search_results : HTMLElement;
    private readonly result_counter : HTMLDivElement;
    private moreResultsButton : HTMLDivElement;
    private readonly noResultsText : HTMLDivElement;
    private actual_search : Search|null;

    public constructor(app: App, id: string) {
        super(app, id, "https://blog.flopp.net/the-search-sidebar/");

        document.querySelector("#btn-locate")!.addEventListener("click", (): void => {
            this.app.locate_me();
        });
        document.querySelector("#btn-search")!.addEventListener("click", (): void => {
            this.perform_search();
        });
        document
            .querySelector("#input-search")!
            .addEventListener("keyup", (event: KeyboardEvent): void => {
                if (event.key === "Enter") {
                    this.perform_search();
                }
            });

        const source = (document.getElementById("result-item") as HTMLScriptElement).innerHTML;
        this.result_item_template = Handlebars.compile(source);

        this.search_results = document.querySelector("#search-results") as HTMLDivElement;
        this.result_counter = document.querySelector("#sidebar-search-result-counter") as HTMLDivElement;

        this.actual_search = null;
        this.moreResultsButton = document.querySelector("#sidebar-search-more-results") as HTMLDivElement;
        this.moreResultsButton.addEventListener("click", (): void => {
            if (!this.actual_search) {
                return;
            }
            this.xsearch(this.actual_search);
        });
        this.noResultsText = document.querySelector("#sidebar-search-no-results") as HTMLDivElement;

        this.display_results(null, 0, 0);
    }

    public update_state(changes: number, _marker_id: number = -1): void {
        return
    }

    public display_results(search : Search | null, startIndex : number, count: number): void {
        if (!search) {
            this.noResultsText.classList.add("is-hidden");
            this.moreResultsButton.classList.add("is-hidden");
            this.search_results.classList.add("is-hidden");
            this.result_counter.classList.add("is-hidden");
            this.search_results.innerHTML = "";
            return;
        }

        if (search.count_results() == 0) {
            this.noResultsText.classList.remove("is-hidden");
            this.moreResultsButton.classList.add("is-hidden");
            this.search_results.classList.add("is-hidden");
            this.result_counter.classList.add("is-hidden");
            this.search_results.innerHTML = "";
            return;
        }

        this.noResultsText.classList.add("is-hidden");

        // -- extend result list
        var results = search.get_results(startIndex, count);        
        results.forEach((result: INameCoordinates) => {
            const item = create_element("div");
            this.search_results.append(item);
            item.addEventListener("click", (): void => {
                this.app.map_state.set_center(result.coordinates);
            });
            item.innerHTML = this.result_item_template(result);
        });
        this.search_results.classList.remove("is-hidden");

        // -- update more button
        if (search.more_results()) {
            this.moreResultsButton.classList.remove("is-hidden");
        }
        
        // -- update counter
        if (search.count_results() > 1) {
            var text = "";
            if (search.count_results() == search.total_results()) {
                text = this.app.translate("sidebar.search.result-counter-x")
            } else {
                text = this.app.translate("sidebar.search.result-counter-x-of-y");
            }
            text = text.replace("$1", String(search.count_results()));
            text = text.replace("$2", String(search.total_results()));
            this.result_counter.innerText =  text;
            this.result_counter.classList.remove("is-hidden");
        }


        if (startIndex == 0) {
            this.app.map_state.set_center(results[0].coordinates);
        }
    }

    public perform_search(): void {

        // clean result list
        this.display_results(null, 0, 0);

        var location_string = (document.querySelector(
            "#input-search",
        ) as HTMLInputElement).value.trim();
        if (location_string.length === 0) {
            return;
        }

        // Try to parse "location_string" as coordinates
        const coordinates = Coordinates.from_string(location_string);
        
        if (coordinates !== null) {
            this.actual_search = new CoordinateSearch(coordinates, 
                                                        this.app.map_state.settings_coordinates_format, 
                                                        this.app.translate("sidebar.markers.edit_coordinates_placeholder"),
                                                        location_string);
        } else {
            this.actual_search = new NominationSearch(location_string, this.app.map_state.language);
        }

        this.xsearch(this.actual_search)
    }

    public xsearch(search : Search) : void {
        var caller = this;
        this.actual_search = search;

        search.perform_search(
            function(search, startIndex, count) {
                if (!count) {
                    caller.app.message_error(caller.app.translate("search.no-result"));
                }
                caller.display_results(search, startIndex, count);
            },
            function(message) {
                caller.app.message_error(caller.app.translate("search.server-error", message));
                caller.display_results(null, 0, 0);
            }
        )
    }
}
