import exp from "constants";
import { Coordinates } from "../src/components/coordinates";


describe('What component aspect are you testing?', () => {
    it('What should the feature do?', () => {
        const actual = 'What is the actual output?'
        const expected = 'What is the expected output?'

        expect(actual).toEqual(actual) // matcher
    });
    it('xxx', () => {
        let c = Coordinates.from_string("N 49 22.797 N 010 59.437")
        expect(c).toBe(null)
    })
});

describe('from_components', () => {
    it('order lat/lng', () => {
        let expectedNE = new Coordinates(50.11042, 8.68213);
        let expectedNW = new Coordinates(50.11042, -8.68213);
        let expectedSE = new Coordinates(-50.11042, 8.68213);
        let expectedSW = new Coordinates(-50.11042, -8.68213);

        // order latitude/longitude
        let c = Coordinates.from_components("N", 50.11042, 0, 0, "E", 8.68213, 0, 0);
        expect(c).toStrictEqual(expectedNE)

        c = Coordinates.from_components("N", 50.11042, 0, 0, "W", 8.68213, 0, 0);
        expect(c).toStrictEqual(expectedNW)

        c = Coordinates.from_components("S", 50.11042, 0, 0, "E", 8.68213, 0, 0);
        expect(c).toStrictEqual(expectedSE)

        c = Coordinates.from_components("S", 50.11042, 0, 0, "W", 8.68213, 0, 0);
        expect(c).toStrictEqual(expectedSW)

        // reverse order longitude/latitude
        c = Coordinates.from_components("E", 8.68213, 0, 0, "N", 50.11042, 0, 0);
        expect(c).toStrictEqual(expectedNE)

        c = Coordinates.from_components("E", 8.68213, 0, 0, "S", 50.11042, 0, 0);
        expect(c).toStrictEqual(expectedSE)

        c = Coordinates.from_components("W", 8.68213, 0, 0, "N", 50.11042, 0, 0);
        expect(c).toStrictEqual(expectedNW)

        c = Coordinates.from_components("W", 8.68213, 0, 0, "S", 50.11042, 0, 0);
        expect(c).toStrictEqual(expectedSW)
    });
    it('wrong hemisphere order', () => {
        let c = Coordinates.from_components("N", 50.11042, 0, 0, "N", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("S", 50.11042, 0, 0, "S", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50.11042, 0, 0, "S", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("S", 50.11042, 0, 0, "N", 8.68213, 0, 0);
        expect(c).toBe(null)

        c = Coordinates.from_components("W", 50.11042, 0, 0, "W", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("E", 50.11042, 0, 0, "E", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("W", 50.11042, 0, 0, "E", 8.68213, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("E", 50.11042, 0, 0, "W", 8.68213, 0, 0);
        expect(c).toBe(null)
    });
    it('mixture of hemisphere and negative (degree values)', () => {
        // no negative values for degress values if hemisphare sign is given
        // DMM or DMS expected only positive values
        let c = Coordinates.from_components("N", -50, 0, 0, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("S", -50, 0, 0, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "E", -8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "W", -8, 0, 0);
        expect(c).toBe(null)

        // in decimal format negative for decimal is allowed 
        let expected = new Coordinates(-50.0000000, -8.0000000);
        c = Coordinates.from_components("+", -50, 0, 0, "+", -8, 0, 0);
        expect(c).toStrictEqual(expected)
    });
    it('check range for minutes and seconds', () => {
        // negative
        let c = Coordinates.from_components("N", 50, -10, 0, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, -10, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "E", 8, -10, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "E", 8, 0, -10);
        expect(c).toBe(null)        

        // to big
        c = Coordinates.from_components("N", 50, 61, 0, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 61, "E", 8, 0, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "E", 8, 61, 0);
        expect(c).toBe(null)
        c = Coordinates.from_components("N", 50, 0, 0, "E", 8, 0, 61);
        expect(c).toBe(null)          
    });    
});

describe('functions', () => {
    it('function NS', () => {
        let c = new Coordinates(50.11042, 8.68213);
        expect(c.NS()).toBe("N")
        c = new Coordinates(0.00000000, 8.68213);
        expect(c.NS()).toBe("N")
        c = new Coordinates(-0.00000001, 8.68213);
        expect(c.NS()).toBe("S")
        c = new Coordinates(-50.11042, 8.68213);
        expect(c.NS()).toBe("S")    
    });
    it('function EW', () => {
        let c = new Coordinates(50.11042, 8.68213);
        expect(c.EW()).toBe("E")
        c = new Coordinates(0.00000000, 0.00000000);
        expect(c.EW()).toBe("E")
        c = new Coordinates(0.00000000, -0.00000001);
        expect(c.EW()).toBe("W")
        c = new Coordinates(-50.11042, -8.68213);
        expect(c.EW()).toBe("W")    
    });
});

describe('sanitize_string', () => {
    it('trim whitespaces at begin and end', () => {
        expect(Coordinates.sanitize_string("  5  ")).toBe("5")
        expect(Coordinates.sanitize_string(" \t 5 \n ")).toBe("5")
    })
    it('trim whitespaces after replacement', () => {
        expect(Coordinates.sanitize_string("5°")).toBe("5")
    })
    it('German Ost Hemisphare (o/O)', () => {
        expect(Coordinates.sanitize_string("N50 12.234 o008 12.345")).toBe("N50 12.234 E008 12.345")
        expect(Coordinates.sanitize_string("N50 12.234 O008 12.345")).toBe("N50 12.234 E008 12.345")
    })
    it('Allowed characters', () => {
        // note: o/O is handled special
        expect(Coordinates.sanitize_string("nswe")).toBe("NSWE")
        expect(Coordinates.sanitize_string("NSWE")).toBe("NSWE")
        expect(Coordinates.sanitize_string("0123456789-")).toBe("0123456789-")
        expect(Coordinates.sanitize_string("abcdefghijklmnopqrstuvwxyz")).toBe("E NE S W")
    })
    it('Not allowed characters', () => {
        expect(Coordinates.sanitize_string("°'\"")).toBe("")
    })
    it("Comma as separator between lat/long", () => {
        expect(Coordinates.sanitize_string("1,2")).toBe("1 2")
        expect(Coordinates.sanitize_string("1.2,3.4")).toBe("1.2 3.4")
    })
    it("Comma as decimal separator in lat/long", () => {
        expect(Coordinates.sanitize_string("1,2 3,4 ")).toBe("1.2 3.4")
        expect(Coordinates.sanitize_string("N50 12.234,E008 12.345")).toBe("N50 12.234 E008 12.345")
    })
    it("Comma as decimal separator only in lat", () => {
        // comma in only one part doesn't work
        expect(Coordinates.sanitize_string("1.2 3,4")).toBe("1.2 3,4")
        expect(Coordinates.sanitize_string("N50 12,234 E008 12,345")).toBe("N50 12.234 E008 12.345")
    })
    it("single spaces", () => {
        // comma in only one part doesn't work
        expect(Coordinates.sanitize_string("1##2")).toBe("1 2")
    })
});

describe('parse DEC coordinates', () => {
    it("format DEC - prefix hemisphere", () => {
        let expected = new Coordinates(50.11042, 8.68213);
        let actual = Coordinates.from_string(" N 50.11042 E 8.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" N 50.11042 E 008.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" N 50.11042, E 8.68213 ");
        expect(actual).toStrictEqual(expected);
    });

    it("format DEC - postfix hemisphere", () => {
        let expected = new Coordinates(50.11042, 8.68213);
        let actual = Coordinates.from_string("  50.11042N 8.68213 E");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("50.11042 N  008.68213 E ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50.11042N , 8.68213E ");
        expect(actual).toStrictEqual(expected);

        // south&west
        let expected2 = new Coordinates(-50.11042, -8.68213);
        actual = Coordinates.from_string("  50.11042S 8.68213 W");
        expect(actual).toStrictEqual(expected2);

        let expected3 = new Coordinates(-50.11042, 8.68213);
        actual = Coordinates.from_string("50.11042 S  008.68213 E ");
        expect(actual).toStrictEqual(expected3);

        let expected4 = new Coordinates(50.11042, -8.68213);
        actual = Coordinates.from_string(" 50.11042N , 8.68213W ");
        expect(actual).toStrictEqual(expected4);
    });

    it("format DEC - without hemisphere", () => {
        let expected = new Coordinates(50.11042, 8.68213);
        let actual = Coordinates.from_string("50.11042 8.68213");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("50.11042 008.68213");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("50.11042, 8.68213");
        expect(actual).toStrictEqual(expected);

        // south&west
        let expected2 = new Coordinates(-50.11042, -8.68213);
        actual = Coordinates.from_string("-50.11042 -8.68213");
        expect(actual).toStrictEqual(expected2);

        actual = Coordinates.from_string("-50.11042 -008.68213");
        expect(actual).toStrictEqual(expected2);

        actual = Coordinates.from_string("-50.11042, -8.68213");
        expect(actual).toStrictEqual(expected2);
    });
});

describe('parse DMM coordinates', () => {
    it("format DMM - prefix hemisphere", () => {
        let expected = new Coordinates(50.185173666666664, 8.511368833333334);
        let actual = Coordinates.from_string("  N50 11.11042 E8 30.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" E8 30.68213   N50 11.11042");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" N  50 11.11042  E   8 30.68213  ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("N 50 11.11042    ,   E8 30.68213 ");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMM - postfix hemisphere", () => {
        let expected = new Coordinates(50.185173666666664, 8.511368833333334);
        let actual = Coordinates.from_string("  N50 11.11042 E8 30.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50 11.11042 N    8 30.68213 E ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50 11.11042N    ,   8 30.68213E ");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMM - semi-postfix hemisphere", () => {
        let expected = new Coordinates(50.185173666666664, 8.511368833333334);
        let actual = Coordinates.from_string("  50N 11.11042 8E 30.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50 N 11.11042    8 E  30.68213");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50N   11.11042  ,   8 E 30.68213");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMM - without hemishere", () => {
        let expected = new Coordinates(50.185173666666664, 8.511368833333334);
        let actual = Coordinates.from_string("  50 11.11042 8 30.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50  11.11042    8   30.68213");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50   11.11042  ,   8  30.68213");
        expect(actual).toStrictEqual(expected);
    });
});

describe('parse DMS coordinates', () => {
    it("format DMs - prefix hemisphere", () => {
        let expected = new Coordinates(50.184197338888886, 8.50102281388889);
        let actual = Coordinates.from_string("  N50 11' 3.11042\" E8 30 3.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" N  50 11 3.11042  E   8 30 3.68213  ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("N 50 11 3.11042    ,   E8 30 3.68213 ");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMS - postfix hemisphere", () => {
        let expected = new Coordinates(50.184197338888886, 8.50102281388889);
        let actual = Coordinates.from_string("  50 11 3.11042 N 8 30  3.68213 E");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50 11 3.11042 N    8 30 3.68213 E ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50 11 3.11042N    ,   8 30 3.68213E ");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMS - semi-postfix hemisphere", () => {
        let expected = new Coordinates(50.184197338888886, 8.50102281388889);
        let actual = Coordinates.from_string("  50N 11 3.11042 8  E30  3.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50 N 11 3.11042    8 E 30 3.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50N  11 3.11042   ,   8E  30 3.68213");
        expect(actual).toStrictEqual(expected);
    });

    it("format DMS - without hemisphere", () => {
        let expected = new Coordinates(50.184197338888886, 8.50102281388889);
        let actual = Coordinates.from_string("  50 11 3.11042 8  30  3.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string("   50  11 3.11042    8  30 3.68213 ");
        expect(actual).toStrictEqual(expected);

        actual = Coordinates.from_string(" 50  11 3.11042   ,   8  30 3.68213");
        expect(actual).toStrictEqual(expected);
    });
});

describe('parse Reverse Wherigo coordinates', () => {
    it('sanitize_string', () => {
        let input = "261180 536802 118040";
        let expected = input;
        let actual = Coordinates.sanitize_string(input);

        expect(actual).toBe(expected)
    });
    it('from_string', () => {
        let input = "261180 536802 118040";
        let expected = input;
        let actual = Coordinates.from_string(input);
        expect(actual).toStrictEqual(new Coordinates(50.11042, 8.68213));
    });
});
