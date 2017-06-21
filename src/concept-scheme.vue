<template>
<div :resource="compacted['@id']" :typeof="rdfa_typeof" :id="dom_id"
  class="item" :class="{active: isActive}"
  @click="selected">
  <div class="header">
    {{compacted['skos:prefLabel'] | @value}}
  </div>
  <div class="content">
    {{compacted['@id']}}
    <span v-for="def in compacted['skos:definition']">{{def}}</span>
  </div>
</div>
</template>

<script>
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
      // TODO: fix global `context` assumptions
      self.$db.jsonld.get(this.resource, context, {compactArrays: false}, function(err, rv) {
        // everything's tucked in an @graph because of ^^
        self.compacted = rv['@graph'][0];
        // TODO: not really sure what all this may effect...
      });
    }

    // allow for cascading elements by passing in full JSON-LD
    if (this.self) {
      self.compacted = this.self;
    }
  },
  methods: {
    selected() {
      this.$store.dispatch('setActiveScheme', {
        scheme: this.compacted['@id']
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
