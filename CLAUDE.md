# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Senzing Eval Tool App Web - An Angular 19 SPA for entity resolution evaluation. Part of Senzing Garage (experimental, not production-ready).

## Common Commands

```bash
# Development
npm start                    # Dev server on port 4200
npm run watch                # Watch mode for development

# Building
npm run build:subrepos       # Build REST client and UI common libraries (run first if changed)
npm run build:app            # Build libs + main app
npm run build                # Build main app only

# Testing
npm test                     # Run unit tests (Karma/Jasmine)
npx playwright test          # Run E2E tests

# Docker
npm run build:docker         # Docker production build
npm run start:docker         # Docker dev server
```

## Architecture

### Monorepo Structure

- `/src/app-ui` - Main Angular application
- `/src/rest-api-client-ng` - REST API client library (ng-packagr)
- `/src/ui-common` - Shared UI components library (ng-packagr)
- `/run` - Runtime servers (webserver, configserver, authserver)

### Key Technologies

- **Angular 19** with standalone components (no NgModules)
- **Angular Material 19** for UI components
- **RxJS** for reactive state management (service-based, no Redux)
- **gRPC Web** for entity search and graph queries
- **REST API** for statistics/datamart data

### Data Flow

1. **Resolvers** pre-fetch data before route activation (`EntityDetailResolverService`, `SearchResultsResolverService`, etc.)
2. **Services** manage state via RxJS Subjects/BehaviorSubjects
3. **Components** subscribe to service observables

### Key Services

- `EntitySearchService` - Search results, selected entity, records
- `UiService` - UI state (nav expanded, search expanded, graph open)
- `PrefsManagerService` - User preferences (local/session/memory storage)
- `SpinnerService` - Loading state

### Feature Organization

Components are grouped by feature under `/src/app-ui`:
- `search/` - Entity search
- `detail/` - Entity detail view
- `graph/` - Graph visualization (D3-based)
- `datasources/` - Data source management
- `statistics/` - Statistics/overview pages
- `dialogs/` - Modal dialogs
- `errors/` - Error pages (404, 500, 504)

### Environment Configuration

Environment files in `/environments`:
- `environment.ts` - Development
- `environment.prod.ts` - Production
- `environment.docker.ts` - Docker
- `environment.test.ts` - Test

Providers configured in `app.config.ts` with factories for `GRPC_ENVIRONMENT`, `DATAMART_ENVIRONMENT`, `REST_ENVIRONMENT`.

### Styling

- SCSS with Angular Material theming
- Senzing theme imported from ui-common library
- Responsive breakpoints: `layout-wide` (1021px+), `layout-medium`, `layout-narrow`, `layout-super-narrow`

## Development Notes

- Run `npm run build:subrepos` after modifying the REST client or UI common libraries
- Use `proxy.conf.json` to configure local backend service proxying
- The app uses standalone Angular components - no NgModules in main app
