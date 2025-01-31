export enum MapType {
    OPENSTREETMAP = "OPENSTREETMAP",
    OPENTOPOMAP = "OPENTOPOMAP",
    STAMEN_TERRAIN = "STAMEN_TERRAIN",
    HUMANITARIAN = "HUMANITARIAN",
    ARCGIS_WORLDIMAGERY = "ARCGIS_WORLDIMAGERY",
    ARCGIS_WORLDIMAGERY_OVERLAY = "ARCGIS_WORLDIMAGERY_OVERLAY",
    GOOGLE_MAPS = "GOOGLE_MAPS",
    GOOGLE_SATELLITE = "GOOGLE_SAT",
    GOOGLE_HYBRID = "GOOGLE_HYBRID",
}

export const maptype2string = String;

export const string2maptype = (s: string): MapType | null => {
    switch (s.toUpperCase()) {
        case MapType.OPENSTREETMAP:
            return MapType.OPENSTREETMAP;
        case MapType.OPENTOPOMAP:
            return MapType.OPENTOPOMAP;
        case MapType.STAMEN_TERRAIN:
            return MapType.STAMEN_TERRAIN;
        case MapType.HUMANITARIAN:
            return MapType.HUMANITARIAN;
        case MapType.ARCGIS_WORLDIMAGERY:
            return MapType.ARCGIS_WORLDIMAGERY;
        case MapType.ARCGIS_WORLDIMAGERY_OVERLAY:
            return MapType.ARCGIS_WORLDIMAGERY_OVERLAY;
        case MapType.GOOGLE_MAPS:
            return MapType.GOOGLE_MAPS;
        case MapType.GOOGLE_SATELLITE:
            return MapType.GOOGLE_SATELLITE;
        case MapType.GOOGLE_HYBRID:
            return MapType.GOOGLE_HYBRID;
        default:
            return null;
    }
};

export const maptype2human = (t: MapType | null): string => {
    switch (t) {
        case MapType.OPENSTREETMAP:
            return "OpenStreetMap";
        case MapType.OPENTOPOMAP:
            return "OpenTopoMap";
        case MapType.STAMEN_TERRAIN:
            return "Stamen Terrain";
        case MapType.HUMANITARIAN:
            return "Humanitarian";
        case MapType.ARCGIS_WORLDIMAGERY:
            return "World Imagery";
        case MapType.ARCGIS_WORLDIMAGERY_OVERLAY:
            return "World Imagery + Overlay";
        case MapType.GOOGLE_MAPS:
            return "Google Maps";
        case MapType.GOOGLE_SATELLITE:
            return "Google Satellite";
        case MapType.GOOGLE_HYBRID:
            return "Google Hybrid";
        default:
            return "Unknown";
    }
};
