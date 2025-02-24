import {Coordinates, CoordinatesFormat} from "../coordinates";

export interface INameCoordinates {
    name: string;
    country_code: string;
    country_name: string;
    region_name: string;
    feature: string;
    coordinates: Coordinates;
}

export class Search {
    protected results : any[] = [];

    public constructor() {
    }

    public perform_search(success: (search : Search, startIndex : number, count : number) => void,
                         fail: (error_message:string) => void) : void {

    }

    public convert( element : any ) : INameCoordinates {
        return {
            name: "", country_code: "", country_name: "", region_name: "", feature: "",
            coordinates: new Coordinates(parseFloat("0.0"), parseFloat("0.0")),
        };
    }

    public append_results(data : any) : number {
        return 0;
    }

    public more_results() : boolean {
        console.log(this.count_results(), this.total_results(), this.count_results() < this.total_results())
        return this.count_results() < this.total_results();
    }

    public total_results() : number {
        return 0;
    }

    public count_results() : number {
        return this.results.length;
    }

    public get_results( startIndex: number, count: number ) : INameCoordinates[] {
        const results: INameCoordinates[] = [];

        var results_fragment = this.results.slice(startIndex, startIndex+count);

        results_fragment.forEach((element: any) => {
            const item = this.convert(element);
            results.push(item);
        });
        return results;
    }
}

export class NominationSearch extends Search {
    private readonly results_per_page : number;
    private readonly max_results : number;
    private parameters : Record<string,string|number> = {};
    private totalResultsCount = -1;

    public constructor(location_string : string, language : string ) {
        super()
        this.results_per_page = 20;
        this.max_results = 1000;

        this.parameters["lang"] = language;
        this.parameters["name"] = location_string;
        this.parameters["startRow"] = -this.results_per_page;
        this.parameters["maxRows"] = this.results_per_page;
        this.parameters["username"] = "foxmap";
    }

    public perform_search(success: (search : Search, startIndex : number, count : number) => void, fail: (error_message:string) => void) : void {
        const url = this.get_url()
        fetch(url)
            .then(
                (response: Response): Promise<any> => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    const contentType = response.headers.get("content-type");
                    if (contentType === null || !contentType.includes("application/json")) {
                        throw new TypeError("Response is not JSON");
                    }

                    return response.json();
                },
            )
            .then((json_data): void => {
                console.log(json_data);
                var count = this.append_results(json_data);
                success(this, Number(this.parameters["startRow"]), count);
            })
           .catch((error: any): void => {
                fail(error);
           });
    }

    private get_url() : string {
        this.parameters["startRow"] = Number(this.parameters["startRow"]) + this.results_per_page;
        const queryString = new URLSearchParams(
            Object.fromEntries(
              Object.entries(this.parameters).map(([key, value]) => [key, String(value)])
            )
          ).toString();
        const url = `http://api.geonames.org/searchJSON?${queryString}`;
        return url;
    }

    public convert( element : any ) : INameCoordinates {
        var country_code = ""
        if ("countryCode" in element) {
            country_code = element.countryCode;
        }
        return {
            name: element.name,
            country_code: element.countryCode,
            country_name: element.countryName,
            region_name: element.adminName1,
            feature: element.fcodeName,
            coordinates: new Coordinates(parseFloat(element.lat), parseFloat(element.lng)),
        };
    }

    public append_results(json_data : any) : number {
        this.totalResultsCount = json_data.totalResultsCount;

        json_data.geonames.forEach((element: any) => {
            this.results.push(element);
            const item = this.convert(element);
        });
        return json_data.geonames.length;
    }

    /*public more_results() : boolean {
        return this.totalResultsCount > Number(this.parameters["startRow"]) + this.results_per_page;
    }*/

    public total_results() : number {
        return this.totalResultsCount;
    }

    public count_results() : number {
        return this.results.length;
    }
}

export class CoordinateSearch extends Search {
    private readonly format : CoordinatesFormat;
    private readonly name : string;
    private readonly origin : string;

    public constructor(coordinates : Coordinates, format : CoordinatesFormat, name : string, origin : string) {
        super()
        this.format = format;
        this.name = name;
        this.origin = origin;
        this.results = [coordinates];
    }

    public perform_search(success: (search : Search, startIndex : number, count : number) => void,
                            fail: (error_message:string) => void) : void {
        success(this, 0, 1);
    }

    public convert( element : any ) : INameCoordinates {
        return {
            name: this.name,
            country_code: "",
            country_name: element.to_string(this.format),
            region_name: "",
            feature: this.origin,
            coordinates: element,
        };
    }

    public total_results() : number {
        return 1;
    }
}

