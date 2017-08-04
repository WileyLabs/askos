<template>
<div :resource="compacted['@id']" :typeof="rdfa_typeof" :id="dom_id"
  class="item" :class="{active: isActive}"
  @click="setActiveScheme(compacted['@id'])">
  <div class="header" v-if="'prefLabel' in compacted">
    {{compacted['prefLabel'] | @value}}
  </div>
  <div class="content">
    {{compacted['@id']}}
    <span v-for="def in compacted['definition']">{{def | @value}}</span>
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
  props: ['resource', 'typeof', 'self'],
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
    isActive() {
      return this.$store.state.current_scheme === this.uncurie(this.compacted['@id']);
    }
  },
  created() {
    var self = this;
    if (this.resource) {
      self.dom_id = btoa(this.resource);
      self.$db.jsonld.get(this.resource, context, {compactArrays: false}, function(err, rv) {
        if (null === rv) {
          // we didn't find a Scheme definition, so just output the @id
          self.$set(self.compacted, '@id', self.resource);
        } else {
          // everything's tucked in an @graph because of ^^
          self.compacted = rv['@graph'][0];
        }
      });
    }

    // allow for cascading elements by passing in full JSON-LD
    if (this.self) {
      self.compacted = this.self;
    }
  },
  methods: {
    setActiveScheme(scheme) {
      this.$store.dispatch('setActiveScheme', {
        scheme: scheme
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
