import { Coordinates } from "../src/components/coordinates";


describe('What component aspect are you testing?', () => {
    it('What should the feature do?', () => {
        const actual = 'What is the actual output?'
        const expected = 'What is the expected output?'

        expect(actual).toEqual(actual) // matcher
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
        expect(Coordinates.sanitize_string("  A  ")).toBe("A")
        expect(Coordinates.sanitize_string(" \t A \n ")).toBe("A")
    })
    it('trim whitespaces after replacement', () => {
        expect(Coordinates.sanitize_string("A°")).toBe("A")
    })
    it('German Ost Hemisphare (o/O)', () => {
        expect(Coordinates.sanitize_string("N50 12.234 o008 12.345")).toBe("N50 12.234 E008 12.345")
        expect(Coordinates.sanitize_string("N50 12.234 O008 12.345")).toBe("N50 12.234 E008 12.345")
    })
    it('Allowed characters', () => {
        // note: o/O is handled special
        expect(Coordinates.sanitize_string("abcdefghijklmnpqrstuvwxyz")).toBe("ABCDEFGHIJKLMNPQRSTUVWXYZ")
        expect(Coordinates.sanitize_string("ABCDEFGHIJKLMNPQRSTUVWXYZ")).toBe("ABCDEFGHIJKLMNPQRSTUVWXYZ")
        expect(Coordinates.sanitize_string("0123456789-")).toBe("0123456789-")
    })
    it('Not allowed characters', () => {
        expect(Coordinates.sanitize_string("°'\"")).toBe("")
    })
    it("Comma as separator between lat/long", () => {
        expect(Coordinates.sanitize_string("A,B")).toBe("A B")
        expect(Coordinates.sanitize_string("A.C,B.D")).toBe("A.C B.D")
    })
    it("Comma as decimal separator in lat/long", () => {
        expect(Coordinates.sanitize_string("A,C B,D ")).toBe("A.C B.D")
        expect(Coordinates.sanitize_string("N50 12.234,E008 12.345")).toBe("N50 12.234 E008 12.345")
    })
    it("Comma as decimal separator only in lat", () => {
        // comma in only one part doesn't work
        expect(Coordinates.sanitize_string("A.C B,D")).toBe("A.C B,D")
        expect(Coordinates.sanitize_string("N50 12,234 E008 12,345")).toBe("N50 12.234 E008 12.345")
    })
    it("single spaces", () => {
        // comma in only one part doesn't work
        expect(Coordinates.sanitize_string("A##B")).toBe("A B")
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
