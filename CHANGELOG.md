# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-09

### Added

- **Data source management** — File import with drag-and-drop, JSONL/JSON/CSV parsing,
  inline data source name editing, confirmation dialogs for existing data sources,
  and mapping help dialog
- **Overview / Statistics** — Summary statistics on data source cards, cross-source
  venn diagrams, sample review table with cross-source results
- **Initialization spinner** — Overview page shows a branded "Initializing"
  spinner until all child components (donut, license, cross-source-select,
  cross-source-summary) report their initial data has loaded
- **Spinner styling** — Larson scanner color chase animation with Senzing brand
  colors (red #cc2229, white, dark gray #3c3a3c), rounded box container with
  Montserrat font label
- **Configurable spinner label** — `SpinnerService.show(label?)` sets a custom
  label; `hide()` resets to default "Loading"
- **Component initialized outputs** — `@Output() initialized` on donut,
  license, cross-source-select, cross-source-summary, and graph components
  in ui-common (emits once on first data load, error, or timeout)
- **How Report** — Entity resolution "How" report page with step navigation
- **Why Report** — Why record and why entities dialogs (gRPC)
- **Settings page** — Preferences form for all `SzPrefsService` options with
  hidden sections/preferences support and identifier type picker
- **Graph improvements** — Link labels, edge expansion, filter persistence,
  tooltip opacity fixes, data source color support, zoom in/out/reset controls
  on entity detail page
- **Search** — Identifier picker dialog, search history, entity ID click
  navigation from cross-source results
- **Resolution polling** — Card states and view errors dialog for data source
  resolution tracking
- **Docker support** — Dockerfile with multi-stage build, runtime configuration
  via environment variables (`SENZING_GRPC_CONNECTION_STRING`,
  `SENZING_WEB_SERVER_STATS_BASE_PATH`, etc.), CSP with dynamic inline script
  hashing, health check endpoint
- **E2E testing** — Playwright test suite with dev and CI configurations,
  truthset import setup project, page render smoke tests, feature tests for
  datasources, entity detail, graph, cross-source review (column resize, venn
  click updates table, venn singular mode), and debug tests for duplicate rows,
  venn counts, and Entity ID rowspan verification
- **CI workflows** — GitHub Actions for build validation and E2E testing with
  Dependabot for GitHub Actions, Docker, and npm

### Changed

- Upgraded Angular from 19 to 21 (via 20), including Angular Material 21,
  Angular CDK 21, and related dependencies
- Replaced vendored `sz-sdk-typescript-grpc-web` tarball with git submodule,
  enabling direct builds from source
- Updated `sz-sdk-typescript-grpc` submodule to latest main with ESM web build
  fixes (named exports, `.js` extension resolution)
- Replaced REST API-based data flow with gRPC-web for entity search, graph
  queries, config management, and record loading
- Updated Dockerfile to build grpc-web package from submodule instead of
  `packages/` directory
- Centralized excluded data sources (TEST, SEARCH) with filtering across
  UI components
- Migrated unit tests from Karma/Jasmine to Jest using Angular's built-in
  `@angular-devkit/build-angular:jest` builder, fixing CI timeouts caused
  by Karma's watch mode
- Removed `@senzing/rest-api-client-ng` dependency in favor of direct REST calls

### Removed

- **Admin authentication** — Removed authserver, JWT/SSO guards, token
  interceptors, `AdminAuthService`, `AuthGuardService`, `oAuthInterceptor`,
  `AdminBulkDataService`, and auth config factory. The eval tool is a
  single-user application and does not require authentication.
- **Websocket streaming** — Removed `POCStreamConfig`, stream connection
  properties, `SzAdminPrefs`, `AdminStreamConnProperties`,
  `AdminStreamAnalysisConfig`, `AdminStreamLoadConfig`, streaming detection
  in runtime datastore, and settings UI for streaming preferences.
  Record loading now uses gRPC exclusively. The `SzStreamingFileRecordParser`
  has been moved to `deprecated/` for reference.
- Removed `express-basic-auth`, `express-jwt`, `jsonwebtoken` dependencies
- Removed Karma and Jasmine dependencies (`karma`, `karma-chrome-launcher`,
  `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`,
  `jasmine-core`, `@types/jasmine`)

### Fixed

- Subscription memory leaks — added `takeUntil` cleanup to route params,
  service observables, and dialog subscriptions across `HowComponent`,
  `DetailComponent`, `GraphComponent`, `AppDataSourcesComponent`, and
  `AppDataFilesComponent`
- Removed leaked debug `search.results` subscription in `GraphComponent`
- `onDoubleClick` in data source collection now checks actual card state
  (`resolved`, `mappingComplete`, `mappingLearned`) instead of hardcoded `false`
- `onLoadDataSource` null dereference when `_uploadedFiles` is undefined
- Dead duplicate `if/else` branches collapsed in `processRecords`
- Removed dead `handleNewFromDrive` method and unused variables in
  `onDeleteDataSources`
- Removed unused `SzDataSourcesService` injection in data source card component
- `env.destroy()` calls removed — `SzGrpcEnvironment` has no destroy method
- gRPC readiness check in CI workflow replaced bogus HTTP `/health` poll with
  TCP port probe (container has no health endpoint)
- Donut chart data source labels now navigate to `/review/{datasource}` on click
- SCSS and template deprecation warnings
- Graph link labels blank due to matchKey casing mismatch (gRPC UPPER_CASE
  vs REST camelCase)
- Adaptive polling for product/license gRPC requests
- Cross-source row count and matchKey column key fixes
- Empty line filtering when parsing JSONL files
- Data source card status not updating after records loaded
- Express/proxy middleware breaking changes
- SpinnerModule providing its own SpinnerService instance, shadowing the root
  singleton and preventing the spinner from rendering
- Review page spinner not dismissing after data load
- Cross-source data table duplicate rows caused by bidirectional API relations
- Related entity rows not rendering (`isRelation` check using wrong property)
- Related record rows missing Name, Address, Identifier, and other feature data
- Entity ID column rowspan mismatch in cross-source views when using two
  data sources (`isDataSourceSelected` not respecting `dataSourceName` parameter)
- Match Key column empty on related entity rows (missing `matchKey`,
  `matchType`, `principle` on `SzSampleSetRelation` during API transformation)
- DOB feature data silently dropped due to map key mismatch (`get('DOB_DATA')`
  instead of `get('DOB')`)
- Column resize indicator offset and mouseup outside header not ending resize
- Venn diagrams showing overlap mode when only single source selected
- Review page cross-source select issues
- Hidden incomplete statistics and composition nav items
