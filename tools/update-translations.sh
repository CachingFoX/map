#!/bin/zsh

echo de
print -l ./src/**/*.ts | xargs python3 ./tools/find-i18n.py -t ./src/lang/de/translation.json ./src/index.html
echo en
print -l ./src/**/*.ts | xargs python3 ./tools/find-i18n.py -t ./src/lang/en/translation.json ./src/index.html
echo fr
print -l ./src/**/*.ts | xargs python3 ./tools/find-i18n.py -t ./src/lang/fr/translation.json ./src/index.html