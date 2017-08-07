<template>
<div>
  <button class="ui right floated red basic icon button" @click="delConcept">
    <i class="delete icon"></i>
    Delete
  </button>
  <h2 class="ui header">
    <span v-for="p in compacted['prefLabel']">{{p | @value}}</span>
  </h2>
  <p>{{compacted['id']}}</p>
  <table class="ui definition table">
    <tbody>
    <tr v-for="(val, key) in filtered">
      <td>{{key}}</td>
      <td v-if="key !== 'inScheme' && key !== 'topConceptOf'">
        <rdf-item @removeIntent="del" v-if="val.length === 1" :label="key" :val="val[0]"></rdf-item>
        <rdf-item @removeIntent="del" v-else :label="key" :val="val"></rdf-item>
      </td>
      <td v-else>
        <skos-concept-scheme-filter-link v-for="scheme in val"
          :resource="scheme.id"></skos-concept-scheme-filter-link>
      </td>
    </tr>
    </tbody>
  </table>
  <!--textarea>{{compacted}}</textarea-->
</div>
</template>

<script>
const context = {
  "@context": {
    "id": "@id",
    "type": "@type",
    "@vocab": "http://www.w3.org/2004/02/skos/core#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "owl": "http://www.w3.org/2002/07/owl#",
    "@language": "" // forces all strings into @value objects
  }
};

export default {
  props: ['resource'],
  data() {
    return {
      compacted: {},
      original: {}
    }
  },
  watch: {
    resource() {
      var self = this;
      if (this.resource) {
        self.$db.jsonld.get(this.resource, context,
          {compactArrays: false, graph: true},
          function(err, rv) {
            if (err) {
              console.error(err);
            } else {
              // deep cloning to avoid changes changing things...
              self.original = JSON.parse(JSON.stringify(rv));
              let temp = rv;
              delete temp['@context'];
              // everything's tucked in an @graph because of ^^
              self.compacted = temp['@graph'][0];
              // TODO: not really sure what all this may effect...
            }
          });
      }
    }
  },
  computed: {
    filtered() {
      let temp = Object.assign({}, this.compacted);
      delete temp['id'];
      delete temp['type'];
      return temp;
    }
  },
  methods: {
    del(key, index) {
      // remove it
      let to_delete = {
        '@context': context['@context'],
        'id': this.compacted.id
      };
      to_delete[key] = this.compacted[key][index];
      this.$db.jsonld.del(to_delete, (err) => {
        if (err) {
          console.error(err);
        } else {
          // remove it from the UI state object
          this.compacted[key].splice(index, 1);
        }
      });
    },
    delConcept() {
      let self = this;
      // cutting to avoid removing any related graph contents
      self.$db.jsonld.cut(this.compacted.id, (err) => {
        if (err) {
          console.error(err);
        } else {
          self.$emit('removed');
          self.$store.commit('setActiveState', {concept: ''});
        }
      });
    }
  }
}
</script>
