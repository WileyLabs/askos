<template>
  <div class="ui search selection dropdown multiple" :class="{active: ui.open, visible: ui.open}"
    v-click-outside="close"
    @click="focus">
    <i class="dropdown icon" @click.stop="ui.open = !ui.open"></i>
    <a v-if="Object.keys(chosen).length > 0" v-for="(text, value) in chosen" :data-value="value"
      class="ui label transition visible" style="display: inline-block !important;">
      {{text}}<i class="delete icon" @click.stop="unchoose(value)"></i></a>
    <input class="search" autocomplete="off" tabindex="0" v-model="filter"
      @focus="ui.open = true">
    <span class="sizer" style=""></span>
    <div class="default text" :class="{filtered: ui.hidePlaceholder}">{{placeholder}}</div>
    <div class="menu transition" tabindex="-1" :class="{hidden: !ui.open, visible: ui.open}">
      <div class="item" v-for="(text, value) in filtered" :data-value="value"
        @click.stop="choose(value, text)">{{text}}</div>
      <div class="message" v-if="Object.keys(filtered).length === 0">
        No results found.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['options', 'placeholder', 'value'],
  data() {
    return {
      ui: {
        hidePlaceholder: false,
        open: false
      },
      filter: '',
      chosen: {},
      // internal value/text object for storing unique options
      actual_options: {}
    };
  },
  created() {
    // normalize the passed in `options` into the internal `_options`
    if (Array.isArray(this.options)) {
      this.options.forEach((o) => {
        if (typeof o === 'string') {
          this.actual_options[o] = o;
        } else {
          // assume we've got the object shape
          this.actual_options[o.value] = o.text;
        }
      });
    } else {
      // let's assume we have an object...just 'cause...
      this.actual_options = this.options;
    }
    // add any passed in values to the `chosen`
    if (Array.isArray(this.value)) {
      this.value.forEach((v) => {
        this.chosen[v] = this.actual_options[v];
      });
    }
  },
  watch: {
    filter(v) {
      if (v.length > 0) {
        this.ui.hidePlaceholder = true;
      } else {
        this.ui.hidePlaceholder = false;
      }
    },
    chosen() {
      // let upstairs know something changed here
      this.$emit('input', Object.keys(this.chosen));
    }
  },
  computed: {
    filtered() {
      let filtered = {};
      for (let key in this.actual_options) {
        // exclude already selected options
        if (key in this.chosen) continue;
        // then filter off of `filter` search text
        let value = this.actual_options[key].toLowerCase();
        if (value.indexOf(this.filter.toLowerCase()) > -1) {
          filtered[key] = this.actual_options[key];
        }
      }
      return filtered;
    }
  },
  methods: {
    choose(value, text) {
      this.$set(this.chosen, value, text);
      this.filter = '';
      this.focus();
    },
    unchoose(value) {
      this.$delete(this.chosen, value);
      this.focus();
    },
    close() {
      this.ui.open = false;
    },
    focus() {
      this.$el.querySelector('input.search').focus();
    }
  }
}
</script>
