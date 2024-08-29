<template>
    <div class="home">
        <div class="header section bg-blue text-grey-lightest less-padding emphasize">
            <div class="container z-10">
                <div class="text-center">
                    <div>
                        <img class="max-w-xl w-full inline-block" src="https://cdn.pterodactyl.io/logos/new/pterodactyl_logo_transparent.png" alt="Pterodactyl">
                    </div>
                    <div class="mt-4">
                        <!-- <a class="btn hidden md:inline-block" href="https://demo.pterodactyl.io" target="_blank" rel="nofollow noopener">Demo</a> -->
                        <router-link class="btn inline-block" to="/panel/getting_started.html">Let's Get Started!</router-link>
                    </div>
                </div>
            </div>
        </div>
        <div class="section bg-white">
            <div class="container text-center">
                <h1 class="text-blue mb-4">Pterodactyl Panel</h1>
                <h3 class="border-0 font-normal leading-normal mx-auto" style="max-width: 50rem">
                    Pterodactyl&reg; is a free, open-source game server management panel built with PHP, React, and Go.
                    Designed with security in mind, Pterodactyl runs all game servers in isolated Docker containers
                    while exposing a beautiful and intuitive UI to end users.
                </h3>
                <h3 class="border-0 leading-normal mx-auto mt-4" style="max-width: 50rem">
                    Stop settling for less. Make game servers a first class citizen on your platform.
                </h3>
                <img class="max-w-lg w-full m-4 inline-block" src="https://cdn.pterodactyl.io/site-assets/mockup-macbook-grey-1.0.png">
            </div>
        </div>
        <div class="section bg-blue text-grey-lightest">
            <div class="container text-center">
                <h1 class="mb-4">Why Pterodactyl&reg;</h1>
                <div class="flex flex-wrap">
                    <div class="feature">
                        <span><i class="icon icon-lock"></i></span>
                        <h3>Security First</h3>
                        <p>Security is a first-class citizen on this platform with bcrypt hashing, AES-256-CBC encryption, and HTTPS support out of the box.</p>
                    </div>
                    <div class="feature">
                        <span><i class="icon icon-beaker"></i></span>
                        <h3>Modern Tooling</h3>
                        <p>Built on a modern stack utilizing the best design practices that make it easy to jump in and make modifications.</p>
                    </div>
                    <div class="feature">
                        <span><i class="icon icon-anchor"></i></span>
                        <h3>Docker to the Core</h3>
                        <p>All servers run in isolated Docker containers that limit attack vectors, provide strict resource limits, and provide environments tailored to each specific game.</p>
                    </div>
                    <div class="feature">
                        <span><i class="icon icon-wallet"></i></span>
                        <h3>Free & Open Source</h3>
                        <p>Pterodactyl is 100% free and licensed under a MIT license. All of our code is completely open source as well.</p>
                    </div>
                    <div class="feature">
                        <span><i class="icon icon-browser"></i></span>
                        <h3>User Friendly</h3>
                        <p>Save the furious clicking and screaming for Overwatch. Pterodactyl's interface is designed so well even Hanzo can use it.</p>
                    </div>
                    <div class="feature">
                        <span><i class="icon icon-expand"></i></span>
                        <h3>Scalable</h3>
                        <p>Whether you're a hosting company, the next Hyplex, or just some dudes playing video games, we've got you covered.</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="section bg-white">
            <div class="text-center">
                <h1>Screenshots</h1>
                <div class="screenshots">
                    <slick ref="slick" :options="slickOptions">
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-1.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-1.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-2.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-2.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-3.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-3.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-4.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-4.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-5.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-5.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-6.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-6.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-7.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-7.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-8.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-8.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-9.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-9.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-10.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-10.png">
                        </a>
                        <a href="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-11.png">
                            <img src="https://cdn.pterodactyl.io/site-assets/carousel/screenshot-11.png">
                        </a>
                    </slick>
                </div>
            </div>
        </div>
        <div class="section bg-blue text-grey-lightest">
            <div class="container text-center">
                <h1>Get Started</h1>
                <p class="m-4">Ready to fly on the Pterodactyl?</p>
                <div class="mt-4">
                    <router-link class="btn inline-block" to="/project/introduction.html">About the project</router-link>
                    <a class="btn inline-block" href="https://discord.gg/pterodactyl">Discord</a>
                </div>
            </div>
        </div>
        <div class="section bg-black text-grey-lighter text-sm less-padding">
            <div class="container text-center">
                <div>
                    <img class="h-20" :src="$withBase('logos/banner_logo.png')" alt="pterodactyl banner logo">
                </div>
                <div class="text-left md:flex">
                    <div class="flex-none w-full md:w-1/2 md:pr-12">
                        <p class="my-4">
                            Since 2015 Pterodactyl&reg; has been delivering robust, performant, and secure software that allows
                            individuals, networks, and hosting companies to run game servers at scale; easily. Best of all?
                            No exorbitant monthly costs.
                        </p>
                        <p class="my-4">
                            Take the plunge today and discover why thousands of users trust Pterodactyl&reg; to manage their
                            game servers.
                        </p>
                    </div>
                    <div class="hidden md:block md:flex-1 md:pr-12">
                        <p><a class="text-grey-lightest" href="https://github.com/pterodactyl">GitHub</a></p>
                        <p><a class="text-grey-lightest" href="https://github.com/sponsors/matthewpi">Sponsor</a></p>
                        <p><a class="text-grey-lightest" href="https://paypal.me/PterodactylSoftware">Donate</a></p>
                        <p><a class="text-grey-lightest" href="/panel/troubleshooting.html">Troubleshooting</a></p>
                        <p><a class="text-grey-lightest" href="https://github.com/parkervcp/eggs">Additional Game Configurations</a></p>
                    </div>
                    <div class="text-center mt-8 md:flex-1 md:mt-0">
                        <a href="https://discord.gg/pterodactyl" target="_blank" rel="nofollow noopener">
                            <img src="https://cdn.pterodactyl.io/site-assets/discord.png" class="w-3/4">
                        </a>
                    </div>
                </div>
                <div class="footer">MIT Licensed | Pterodactyl&reg; Copyright &copy; Dane Everitt and contributors</div>
            </div>
        </div>
    </div>
</template>

<script>
    import NavLink from './NavLink.vue';
    import Slick from './SlickCarousel.vue';

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
