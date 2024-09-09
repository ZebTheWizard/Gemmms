FROM oven/bun

WORKDIR /usr/src/app

RUN apt-get update -qq && apt-get install ffmpeg -y

COPY build.sh ./

# # Dependency layer
COPY bun.lockb ./
COPY package.json ./
COPY index.js ./

RUN bun install --verbose

# # Build layer
RUN bun build:compile

COPY ./postcss.config.js ./
COPY ./tailwind.config.js ./
COPY ./eleventy.config.js ./

COPY data ./data
COPY src ./src

RUN ./build.sh

RUN ls -la ./docs/img/illustrations/amethyst

CMD ["./server"]
