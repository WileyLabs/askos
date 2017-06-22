<template>
  <div class="ui segment">
    <button v-if="!ui.showing"
            @click.prevent="ui.showing = true"
      class="ui positive labeled fluid icon button">
      <i class="plus icon"></i>
      Add Concept
    </button>
    <form class="ui form" v-else>
      <div class="ui field">
        <label>ID (an IRI)</label>
        <div class="ui labeled input">
          <input type="url" v-model="doc.id" />
        </div>
      </div>
      <div class="ui field">
        <label>Prefered Label</label>
        <input type="text" v-model="doc.prefLabel" />
      </div>
      <div class="ui field">
        <label>Definition</label>
        <input type="text" v-model="doc.definition" />
      </div>
      <div class="ui field">
        <label>In Scheme(s)</label>
        <vue-semantic-multi-select placeholder="Schemes" :options="schemes" v-model="doc.inScheme"></vue-semantic-multi-select>
      </div>
      <div class="ui field">
        <button class="ui icon button" @click.prevent="ui.showing = false">
          <i class="close icon"></i>
        </button>
        <button class="ui right floated positive button" @click.prevent="save">
          Save Concept
        </button>
      </div>
    </form>
  </div>
</template>

<script>
const context = {
  "@vocab": "http://www.w3.org/2004/02/skos/core#",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "owl": "http://www.w3.org/2002/07/owl#",
  "id": "@id",
  "inScheme": {
    "@type": "@id",
    "@container": "@set"
  },
  "language": ""
};
export default {
  props: ['default-scheme'],
  data() {
    return {
      ui: {
        showing: false
      },
      doc: {
        id: "", // TODO: enforce IRI
        prefLabel: "",
        definition: "",
        inScheme: []
      },
      schemes: {}
    }
  },
  created() {
    let self = this;
    // add passed in default scheme to inSchemes array
    // find all schemes with prefLabel's & format the output as select options
    const db = this.$db;
    db.search([
      { subject: db.v('value'),
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://www.w3.org/2004/02/skos/core#ConceptScheme'},
      { subject: db.v('value'),
        predicate: 'http://www.w3.org/2004/02/skos/core#prefLabel',
        object: db.v('text')}
    ], {}, (err, results) => {
      results.forEach((r) => {
        self.schemes[r.value] = r.text.replace(/^"(.*)"$/, '$1');
      });
    });
  },
  methods: {
    save() {
      let self = this;
      let json = {
        "@context": context,
        "@type": "Concept",
        "id": this.doc.id,
        "prefLabel": this.doc.prefLabel,
        "definition": this.doc.definition,
        "inScheme": [...(new Set(this.doc.inScheme))] // ready. set. splat!
      };
      self.$db.jsonld.put(json, (err) => {
        if (err) console.error(err);
        self.$emit('added');
      });
    }
  }
}
</script>
