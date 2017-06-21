<template>
  <div>
    <div v-if="val.length && typeof val !== 'string'">
      <div class="ui list">
        <div v-for="(v, index) in val" class="item">
          <button @click="remove(label, index)"
            class="ui mini basic red icon button"><i class="delete icon"></i></button>
          <span class="ui label" v-if="'@language' in v">
            <i class="flag" :class="v['@language']"></i>
            {{v['@language']}}
          </span>
          {{v | @value}}
        </div>
      </div>
    </div>
    <div v-else-if="Object.keys(val).length === 1 && val['@value']">
      {{val['@value']}}
    </div>
    <div v-else-if="val['@language'] && val['@value']">
      <div class="ui label">{{val['@language']}}</div>
      <span>{{val['@value']}}</span>
    </div>
    <div v-else-if="(val['@type'] === 'xsd:anyURI' || val['@type'] === 'http://www.w3.org/2001/XMLSchema#anyURI') && '@value' in val">
      <a :href="val['@value']" target="_blank">{{val['@value']}}</a>
    </div>
    <div v-else-if="val['@id']">
      <a :href="val['@id'] | uncurie" target="_blank">{{val['@id'] | curie}}
        <i class="external icon"></i>
      </a>
    </div>
    <div v-else>{{val}}</div>
  </div>
</template>

<script>
export default {
  props: ['label', 'val'],
  methods: {
    remove(label, index) {
      this.$emit('removeIntent', label, index);
    }
  }
}
</script>
