#!/bin/bash

OUTPUT_DIR=docs
INPUT_DIR=src/public
DEBUG=Eleventy*

rm -rf $OUTPUT_DIR
bun x tailwindcss --input ./src/public/app.css --output ./docs/app.min.css --minify

APP_DOMAIN="${APP_DOMAIN:=example.com}" bun x @11ty/eleventy --input $INPUT_DIR --output $OUTPUT_DIR "$@"
