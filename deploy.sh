#!/usr/bin/env sh
set -e

yarn run build
cd .vuepress/dist

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:pterodactyl/documentation.git master:gh-pages

cd -
