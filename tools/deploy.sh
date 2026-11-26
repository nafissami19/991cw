#!/bin/sh
# Copies the app into the installed CW runtime (resources/app).
D="C:/Users/sami6/AppData/Local/Programs/fx-991CW Emulator/resources/app"
cd "$(dirname "$0")/.."
rm -rf "$D"; mkdir -p "$D"
cp -r src electron build node_modules package.json "$D/"
