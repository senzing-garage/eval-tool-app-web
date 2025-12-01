ARG BUILD_IMAGE=node:22-bookworm-slim@sha256:f9f7f95dcf1f007b007c4dcd44ea8f7773f931b71dc79d57c216e731c87a090b
ARG PROD_IMAGE=node:22-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e
ARG TEST_IMAGE=node:20-bookworm-slim@sha256:ec35a66c9a0a275b027debde05247c081f8b2f0c43d7399d3a6ad5660cee2f6a

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2025-28-11

LABEL Name="senzing/eval-tool-app-web" \
  Maintainer="support@senzing.com" \
  Version="0.1.0"

#HEALTHCHECK CMD ["/app/healthcheck.sh"]

# Set working directory.
COPY ./rootfs /
WORKDIR /

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install and cache app dependencies.
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY ./packages /app/packages
WORKDIR /app

#RUN npm config set update-notifier false \
#  && npm config set loglevel warn \
#  && npm ci \
#  && npm install -g @angular/cli@19
RUN npm ci 
RUN npm install -g @angular/cli@19

# Build app
COPY . /app
RUN npm run build:subrepos
RUN npm run build:docker

# production output stage
FROM ${PROD_IMAGE}
WORKDIR /app

# Copy files from repository.
COPY ./rootfs /
COPY ./run /app/run
COPY ./packages /app/packages
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY --from=0 /app/dist /app/dist

# cleanup
# RUN npm config set update-notifier false \
#  && npm config set loglevel warn \
#  && npm ci --configuration production
RUN npm ci --configuration production

# update npm vulnerabilities
# RUN npm -g uninstall npm
# RUN rm -fr /usr/local/lib/node_modules/npm

#COPY . /app
COPY --chown=1001:1001 ./proxy.conf.json /app

USER 1001

# Health Check
HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \
  CMD node /app/run/health/check.js

# Runtime execution.
WORKDIR /app
ENTRYPOINT [ "node" ]
CMD ["./run/scripts/start-webserver"]
