<template>
<div class="item"
  :resource="compacted['@id']" :typeof="rdfa_typeof" :id="dom_id"
  @click="selected">

  <!--textarea>{{compacted}}</textarea-->

  <div class="content">
    <div v-if="inconsistent" class="ui right floated red label">inconsistent</div>
    <!-- TODO: should be only one... -->
    <div class="header" v-for="label in compacted['prefLabel']">
      {{label | @value}}
    </div>
    <div class="description">
      <p v-for="d in compacted['definition']">{{d | @value}}</p>
    </div>
  </div>
</div>
</template>

<script>
const context = {
  "@context": {
    "@vocab": "http://www.w3.org/2004/02/skos/core#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "owl": "http://www.w3.org/2002/07/owl#",
    "@language": "" // forces all strings into @value objects
  }
};

export default {
  props: ['resource', 'typeof'],
  data() {
    return {
      dom_id: '',
      compacted: {}
    };
  },
  computed: {
    rdfa_typeof() {
      if ('@type' in this.compacted) {
        if (typeof this.compacted['@type'] === 'object'
            && this.compacted['@type'].length > 0) {
          return this.compacted['@type'].join(' ');
        } else {
          return this.compacted['@type'];
        }
      }
    },
    inconsistent() {
      // more to come...
      return this.tooManyPrefLabels;
    },
    tooManyPrefLabels() {
      // there can be only one...
      return Boolean('prefLabel' in this.compacted
        && this.compacted['prefLabel'].length > 1);
    }
  },
  created() {
    var self = this;
    if (this.resource) {
      self.dom_id = btoa(this.resource);
      self.$db.jsonld.get(this.resource, context,
        {compactArrays: false, graph: true},
        function(err, rv) {
          let temp = rv;
          delete temp['@context'];
          // everything's tucked in an @graph because of ^^
          self.compacted = temp['@graph'][0];
          // TODO: not really sure what all this may effect...
        });
    }
  },
  methods: {
    selected() {
      this.$store.commit('setActiveConcept', {
        concept: this.resource
      });
    }
  },
  filters: {
    as_fragment(v) {
      return '#' + btoa(this.uncurie(v));
    }
  }
};
</script>
