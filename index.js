const N3 = require('n3');
const VueX = require('vuex');
const Vue = require('vue');
Vue.use(VueX);

const VueLevelGraph = require('./src/vue-levelgraph.js');
Vue.use(VueLevelGraph, {name: 'askos'});

const term = require('./src/utils.js').term;

// Use futuristic Fetch() API
require('es6-promise').polyfill();
require('isomorphic-fetch');

let context = {
  "@context": {
    "dcterms": "http://purl.org/dc/terms/",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "owl": "http://www.w3.org/2002/07/owl#",
    "prov": "http://www.w3.org/ns/prov#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "xml": "http://www.w3.org/XML/1998/namespace",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "@base": "https://vocabulary.wiley.com/PublicationType/",
    "@language": "en"
  }
};
window.context = context;

let curie = function(v) {
  // we may not have a value yet
  if (undefined === v) return v;

  let found = Object.entries(context['@context'])
                    .filter((el) => v.startsWith(el[1]));
  if (found.length > 0) {
    return found[0][0] + ':' + v.replace(found[0][1], '');
  } else {
    // curie-ing failed...return passed in value...
    return v;
  }
};

let uncurie = function(v) {
  return N3.Util.expandPrefixedName(v, context['@context']);
};

window.curie = curie;
window.uncurie = uncurie;
Vue.filter('curie', curie);
Vue.mixin({methods: {curie, uncurie}});

// clean up @value objects + (optional) @language selection
Vue.filter('@value', (v, lang) => {
  if (Array.isArray(v) && v.length === 1) {
    // TODO: ...yeah...there's more stuff to happen here...
    if (v[0]['@language'] === lang) {
      return v[0]['@value'];
    } else {
      // TODO: should this fall back to an unknown lang?
      return v[0]['@value'];
    }
  } else if (typeof v === 'object') {
    // this one's a real object...not an array
    return v['@value'];
  }
});

const store = new VueX.Store({
  strict: true,
  state: {
    current_scheme: '', // URI of ConceptScheme
    current_concept: '' // URI of Concept
  },
  mutations: {
    setActiveScheme(state, payload) {
      state.current_scheme = payload.scheme;
    },
    setActiveConcept(state, payload) {
      state.current_concept = payload.concept;
    }
  },
  actions: {
    setActiveScheme({ commit }, payload) {
      commit('setActiveConcept', '');
      commit('setActiveScheme', payload);
    }
  }
});

Vue.component('vue-semantic-multi-select', require('./src/vue-semantic-multi-select.vue'));

Vue.component('skos-viewer', require('./src/viewer.vue'));
Vue.component('rdf-item', require('./src/rdf-item.vue'));
Vue.component('skos-concept-scheme', require('./src/concept-scheme.vue'));
Vue.component('skos-concept-scheme-form', require('./src/concept-scheme-form.vue'));
Vue.component('skos-concept-scheme-filter-link', require('./src/concept-scheme-filter-link.vue'));
Vue.component('skos-concept', require('./src/concept.vue'));
Vue.component('skos-concept-form', require('./src/concept-form.vue'));
Vue.component('skos-concept-table', require('./src/concept-table.vue'));
Vue.component('skos-concept-filter-link', require('./src/concept-filter-link.vue'));

function removeEmpties(spo) {
  // TODO: certainly  there's a better way to "clean" this object...later...maybe
  if (spo.subject === '') delete spo.subject;
  if (spo.predicate === '') delete spo.predicate;
  if (spo.object === '') delete spo.object;
  return spo;
}

// from https://stackoverflow.com/a/42389266
Vue.directive('click-outside', {
  bind: function (el, binding, vnode) {
    el.event = function (event) {
      // here I check that click was outside the el and his childrens
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        vnode.context[binding.expression](event);
      }
    };
    document.body.addEventListener('click', el.event)
  },
  unbind: function (el) {
    document.body.removeEventListener('click', el.event)
  },
});

window.app = new Vue({
  el: '#app',
  store,
  data: {
    config: {
      jsonld: {
        base: '',
        overwrite: false
      },
      n3: {}
    },
    context,
    table: [],
    active_tab: 'editor',
    filter: {
      subject: '',
      predicate: '',
      object: ''
    },
    limit: 100,
    offset: 0,
    filtered: false,
    output_jsonld: '',
    output_n3: ''
  },
  watch: {
    active_tab(v) {
      if (v === 'triples') {
        this.displayTriples();
      }
    }
  },
  computed: {
    actual_filter: function() {
      var object = this.filter.object.trim();
      if (object !== '' && !isNaN(object)) {
        // search for the RDF materialized integer
        object = '"' + String(object) + '"^^http://www.w3.org/2001/XMLSchema#integer';
      }
      var spo = {
        subject: this.filter.subject.trim(),
        predicate: this.filter.predicate.trim(),
        object: object
      };

      spo = removeEmpties(spo);

      return spo;
    },
    actual_table: function() {
      return this.table.slice(this.offset, this.limit+this.offset);
    },
    unique_predicates() {
      let rv = {};
      this.table.forEach((triple) => {
        rv[triple.predicate] = '';
      });
      return Object.keys(rv);
    },
    unique_subjects() {
      let rv = {};
      this.table.forEach((triple) => {
        rv[triple.subject] = '';
      });
      return Object.keys(rv);
    }

  },
/*  created: function() {
    this.displayTriples();
  },*/
  methods: {
    isActiveTab(tab) {
      return (tab === this.active_tab);
    },
    displayTriples: function(spo) {
      if (!(spo)) spo = {};
      var self = this;
      self.$db.get(spo, function(err, list) {
        self.table = list;
        // TODO: ugh...context collapse...
        self.$refs.skos.getSchemes();
      });
    },
    importSKOS(ev) {
      let self = this;

      // determine the file extension
      let filename = ev.target.files[0].name;
      let ext = filename.substring(filename.lastIndexOf('.')+1, filename.length) || undefined;
      // pick the right parser/loader
      let processor = (ext === 'json' || ext === 'jsonld') ? 'jsonld' : 'n3';
      // do the loading/importing
      let reader = new FileReader();
      reader.onload = (load_event) => {
        let text = load_event.target.result;
        self.$db[processor].put(text, (err) => {
          if (err) console.error(err);
          // TODO: more context collapse...also...hits the DB twice...
          self.$refs.skos.getSchemes();
          self.$refs.skos.getConcepts();
        });
      };
      reader.readAsText(ev.target.files[0], 'UTF-8');
    },
    put: function() {
      var self = this;
      // TODO: refs are handy, but this feels "off"
      if (this.input_type === 'jsonld') {
      this.$db[this.input_type].put(
        this.$refs[this.input_type].value,
        this.config[this.input_type],
        function(err, obj) {
          // do something after the obj is inserted
          self.displayTriples({});
        });
      } else {
        // ...the new .put() signatures no longer match between JSON-LD & N3 extensions
        // TODO: help make them match (again)
        this.$db[this.input_type].put(
          this.$refs[this.input_type].value,
          function(err, obj) {
            // do something after the obj is inserted
            self.displayTriples({});
          });
      }
    },
    del: function() {
      var self = this;
      // TODO: this is JSON-LD only...time to move stuff around...
      this.$db[this.input_type].del(
        this.$refs[this.input_type].value,
        this.config[this.input_type],
        function(err, obj) {
          // do something after the obj is inserted
          self.displayTriples();
        });
    },
    empty: function() {
      var self = this;
      // this...is dangerous...unless demo
      if (confirm("Really? You're sure?")) {
        self.$db.get({}, function(err, list) {
          if (err) console.error(err);
          self.$db.del(list, function(err) {
            if (err) console.error(err);
            self.displayTriples();
          });
        });
      }
    },
    applyFilter: function() {
      // always reset offset so we start at the beginning
      this.offset = 0;
      if (this.filter.subject === ''
        && this.filter.predicate === ''
        && this.filter.object === '') {
        this.filtered = false;
      } else {
        this.filtered = true;
      }
      this.displayTriples(this.actual_filter);
    },
    removeFilter: function(filter) {
      if (undefined === filter) {
        this.filter = {
          subject: '',
          predicate: '',
          object: ''
        };
      } else {
        this.filter[filter] = '';
      }
      this.applyFilter();
    },
    setFilter: function(spo) {
      // TODO: add some error handling and such
      this.filter.subject = spo.subject;
      this.filter.predicate = spo.predicate;
      this.filter.object = spo.object;
    },
    addSPO: function() {
      var self = this;
      if (self.filter.subject !== '' && self.filter.predicate !== '' && self.filter.object !== '') {
        self.$db.put(self.filter, function(err) {
          if (err) {
            console.error(err);
          } else {
            self.table.unshift(self.filter);
            self.filter = {
              subject: '',
              predicate: '',
              object: ''
            };
            self.applyFilter();
          }
        });
      }
    },
    removeSPO: function(spo, idx) {
      var self = this;
      // remove it from the database
      self.$db.del(spo, function(err) {
        if (err) {
          console.error(err);
        } else {
          // remove it from the page/app state
          self.table.splice(idx, 1);
        }
      });
      // TODO: switch to the changes feed once that's a thing
    },
    output: function(type) {
      var self = this;
      var filter = removeEmpties(JSON.parse(JSON.stringify(this.filter)));
      if (type === 'n3') {
        self.$db.n3.get(filter, function(err, rv) {
          self.output_n3 = rv;
          // TODO: hackilicious...we should fix this...
          self.$refs['output-n3'].editor.setValue(self.output_n3);
          self.$refs['output-n3'].refresh();
        });
      } else {
        self.$db.get(filter, function(err, rv) {
          if (err) throw err;
          var graphs = [];
          rv.forEach((triple) => {
            graphs.push({
              subject: term(triple.subject),
              predicate: term(triple.predicate),
              object: term(triple.object)
            });
          });
          jsonld.fromRDF({'@default': graphs}, function(err, rv) {
            self.output_jsonld = JSON.stringify(rv, null, '  ');
            // TODO: hackilicious...we should fix this...
            self.$refs['output-jsonld'].editor.setValue(self.output_jsonld);
            self.$refs['output-jsonld'].refresh();
          });
        });
      }
    }
  }
});
