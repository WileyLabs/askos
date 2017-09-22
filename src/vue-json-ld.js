const N3 = require('n3');

export function install(Vue, options) {
  Vue.prototype['@context'] = options['@context'];

  // TODO: move out of install()
  function invert(obj) {
    var new_obj = {};
    for (var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
        new_obj[obj[prop]] = prop;
      }
    }
    return new_obj;
  };

  // TODO: can @context be changed later in the app? if so (or when), this
  // needs to handle those changes
  let context_flipped = (function() {
    let temp = options['@context'];
    delete temp['@base']; // temp's a duplicate for us...
    return invert(temp);
  })();


  let curie = function(v) {
    let finds = Object.keys(context_flipped).filter((iri) => {
      return Boolean(v.substr(0, iri.length) === iri);
    });
    if (finds[0] in context_flipped) {
      return context_flipped[finds[0]] + ':' + v.replace(finds[0], '');
    } else {
      // curie-ing failed...return passed in value...
      return v;
    }
  };
  window.curie = curie;
  Vue.prototype.curie = curie;
  Vue.filter('curie', curie);

  let uncurie = function(v) {
    return N3.Util.expandPrefixedName(v, context['@context']);
  };
  Vue.prototype.uncurie = uncurie;
  Vue.filter('uncurie', uncurie);
};
