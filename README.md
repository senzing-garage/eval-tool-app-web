# eval-tool-app-web

An Angular 21 single-page application for evaluating [Senzing] entity resolution results. Provides search, graph visualization, cross-source statistics, and data source management through a gRPC backend.

> **Senzing Garage** - This is a "garage" project: useful for understanding an approach to using Senzing, but not production-ready or part of the Senzing product.

## Prerequisites

- Node.js 20.x or 22.x
- A running [Senzing gRPC server](https://github.com/senzing-garage/sz-sdk-java-grpc)

## Quick start

Start the gRPC backend server:

```bash
docker run -d --name senzing-grpc \
  -p 8261:8261 \
  senzing/sz-sdk-java-grpc \
  --allowed-origins http://localhost:4200 \
  --bind-address all \
  --data-mart-database-uri sqlite3:///tmp/data-mart.db
```

Then build and start the web app:

```bash
npm install
npm run build:subrepos   # build gRPC-web and UI common libraries
npm start                # dev server on http://localhost:4200
```

## Development

```bash
npm start                # dev server (port 4200)
npm run build:subrepos   # rebuild libraries after submodule changes
npm run build            # production build
npm test                 # unit tests (Jest)
npm run e2e              # e2e tests — dev config, headed
npm run e2e:ci           # e2e tests — CI config, headless, imports truthset first
```

## Docker

### Build

```bash
docker build -t senzing/eval-tool-app-web:dev .
```

### Run

```bash
docker run -d --name eval-tool-web \
  -p 4200:4200 \
  -e SENZING_GRPC_CONNECTION_STRING=http://localhost:8261 \
  -e SENZING_WEB_SERVER_STATS_BASE_PATH=http://localhost:8261/data-mart \
  senzing/eval-tool-app-web:dev
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SENZING_GRPC_CONNECTION_STRING` | *(none)* | URL of the Senzing gRPC server (e.g. `http://localhost:8261`). Injected into the browser app config and added to the CSP `connect-src` directive. |
| `SENZING_WEB_SERVER_STATS_BASE_PATH` | `/stats` | Base URL for the data-mart statistics REST API. When the browser connects directly to the gRPC server (no reverse proxy), set this to the server's data-mart endpoint (e.g. `http://localhost:8261/data-mart`). The default `/stats` assumes requests are proxied through the Express web server. |
| `SENZING_WEB_SERVER_PORT` | `4200` | Port the web server listens on inside the container. |
| `SENZING_WEB_SERVER_STATS_WITH_CREDENTIALS` | `false` | Whether to send credentials with statistics API requests. |

### Example with gRPC server

```bash
# Start the gRPC server
docker run -d --name sz-grpc \
  -p 8261:8261 \
  senzing/sz-sdk-java-grpc \
  --allowed-origins http://localhost:4200 \
  --bind-address all \
  --data-mart-database-uri sqlite3:///tmp/data-mart.db

# Start the web app
docker run -d --name eval-tool-web \
  -p 4200:4200 \
  -e SENZING_GRPC_CONNECTION_STRING=http://localhost:8261 \
  -e SENZING_WEB_SERVER_STATS_BASE_PATH=http://localhost:8261/data-mart \
  senzing/eval-tool-app-web:dev
```

The browser at `http://localhost:4200` connects directly to the gRPC server for both gRPC-web calls and data-mart REST calls. The gRPC server's `--allowed-origins` must match the browser origin.

## License

[Apache-2.0](LICENSE)

[Senzing]: https://senzing.com
