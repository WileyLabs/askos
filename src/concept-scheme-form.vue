<template>
  <div class="ui segment">
    <button v-if="!ui.showing"
            @click.prevent="ui.showing = true"
      class="ui positive labeled fluid icon button">
      <i class="plus icon"></i>
      Add Scheme
    </button>
    <form class="ui form" @submit.prevent="save" v-else>
      <button class="ui right floated icon button" type="reset"
        @click.prevent="ui.showing = false">
        <i class="close icon"></i>
      </button>
      <div class="ui header" style="margin: 0">
        Add Scheme
      </div>
      <div class="field">
        <label>Scheme URI</label>
        <input type="url" v-model="doc.id" />
      </div>
      <div class="field">
        <label>skos:prefLabel</label>
        <input type="text" v-model="doc.prefLabel" />
      </div>
      <div class="field" style="text-align: right">
        <button class="ui positive button" type="submit">
          Save Scheme
        </button>
      </div>
    </form>
  </div>
</template>

<script>
const context = {
  "@vocab": "http://www.w3.org/2004/02/skos/core#",
  "id": "@id"
};
export default {
  data() {
    return {
      ui: {
        showing: false
      },
      doc: {
        id: "",
        prefLabel: ""
      }
    }
  },
  methods: {
    save() {
      const self = this;
      let json = {
        "@context": context,
        "@type": "ConceptScheme",
        "id": this.doc.id,
        "prefLabel": this.doc.prefLabel
      };
      self.$db.jsonld.put(json, (err) => {
        if (err) console.error(err);
        self.$emit('added');
        self.doc.id = '';
        self.doc.prefLabel = '';
        self.ui.showing = false;
      });
    }
  }
}
</script>
