#!/bin/sh
# usage: tools/shot.sh out.png "KEY KEY | KEY ..."   (segments separated by | give out-0.png, out-1.png …)
EXE="C:/Users/sami6/AppData/Local/Programs/fx-991CW Emulator/fx-991CW Emulator.exe"
FX_CAPTURE="$1" FX_KEYS="$2" FX_FULL="$FX_FULL" "$EXE" >/dev/null 2>&1
