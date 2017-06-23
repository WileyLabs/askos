<template>
<div class="ui grid">
  <div class="three wide column">
    <skos-concept-scheme-form @added="getSchemes()"></skos-concept-scheme-form>
    <div class="ui fluid vertical menu">
      <div class="item" :class="{active: !current_scheme}"
        @click="setActiveScheme('')">
        All Concepts
      </div>
    </div>
    <h4 class="ui header"><div class="ui sub header">Concept Schemes</div></h4>
    <div class="ui fluid vertical menu" v-if="schemes.length > 0">
      <skos-concept-scheme
         v-for="scheme in schemes"
         v-if="scheme"
         :key="scheme"
         :resource="scheme">
      </skos-concept-scheme>
    </div>
  </div>
  <div class="six wide column">
    <skos-concept-form @added="getConcepts()" :default-scheme="current_scheme"></skos-concept-form>
    <button class="ui right floated red basic icon button"
      v-if="current_scheme && concepts.length === 0" @click="deleteScheme(current_scheme)">
      <i class="delete icon"></i>
      Delete Scheme
    </button>
    <h2 class="ui divided header">
      <div class="ui sub header" v-if="current_scheme">
        Concepts in Scheme
      </div>
    </h2>
    <div class="ui horizontal divider header">
      {{current_scheme | curie}}
    </div>
    <div class="ui divided link items">
      <skos-concept v-for="t in concepts" :resource="t.subject" :key="t.subject"></skos-concept>
    </div>
  </div>
  <div class="seven wide column" v-show="current_concept !== undefined">
      <skos-concept-table :resource="current_concept"
        @removed="conceptRemoved"></skos-concept-table>
  </div>
</div>
</template>

<script>
export default {
  data() {
    return {
      schemes: [],
      concepts: []
    }
  },
  watch: {
    current_scheme() {
      this.getConcepts();
    }
  },
  created() {
    this.getSchemes();
    this.getConcepts();
  },
  computed: {
    current_scheme() {
      return this.uncurie(this.$store.state.current_scheme);
    },
    current_concept() {
      return this.uncurie(this.$store.state.current_concept);
    }
  },
  methods: {
    setActiveScheme(scheme) {
      this.$store.dispatch('setActiveScheme', {
        scheme: scheme
      });
    },
    deleteScheme(v) {
      this.$db.jsonld.cut(v, (err) => {
        if (err) {
          console.error(err);
        } else {
          this.getSchemes();
          this.setActiveScheme('');
        }
      });
    },
    getSchemes() {
      let self = this;
      // find all the schemes in use;
      self.$db.get({predicate:'http://www.w3.org/2004/02/skos/core#inScheme'},
        (err, triples) => {
          self.schemes = Array.from(new Set(triples.map((t) => {
            return t.object;
          })));

          // add any empty Schemes that still exist in the graph
          self.$db.get({
              predicate:'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              object: 'http://www.w3.org/2004/02/skos/core#ConceptScheme'
            },
            (err, triples) => {
              let schemes = Array.from(new Set(triples.map((t) => {
                return t.subject;
              })));
              // concat and uniquify
              self.schemes = Array.from(new Set(self.schemes.concat(schemes)));
            });
        });
    },
    getConcepts() {
      if (this.current_scheme) {
        this.getInto('concepts', {
          predicate: 'http://www.w3.org/2004/02/skos/core#inScheme',
          object: this.current_scheme
        });
      } else {
        // get all concepts regardless of stated membership in a scheme
        this.getInto('concepts', {
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: 'http://www.w3.org/2004/02/skos/core#Concept'
        });
      }
    },
    conceptRemoved() {
      this.$store.commit('setActiveConcept', {
        concept: ''
      });
      this.getConcepts();
    }
  }
}
</script>
