<template>
    <div class="home">
        <div class="hero">
            <img v-if="data.heroImage" :src="$withBase(data.heroImage)" alt="hero">
            <h1>{{ data.heroText || $title || 'Hello' }}</h1>
            <p class="description">
                {{ data.tagline || $description || 'Welcome to your VuePress site' }}
            </p>
            <p class="action" v-if="data.actionText && data.actionLink">
                <NavLink class="action-button" :item="actionLink"/>
            </p>
        </div>
        <div class="features" v-if="data.features && data.features.length">
            <div class="feature" v-for="feature in data.features">
                <h2>{{ feature.title }}</h2>
                <p>{{ feature.details }}</p>
            </div>
        </div>
        <Content custom/>
        <div class="footer" v-if="data.footer">
            {{ data.footer }}
        </div>
    </div>
</template>

<script>
    import NavLink from './NavLink.vue';

    export default {
        components: { NavLink },
        computed: {
            data() {
                return this.$page.frontmatter;
            },
            actionLink() {
                return {
                    link: this.data.actionLink,
                    text: this.data.actionText
                };
            }
        }
    };
</script>
