import {create_element} from "./utilities";
import {Color} from "./color";

type Callback = (color : Color) => void;

export class ColorPalette {
    private readonly anchor : HTMLDivElement;
    private readonly palette : HTMLDivElement
    private readonly callback : Callback;
    private selected_color: Color;

    public constructor(anchor : HTMLDivElement, selected_color: Color, func : Callback ) {// public constructor(app: App, id: string) {
        this.anchor = anchor;
        this.selected_color = selected_color;
        this.callback = func;

        this.palette = create_element("div", ["colorpalette"]) as HTMLDivElement;
        this.create_color_palette()
        this.anchor.append(this.palette);
    }

    public get_selected_color() : Color {
        return this.selected_color;
    }

    private create_color_pot( color : string, column_span : number ) {
        const color_pot = create_element("div", 
            ["color", "colorpot"]) as HTMLElement;

        color_pot.style.backgroundColor = "#"+color;
        const color_object = Color.from_string(color)
        if (color_object!==null) {
            let luma = color_object.luma()
            color_pot.dataset.luma = String(luma);
            color_pot.classList.add(luma < 130 ? "dark" : "light");
            let basic_luma = Math.floor(luma/16)
            color_pot.dataset.luma = String(luma);
            color_pot.classList.add("luma-"+String(basic_luma));
        }
        color_pot.dataset.color = color;

        if (column_span > 1) {
            color_pot.style.gridColumn = "span "+column_span;
        } 

        this.palette.appendChild(color_pot);
        color_pot.addEventListener("click", 
            (event): void => {
                this.selected_color = color_object!;
                this.mark_selected_color_pot(color)
                // callback
                this.callback(this.selected_color);
            }
        );
    }

    private mark_selected_color_pot( selected_color : string ) : boolean {
        this.palette.dataset.color = selected_color;

        const markerElements = this.palette.querySelectorAll(".selected");
        markerElements.forEach((element) => {
            (element as HTMLElement).classList.remove("selected");
        });
        var pot = this.palette.querySelector("[data-color='"+selected_color+"']");
        if (pot !== null) {
            pot.classList.add("selected");
            return true;
        }
        return false;
    }

    private create_color_palette() {
        Color.palette.forEach((color) => {
            this.create_color_pot(color, 1);
        });

        const selected_color = this.selected_color.to_string()
        if (!this.mark_selected_color_pot(selected_color)) {
            this.create_color_pot(selected_color, 12);
            this.mark_selected_color_pot(selected_color)
        }
    };

}