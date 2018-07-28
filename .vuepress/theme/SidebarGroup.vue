<template>
    <div class="sidebar-group" :class="{ first, collapsable }">
        <p class="sidebar-heading" :class="{ open }" @click="$emit('toggle')">
            <span>{{ item.title }}</span>
            <span class="arrow"
                  v-if="collapsable"
                  :class="open ? 'down' : 'right'"></span>
        </p>
        <DropdownTransition>
            <ul class="sidebar-group-items" ref="items" v-if="open || !collapsable">
                <li v-for="child in item.children">
                    <SidebarLink :item="child"/>
                </li>
            </ul>
        </DropdownTransition>
    </div>
</template>

<script>
    import SidebarLink from './SidebarLink.vue';
    import DropdownTransition from './DropdownTransition.vue';

    export default {
        name: 'SidebarGroup',
        props: ['item', 'first', 'open', 'collapsable'],
        components: { SidebarLink, DropdownTransition }
    };
</script>
