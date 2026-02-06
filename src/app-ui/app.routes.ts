import { Routes } from '@angular/router';
import {
  SearchResultsResolverService,
  SearchParamsResolverService,
  SearchByIdParamsResolverService,
  EntityDetailResolverService,
  CurrentEntityUnResolverService,
  GraphEntityNetworkResolverService,
  RecordResolverService } from './services/entity-search.service';

import { AppSearchComponent } from './search/search.component';
import { AppSearchByIdComponent } from './search/search-by-id.component';
//import { SearchResultsComponent } from './search-results/search-results.component';
import { SearchRecordComponent } from './record/record.component';
import { DetailComponent } from './detail/detail.component';
import { HowComponent } from './how/how.component';
import { GraphComponent } from './graph/graph.component';
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
//import { TipsComponent } from './common/tips/tips.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';
//import { AboutComponent } from './about/about.component';
import { BlankComponent } from './common/blank/blank.component';
import { AppOverViewComponent } from './statistics/overview/overview.component';
import { AppLicenseComponent } from './license/license.component';
import { AppDataSourcesComponent } from './datasources/data-sources.component';
import { AppDataFilesComponent } from './datasources/data-files/data-files.component';
import { AppSettingsComponent } from './settings/settings.component';
import { SampleReviewComponent } from './review/sample-review.component';
import { SzCrossSourceSummaryCategoryType } from '@senzing/eval-tool-ui-common';

export const routes: Routes = [
  { path: 'debug', component: BlankComponent},
  //{ path: 'datasources', component: AppDataSourcesComponent },
  /** sample review data table related */
  { path: 'review', component: SampleReviewComponent,                                                 },
  { path: 'review/:datasource1', component: SampleReviewComponent,                                    },
  { path: 'review/:datasource1/matches', component: SampleReviewComponent,                            data: {statType: SzCrossSourceSummaryCategoryType.MATCHES} },
  { path: 'review/:datasource1/ambiguous', component: SampleReviewComponent,                          data: {statType: SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES} },
  { path: 'review/:datasource1/possible-matches', component: SampleReviewComponent,                   data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES} },
  { path: 'review/:datasource1/possible-relations', component: SampleReviewComponent,                 data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS} },
  { path: 'review/:datasource1/disclosed-relations', component: SampleReviewComponent,                data: {statType: SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS} },
  { path: 'review/:datasource1/vs/:datasource2', component: SampleReviewComponent,                    },
  { path: 'review/:datasource1/vs/:datasource2/matches', component: SampleReviewComponent,            data: {statType: SzCrossSourceSummaryCategoryType.MATCHES} },
  { path: 'review/:datasource1/vs/:datasource2/ambiguous', component: SampleReviewComponent,          data: {statType: SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES} },
  { path: 'review/:datasource1/vs/:datasource2/possible-matches', component: SampleReviewComponent,   data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES} },
  { path: 'review/:datasource1/vs/:datasource2/possible-relations', component: SampleReviewComponent, data: {statType: SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS} },
  { path: 'review/:datasource1/vs/:datasource2/disclosed-relations', component: SampleReviewComponent,data: {statType: SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS} },
  /** data files */
  { path: 'datasources', component: AppDataFilesComponent},
  /** entity detail */
  { path: 'entity/:entityId', component: DetailComponent, resolve: { entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  /** how report */
  { path: 'how/:entityId', component: HowComponent, data: { animation: 'search-detail' } },
  /** graph */
  { path: 'graph', pathMatch: 'full', component: AppSearchComponent, resolve: {entityId: CurrentEntityUnResolverService, params: SearchParamsResolverService}, data: { animation: 'search-results', openResultLinksInGraph: true, openSearchResultsInGraph: false } },
  { path: 'graph/:entityId', component: GraphComponent, resolve: { networkData: GraphEntityNetworkResolverService, entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'graph/:entityId/:detailId', component: GraphComponent, resolve: { networkData: GraphEntityNetworkResolverService, entityData: EntityDetailResolverService }, data: { animation: 'search-detail' } },
  { path: 'license', component: AppLicenseComponent},
  /** search */
  { path: 'search', redirectTo: 'search/by-attribute', pathMatch: 'full'},
  { path: 'search/by-attribute', component: AppSearchComponent},
  { path: 'search/by-id', component: AppSearchByIdComponent},  
  { path: 'search/by-attribute/entity/:entityId', component: DetailComponent, data: { animation: 'search-detail' } },
  { path: 'search/by-id/entitities/:entityId', component: DetailComponent, data: { animation: 'search-detail' } },
  { path: 'search/by-id/datasources/:datasource/records/:recordId', component: SearchRecordComponent, data: { animation: 'search-detail' } },
  //{ path: 'search/results', component: SearchResultsComponent, data: { animation: 'search-results' } },
  { path: 'settings', component: AppSettingsComponent},
  { path: 'statistics', component: BlankComponent},
  /** errors */
  { path: 'errors/no-results', component: NoResultsComponent, data: { animation: 'search-detail' } },
  { path: 'errors/404', component: PageNotFoundComponent, data: { animation: 'search-detail' } },
  { path: 'errors/500', component: ServerErrorComponent, data: { animation: 'search-detail' } },
  { path: 'errors/504', component: GatewayTimeoutErrorComponent, data: { animation: 'search-detail' } },
  { path: 'errors/unknown', component: UnknownErrorComponent, data: { animation: 'search-detail' } },
  //{ path: 'about', component: AboutComponent, data: { animation: 'search-detail'} },
  /** landing page */
  { path: '',   redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview',  component: AppOverViewComponent },
  { path: '**', component: PageNotFoundComponent }
];
