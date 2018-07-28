<template>
    <header class="nav">
        <SidebarButton class="block md:hidden flex-no-shrink" @toggle-sidebar="$emit('toggle-sidebar')"/>
        <div class="logo-container">
            <router-link :to="$localePath" class="home-link">
                <img class="logo"
                     v-if="$site.themeConfig.logo"
                     :src="$withBase($site.themeConfig.logo)">
                <span class="site-name hidden md:inline"
                      v-if="$siteTitle"
                      :class="{ 'can-hide': $site.themeConfig.logo }">
        {{ $siteTitle }}
      </span>
            </router-link>
        </div>
        <div class="w-full">
            <div class="flex">
                <SearchBox/>
                <NavLinks class="hidden md:flex"/>
            </div>
        </div>
    </header>
</template>

<script>
    import SidebarButton from './SidebarButton.vue';
    import AlgoliaSearchBox from '@AlgoliaSearchBox';
    import SearchBox from './SearchBox.vue';
    import NavLinks from './NavLinks.vue';

    export default {
        components: { SidebarButton, NavLinks, SearchBox, AlgoliaSearchBox },
        computed: {
            algolia() {
                return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {};
            },
            isAlgoliaSearch() {
                return this.algolia && this.algolia.apiKey && this.algolia.indexName;
            }
        }
    };
</script>
