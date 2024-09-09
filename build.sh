#!/bin/bash

OUTPUT_DIR=docs
INPUT_DIR=src/public
DEBUG=Eleventy*

rm -rf $OUTPUT_DIR
bun x tailwindcss --input ./src/public/app.css --output ./docs/app.min.css --minify

for filename in src/public/img/illustrations/*.webp; do
    cache="$(echo ${filename%.*} | sed 's|src/public|.cache|g')"
    docs="$(echo ${filename%.*} | sed 's|src/public|docs|g')"
    if [ ! -d "$cache" ]; then
        mkdir -p "$cache"

        ffmpeg -i $filename -y -vf scale=16:16 "$cache/thumb@16x16.webp"
        ffmpeg -i $filename -y -vf scale=32:32 "$cache/thumb@32x32.webp"
        ffmpeg -i $filename -y -vf scale=64:64 "$cache/thumb@64x64.webp"
        ffmpeg -i $filename -y -vf scale=128:128 "$cache/thumb@128x128.webp"
        ffmpeg -i $filename -y -vf scale=256:256 "$cache/thumb@256x256.webp"
        ffmpeg -i $filename -y -vf scale=512:512 "$cache/thumb@512x512.webp"
        ffmpeg -i $filename -y -vf scale=1024:1024 "$cache/thumb@1024x1024.webp"
    fi

    mkdir -p "$docs"
    cp -r "$cache/." "$docs/"
done

APP_DOMAIN="${APP_DOMAIN:=gemmms.com}" bun x @11ty/eleventy --input $INPUT_DIR --output $OUTPUT_DIR "$@"
