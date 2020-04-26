<template>
  <div class="sidebar-group" :class="{ first, collapsable }">
    <p class="sidebar-heading" :class="{ open }" @click="$emit('toggle')">
      <span>{{ item.title }}</span>
      <span class="arrow" v-if="collapsable" :class="open ? 'down' : 'right'"></span>
      <VersionSelect
        class="float-right"
        v-if="isVersioned"
        :versions="item.versions"
        v-model="versionSelect"
      />
    </p>
    <DropdownTransition>
      <ul class="sidebar-group-items" ref="items" v-if="open || !collapsable">
        <li v-for="child in children">
          <SidebarLink :item="child" />
        </li>
      </ul>
    </DropdownTransition>
  </div>
</template>

<script>
import SidebarLink from "./SidebarLink.vue";
import DropdownTransition from "./DropdownTransition.vue";
import VersionSelect from "./VersionSelect.vue";

export default {
  name: "SidebarGroup",
  props: ["item", "first", "open", "collapsable"],
  components: { SidebarLink, DropdownTransition, VersionSelect },
  data: function() {
    let isVersioned = this.item.versions.length > 0;

    let versionSelect = "";
    if (isVersioned) {
      versionSelect = this.item.currentVersion || this.item.versions[0].name;
      if (this.$router.currentRoute.path.startsWith(this.item.path)) {
        const pathVersion = this.$router.currentRoute.path.split("/")[2];
        versionSelect = ~this.item.versions
          .map(v => v.name)
          .indexOf(pathVersion)
          ? pathVersion
          : this.item.currentVersion;
      }
    }

    return {
      isVersioned,
      versionSelect
    };
  },
  watch: {
    versionSelect(newVersion, oldVersion) {
      if (
        oldVersion !== newVersion &&
        this.$router.currentRoute.path.startsWith(this.item.path) &&
        this.selectedVersion.children.length > 0
      ) {
        // Try to navigate to the same page in the new version, or default to the first one
        let path = this.$router.currentRoute.path;
        path = path.substr(path.indexOf(oldVersion) + oldVersion.length);
        this.$router.push(
          this.selectedVersion.children.find(c => {
            return c.path.endsWith(path);
          }) || this.selectedVersion.children[0]
        );
      }
    },
    $route(to, from) {
      if (this.isVersioned && to.path.startsWith(this.item.path)) {
        const pathVersion = to.path.split("/")[2];
        if (~this.item.versions.map(v => v.name).indexOf(pathVersion)) {
          this.versionSelect = pathVersion;
        }
      }
    }
  },
  computed: {
    selectedVersion: function() {
      return this.item.versions.find(v => v.name === this.versionSelect);
    },
    children: function() {
      return this.isVersioned
        ? this.selectedVersion.children
        : this.item.children;
    }
  }
};
</script>
