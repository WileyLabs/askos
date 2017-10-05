<template>
  <div class="ui two column grid">
    <div class="column">
      <h4 class="ui header">Core Context</h4>
      <table class="ui definition table">
        <tr v-for="(v, k) in original">
          <td>{{k}}</td>
          <td>{{v}}</td>
        </tr>
      </table>
    </div>
    <div class="column">
      <h4 class="ui header">Additional Prefixes</h4>
      <div class="ui form">
        <div class="fields">
          <div class="two wide field" :class="{error: conflicted}">
            <input type="text" v-model="prefix" placeholder="prefix" />
          </div>
          <div class="six wide field">
            <input type="text" v-model="uri" placeholder="http://..." />
          </div>
          <div class="four wide field">
            <button class="ui positive labeled fluid icon button"
              @click="addToContext()">
              <i class="plus icon"></i>
              Add Prefix
            </button>
          </div>
        </div>
        <!-- list existing context values -->
        <div class="fields" v-for="(addition, idx) in additions" :key="addition.prefix">
          <div class="two wide field">
            <input type="text" v-model="addition.prefix" />
          </div>
          <div class="six wide field">
            <input type="text" v-model="addition.uri" />
          </div>
          <div class="four wide field">
            <button class="ui negative icon button" @click="removeFromContext(idx)">
              <i class="icon remove"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['context'],
  data() {
    return {
      prefix: "",
      uri: "",
      additions: [], // {prefix: "", uri: ""}
      original: {} // stores a clone of the first seen context
    }
  },
  watch: {
    additions: {
      deep: true,
      handler(v, ov) {
        let obj = this.objectify(v);
        localStorage['askos-context'] = JSON.stringify(obj);
        // create a copy of the frozen original
        v.forEach((obj) => {
          // add the new properties
          this.context['@context'][obj.prefix] = obj.uri;
        });
      }
    }
  },
  computed: {
    conflicted() {
      // TODO: also check existing additions
      return this.prefix in this.original;
    }
  },
  created: function() {
    // deep clone the incoming @context
    this.original = JSON.parse(JSON.stringify(this.context['@context']));
    // freeze it, so we know what the non-customized @context was
    Object.freeze(this.original);
    if ('askos-context' in localStorage) {
      // merge context persisted in localStorage with the primary context
      // preserve application-specific mappings (see above)
      let stored = JSON.parse(localStorage['askos-context']);
      Object.keys(stored).forEach((prefix) => {
        this.additions.push({
          prefix: prefix,
          uri: stored[prefix]
        });
        this.context['@context'][prefix] = stored[prefix];
      });
    }
  },
  methods: {
    addToContext() {
      // TODO: further validate things?
      if (!this.conflicted) {
        // add to local state
        this.additions.push({
          prefix: this.prefix,
          uri: this.uri
        });
        // reset fields
        this.prefix = '';
        this.uri = '';
      }
    },
    removeFromContext(idx) {
      let removed = this.additions.splice(idx, 1);
      delete this.context['@context'][removed[0].prefix];
    },
    objectify(arr) {
      let obj = {};
      arr.forEach((o) => {
        obj[o.prefix] = o.uri;
      });
      return obj;
    }
  }
}
</script>
