import Handlebars from "handlebars";

Handlebars.registerHelper('flag', function(country_code : string) {
    const codePoints = country_code
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
});
