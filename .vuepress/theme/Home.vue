<template>
    <div class="home">
        <div class="header section bg-blue text-white">
            <div class="container z-10">
                <div class="text-center">
                    <div><img class="max-w-xs" :src="$withBase('pterodactyl.png')"></div>
                    <h1 class="font-normal text-4xl">The Free Gameserver Management Panel</h1>
                    <div class="mt-4"><router-link class="btn" to="/project/introduction.html">Get started</router-link><a class="btn" href="https://demo.pterodactyl.io" target="_blank">Demo</a></div>
                </div>
            </div>
            <!-- <div class="absolute pin z-0" id="particles-js"></div> -->
        </div>
        <div class="section bg-white rounded-lg" name="about">
            <div class="container text-center">
                <h1 class="text-blue mb-4">Pterodactyl Panel</h1>
                <p>
                    Pterodactyl Panel is the free, open-source, game agnostic, self-hosted control panel for users, networks, and game service providers. Pterodactyl supports games and servers such as Minecraft (including Spigot, Bungeecord, and Sponge), ARK:
                    Evolution Evolved, CS:GO, Team Fortress 2, Insurgency, Teamspeak 3, Mumble, and many more. Control all of your games from one unified interface.
                </p>
                <img class="max-w-lg w-full m-4" :src="$withBase('frontpage/mockup-macbook-grey.png')"></div>
        </div>
        <div class="section bg-blue text-white" name="features">
            <div class="container text-center">
                <h1 class="mb-4">Why Pterodactyl</h1>
                <div class="flex flex-wrap">
                    <div class="feature"><span><i class="icon icon-lock"></i></span>
                        <h3>Secure</h3> No MD5 here. We make use of the latest security standards such as BCrypt hashing and AES-256-CBC encryption.</div>
                    <div class="feature"><span><i class="icon icon-browser"></i></span>
                        <h3>Themable</h3> Every aspect of Pterodactyl is fully themeable using the Blade templating engine and your own CSS.</div>
                    <div class="feature"><span><i class="icon icon-anchor"></i></span>
                        <h3>Docker Based</h3> Pterodactyl is the first game panel to make use of Docker to control servers and harden your network.</div>
                    <div class="feature"><span><i class="icon icon-wallet"></i></span>
                        <h3>Free & Open Source</h3> Pterodactyl is 100% free and licensed under a MIT license. All of our code is completely open source as well.</div>
                    <div class="feature"><span><i class="icon icon-beaker"></i></span>
                        <h3>User Friendly</h3>Furious clicking and yelling is for video games. Pterodactyl's interface is so simple that even <a href="http://fallout.wikia.com/wiki/Dogmeat_(Fallout)">Dogmeat</a> could use it.</div>
                    <div class="feature"><span><i class="icon icon-expand"></i></span>
                        <h3>Scalable</h3>Whether you're a hosting company or some dudes playing video games, Pterodactyl has you covered.</div>
                </div>
            </div>
        </div>
        <div class="section bg-white rounded-lg" name="screenshots">
            <div class="text-center">
                <h1>Screenshots</h1>
                <div class="screenshots">
                    <slick ref="slick" :options="slickOptions">
                        <a :href="$withBase('frontpage/gallery/screenshot-1.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-1.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-2.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-2.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-3.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-3.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-4.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-4.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-5.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-5.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-6.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-6.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-7.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-7.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-8.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-8.png')"></a>
                        <a :href="$withBase('frontpage/gallery/screenshot-9.png')"><img class="max-w-lg" :src="$withBase('frontpage/gallery/screenshot-9.png')"></a>
                    </slick>
                </div>
            </div>
        </div>
        <div class="section bg-blue text-white">
            <div class="container text-center">
                <h1>Get Started</h1>
                <p class="m-4">Ready to fly on the Pterodactyl?</p>
                <div class="mt-4"><router-link class="btn" to="/project/introduction.html">Introduction</router-link><a class="btn" href="https://pterodactyl.io/discord">Discord</a></div>
            </div>
        </div>
        <div class="section bg-black text-white text-sm less-padding">
            <div class="container text-center">
                <img class="w-16" :src="$withBase('pterodactyl-flat.svg')">
                <p class="my-4">
                    There are tons of options out there when it comes to self-hosted game management panels. However, you will find no panel that can compete with Pterodactyl in terms of features, customization, stability, and most of all: price.
                </p>
                <p class="my-4">
                    We're committed to building the best software that we can, and have been working with game management panels for almost five years now. We've seen games change, and are committed to making the most flexible, lightweight, and future proof panel that we can.
                </p>
                <div class=" mt-8 pt-8 border-t border-blue px-8">MIT Licensed | Copyright © 2015 - 2018 Dane Everitt & Contributors.</div>
            </div>
        </div>
    </div>
</template>

<script>
    import NavLink from './NavLink.vue';
    import Slick from 'vue-slick';

    export default {
        components: { NavLink, Slick },
        data() {
            return {
                slickOptions: {
                    slidesToShow: 1,
                    centerMode: true,
                    centerPadding: '0',
                    speed: 1000,
                    autoplay: true,
                    variableWidth: true,
                    arrows: false,
                    dots: true,
                    pauseOnHover: false,
                    pauseOnDotsHover: true,
                },
            }
        },
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
        },
    };
</script>