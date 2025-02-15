let last_random_color: string | null = null;
let last_index_color: number = -1;


export class Color {
    // tslint:disable-next-line: prefer-readonly
    private hex: string = "";

    static readonly palette: string[] = [
        "ff0000", "ff8000", "ffff00", "80ff00", "00ff00", "00ff80", "00ffff", "0080ff", "0000ff", "8000ff", "ff00ff", "ff0080", 
        "cc0000", "cc6600", "cccc00", "66cc00", "00cc00", "00cc66", "00cccc", "0066cc", "0000cc", "6600cc", "cc00cc", "cc0066", 
        "8c0000", "8c4600", "8c8c00", "468c00", "008c00", "008c46", "008c8c", "00468c", "00008c", "46008c", "8c008c", "8c0046", 
        "ffffff", "e8e8e8", "d1d1d1", "b9b9b9", "a2a2a2", "8b8b8b", "747474", "5d5d5d", "464646", "2e2e2e", "171717", "000000", 
        ];

    public constructor(hex: string) {
        if (!RegExp("^[0-9A-Fa-f]{6}$").test(hex)) {
            throw new Error(`bad hex-color: ${hex}`);
        }
        this.hex = hex;
    }

    public static from_string(str: string): Color | null {
        if (RegExp("^[0-9A-Fa-f]{6}$").test(str)) {
            return new Color(str);
        }
        if (RegExp("^#[0-9A-Fa-f]{6}$").test(str)) {
            return new Color(str.substring(1));
        }
        // rgb(116, 116, 116)
        const matches = str.match(/\d+/g);
        if (RegExp(/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/).test(str)) {
            const matches = str.match(/\d+/g)
            if (matches) {
                const [r, g, b] = matches.map((num) => parseInt(num).toString(16).padStart(2, '0'));
                // Combine into a hex color string
                return new Color(`${r}${g}${b}`);
            }
        }

        return null;
    }

    public static random_from_palette(): Color {
        const colors = [
            "FF3860", // Bulma red
            "FFDD57", // Bulma yellow
            "23D160", // Bulma green
            "3273DC", // Bulma dark blue
            "209CEE", // Bulma light blue
            "00D1B2", // Bulma teal
        ];

        let hex = null;
        let index = -1;
        do {
            index = Math.floor(Math.random() * this.palette.length);
            hex = this.palette[index];
        } while (index%12 === last_index_color % 12); // (hex === last_random_color);
        last_random_color = hex;
        last_index_color = index

        return new Color(hex);
    }

    public to_string(): string {
        return this.hex;
    }

    public to_hash_string(): string {
        return `#${this.hex}`;
    }

    public luma(): number {
        const rgb = parseInt(this.hex, 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = (rgb >> 0) & 255;

        // Luma, per ITU-R BT.709
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    public text_color(): Color {
        if (this.luma() >= 128) {
            return new Color("000000");
        }

        return new Color("FFFFFF");
    }

    public equals(other: Color | null): boolean {
        if (other === null) {
            return false;
        }

        return this.hex.toLowerCase() === other.hex.toLowerCase();
    }

    public static default_color(): Color {
        return new Color("3273DC");
    }
}
