<template>
  <div class="version-select custom-select" :tabindex="tabindex" @blur="open = false">
    <div class="selected" :class="{open: open}" @click="open = !open">
      <VersionSelectItem :version="selected" />
      <span class="arrow"></span>
    </div>
    <div class="items" :class="{hidden: !open}">
      <div
        class="item"
        v-for="version in versions"
        :key="version.name"
        @click="selected=version; open=false; $emit('input', version.name)"
      >
        <VersionSelectItem :version="version" />
      </div>
    </div>
  </div>
</template>

<script>
import VersionSelectItem from "./VersionSelectItem.vue";

export default {
  name: "VersionSelect",
  components: { VersionSelectItem },
  props: {
    versions: {
      type: Array,
      required: true
    },
    tabindex: {
      type: Number,
      required: false,
      default: 0
    },
    value: {
      type: String,
      required: false
    }
  },
  data: function() {
    return {
      selected:
        this.versions.find(v => v.name === this.value) ||
        (this.versions.length > 0 ? this.versions[0] : null),
      open: false
    };
  },
  watch: {
    value(newValue, oldValue) {
      if (newValue !== oldValue) {
        let version = this.versions.find(v => v.name === this.value);
        if (version) {
          this.selected = version;
        }
      }
    }
  },
  mounted() {
    this.$emit("input", this.selected.name);
  }
};
</script>