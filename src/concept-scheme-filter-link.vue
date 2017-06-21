<template>
  <a :href="resource" @click.prevent="selected()">
    {{resource | curie}}
    <i class="filter icon"></i>
  </a>
</template>

<script>
export default {
  props: ['resource'],
  methods: {
    selected() {
      this.$store.commit('setActiveScheme', {
        scheme: resource
      });
    }
  }
}
</script>
