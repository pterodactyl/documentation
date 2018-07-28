<template>
    <div class="theme-container">
        <div class="content error-page">
            <h1>404</h1>
            <blockquote>{{ getMsg() }}</blockquote>
            <router-link to="/">Take me home.</router-link>
        </div>
    </div>
</template>

<script>
    const msgs = [
        `There's nothing here.`,
        `How did we get here?`,
        `That's a Four-Oh-Four.`,
        `Looks like we've got some broken links.`,
        `Who let Dogmeat mess with the documentation again?`,
        `Someone unplugged the ethernet cable... again.`,
        `Couldn't locate that cap'n, should we start over?`,
        `I don't like this game of hide'n'seek anymore.`
    ];

    export default {
        methods: {
            getMsg() {
                return msgs[Math.floor(Math.random() * msgs.length)];
            }
        }
    };
</script>
