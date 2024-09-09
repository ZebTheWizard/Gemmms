FROM oven/bun

WORKDIR /usr/src/app

COPY build.sh ./

# # Dependency layer
COPY bun.lockb ./
COPY package.json ./
COPY index.js ./

RUN bun install --verbose

COPY ./docs ./docs

# # Build layer
RUN bun build:compile

COPY ./postcss.config.js ./
COPY ./tailwind.config.js ./
COPY ./eleventy.config.js ./

COPY data ./data
COPY src ./src

RUN ./build.sh

CMD ["./server"]
