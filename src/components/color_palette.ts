import {create_element,create_color_palette,color_palette_selected_pot} from "./utilities";
import {Color} from "./color";

type Callback = (color : Color) => void;

export class ColorPalette {
    private readonly anchor : HTMLDivElement;
    private readonly palette : HTMLDivElement
    private readonly heading : string;
    private readonly callback : Callback;
    private selected_color: Color;

    public constructor(anchor : HTMLDivElement, selected_color: Color, func : Callback ) {// public constructor(app: App, id: string) {
        this.anchor = anchor;
        this.selected_color = selected_color;
        this.callback = func;

        this.palette = this.create_color_palette()
    }

    public get_selected_color() : Color {
        return this.selected_color;
    }

    private create_color_palette(): HTMLDivElement {
        const label_text = this.heading;
        const data_tag = this.selected_color.to_hash_string();
        const placeholder = "";

        const palette = create_element("div", ["colorpalette"], {"data-radius":""});
        this.anchor.append(palette);
    
        const selected_color = this.selected_color.to_string()
        palette.dataset.color = selected_color;

        Color.palette.forEach((color) => {
            const color_pot = create_element("div", 
                                    ["color", "colorpot"]) as HTMLElement;
            color_pot.style.backgroundColor = "#"+color;
            const color_object = Color.from_string(color)
            if (color_object!==null) {
                let luma = color_object.luma()
                color_pot.dataset.luma = String(luma);
                if (luma < 130) {
                    color_pot.classList.add("dark")
                } else {
                    color_pot.classList.add("light")
                }
                let basic_luma = Math.floor(luma/16)
                color_pot.dataset.luma = String(luma);
                color_pot.classList.add("luma-"+String(basic_luma));
            }
            color_pot.dataset.color = color;

            console.log(color,selected_color);
            if (color == selected_color)  {
                color_pot.classList.add("selected");
            } else {
                //color_pot.classList.remove("selected");
            }
    
            palette.appendChild(color_pot);
            color_pot.addEventListener("click", 
                (event): void => {
                    this.select_color(event.currentTarget as HTMLDivElement);
                }
            );
        });

        return palette as HTMLDivElement;
    };

    private select_color(color_pot : HTMLDivElement) :  void {
        // remove selection
        const markerElements = this.palette.querySelectorAll(".selected");
        markerElements.forEach((element) => {
            (element as HTMLElement).classList.remove("selected");
        });
        // set selected color
        color_pot.classList.add("selected");

        if (color_pot.dataset.color) {
            this.palette.dataset.color = color_pot.dataset.color;
            this.selected_color = new Color(color_pot.dataset.color);

            // callback
            this.callback(this.selected_color);
        }
    }

    public update() : void {

    }
}