var N3 = require('n3');

var term = function (str) {
    if (N3.Util.isBlank(str)) {
        return {
            type: 'blank node',
            value: str
        };
    } else if (N3.Util.isLiteral(str)) {
        var ret = {
            type: 'literal',
            value: N3.Util.getLiteralValue(str),
            datatype: N3.Util.getLiteralType(str),
        };

        var language = N3.Util.getLiteralLanguage(str);
        if (language !== '') {
            ret.language = language;
        }

        return ret;
    } else {
        return {
            type: 'IRI',
            value: str
        };
    }
};

exports.term = term;
