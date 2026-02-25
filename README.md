# eval-tool-app-web

An Angular 19 single-page application for evaluating [Senzing] entity resolution results. Provides search, graph visualization, cross-source statistics, and data source management through a gRPC backend.

> **Senzing Garage** - This is a "garage" project: useful for understanding an approach to using Senzing, but not production-ready or part of the Senzing product.

## Prerequisites

- Node.js 20.x or 22.x
- A running [Senzing gRPC server](https://github.com/senzing-garage/sz-sdk-java-grpc)

## Quick start

```bash
npm install
npm run build:subrepos   # build REST client and UI common libraries
npm start                # dev server on http://localhost:4200
```

## Development

```bash
npm start                # dev server (port 4200)
npm run build:subrepos   # rebuild libraries after submodule changes
npm run build            # production build
npm test                 # unit tests (Karma/Jasmine)
npm run e2e              # e2e tests — dev config, headed
npm run e2e:ci           # e2e tests — CI config, headless, imports truthset first
```

## Project structure

```
src/
  app-ui/              # main Angular application
  rest-api-client-ng/  # REST API client library (submodule)
  ui-common/           # shared UI components library (submodule)
e2e/
  setup/               # CI-only setup (truthset import)
  pages/               # page render smoke tests
  graph/               # graph feature tests
  entity/              # entity detail tests
  review/              # review/statistics tests
  datasources/         # data source tests
  debug/               # scratch/debug tests (excluded from runs)
run/                   # runtime servers (web, config, auth)
```

## License

[Apache-2.0](LICENSE)

[Senzing]: https://senzing.com
