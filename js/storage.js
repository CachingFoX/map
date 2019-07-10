class Storage {
    constructor() {
        this.ok = true;
        try {
            var x = '__Persist_test__';
            window.localStorage.setItem(x, x);
            window.localStorage.removeItem(x);
        } catch (e) {
            this.ok = false;
            console.error("Local storage not available!");
        }
    }

    set(key, value) {
        if (!this.ok) {
            return;
        }

        if (value !== null) {
            window.localStorage.setItem(key, String(value));
        } else {
            window.localStorage.removeItem(key);
        }
    }

    get(key, default_value) {
        if (!this.ok) {
            return default_value;
        }

        const s = window.localStorage.getItem(key);
        if (s !== null) {
            return s;
        }
        return default_value;
    }

    set_int(key, value) {
        this.set(key, String(value));
    }
    set_float(key, value) {
        this.set(key, String(value));
    }
    set_coordinates(key, value) {
        this.set(key, value.lat + ";" + value.lng);
    }

    get_int(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseInt(s, 10);
        }
        return default_value;
    }
    get_float(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseFloat(s);
        }
        return default_value;
    }
    get_coordinates(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            const lat_lng = s.split(";");
            if (lat_lng.length != 2) {
                return default_value;
            }
            return new Coordinates(parseFloat(lat_lng[0]), parseFloat(lat_lng[1]));
        }
        return default_value;
    }
}