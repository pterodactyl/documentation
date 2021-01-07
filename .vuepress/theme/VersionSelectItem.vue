<template>
  <div class="inline-block">
    {{ version.title || version.name }}
    <span class="rounded-full ml-2" :class="classes">{{version.status}}</span>
  </div>
</template>

<script>
import VersionSelectItem from "./VersionSelectItem.vue";

export default {
  name: "VersionSelectItem",
  props: {
    version: {
      type: Object,
      required: true
    }
  },
  computed: {
    classes() {
      return (
        {
          deprecated: ["text-orange"],
          current: ["text-green-dark"],
          stable: ["text-green-dark"],
          beta: ["text-blue"]
        }[this.version.status] || ["text-grey"]
      );
    }
  }
};
</script>