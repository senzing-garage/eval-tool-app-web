import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzCrossSourceSelectComponent, SzCrossSourceSummaryComponent, SzEntitySearchParams, SzGrpcProductService, SzLicenseInfoComponent, SzRecordStatsDonutChart, SzSdkSearchResult, SzSearchGrpcComponent } from '@senzing/eval-tool-ui-common';
import { EntitySearchService } from '../../services/entity-search.service';
import { SpinnerService } from '../../services/spinner.service';
import { UiService } from '../../services/ui.service';
import { SzEvalToolEnvironmentProvider } from '../../services/sz-grpc-environment.provider';
import { statTypesToPathParams } from '../../models/statistics';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  imports: [
    CommonModule,
    SzCrossSourceSelectComponent,
    SzCrossSourceSummaryComponent,
    SzLicenseInfoComponent,
    SzRecordStatsDonutChart,
    SzSearchGrpcComponent
  ],
  styleUrls: ['./overview.component.scss'],
  providers: [
    { provide: SzGrpcProductService, useClass: SzGrpcProductService }
  ]
})
export class AppOverViewComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** @internal */
  private _openResultLinksInGraph = false;
  /** @internal */
  private _openSearchResultsInGraph = false;
  /** tracks which child components have completed their initial data load */
  private _componentReady = { donut: false, license: false, crossSourceSelect: false, crossSourceSummary: false };
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;

  public get openResultLinksInGraph() {
    return this._openResultLinksInGraph;
  }
  public get openSearchResultsInGraph() {
    return this._openSearchResultsInGraph;
  }
  public get excludedDataSources(): string[] {
    return this.ui.globallyHiddenDataSources;
  }

  constructor(
    private entitySearchService: EntitySearchService,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: SpinnerService,
    private ui: UiService,
    @Inject('GRPC_ENVIRONMENT') private grpcEnvironment: SzEvalToolEnvironmentProvider
  ) {

  }

  ngOnInit () {
    if (!this.ui.overviewInitialized) {
      this.spinner.show('Initializing');
    }
    this.route
      .data
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        if(params && params['openResultLinksInGraph'] !== undefined) {
          this._openResultLinksInGraph = params['openResultLinksInGraph'];
        }
        if(params && params['openSearchResultsInGraph'] !== undefined) {
          this._openSearchResultsInGraph = params['openSearchResultsInGraph'];
        }
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Event handler for when a search has been performed in
   * the SzSearchComponent.
   */
  onSearchResults(evt: SzSdkSearchResult[]) {
        this.spinner.hide();
        this.entitySearchService.currentSearchResults = evt;

        if(this.entitySearchService.currentSearchResults.length < 1) {
          // show no results message
        } else {
          this.router.navigate(['/search']);
        }

        if (this.openSearchResultsInGraph) {
            // show results in graph
            this.onOpenInGraph();
        }
  }

  /**
   * Event handler for when the fields in the SzSearchComponent
   * are cleared.
   */
  public onSearchResultsCleared(searchParams: void) {
    // hide search results
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.router.navigate(['/search']);
  }

  /**
   * Event handler for when the parameters of the search performed from
   * the SzSearchComponent has changed.
   * This only happens on submit button click
   */
  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    this.entitySearchService.currentSearchParameters = searchParams;
    this.currentSearchParameters = this.entitySearchService.currentSearchParameters;
  }

  public onSearchStart(evt) {
    this.spinner.show();
  }
  public onSearchEnd(evt) {
    this.spinner.hide();
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event?) {
    const entityIds = (this.entitySearchService.currentSearchResults || []).map( (ent) => {
      return ent.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
    });
    if(entityIds && entityIds.length === 1) {
      // single result
      this.router.navigate(['graph/' + entityIds[0] ]);
    } else if(entityIds && entityIds.length > 1) {
      // multiple matches
      this.router.navigate(['graph/' + entityIds.join(',') ]);
    }
  }

  onComponentInitialized(key: string) {
    this._componentReady[key] = true;
    if (Object.values(this._componentReady).every(v => v)) {
      this.ui.overviewInitialized = true;
      this.spinner.hide();
    }
  }

  onDataSourceClick(evt: { dataSource?: string }) {
    if (evt && evt.dataSource) {
      this.router.navigate(['review/', evt.dataSource]);
    }
  }

  onSourceStatClicked(evt) {
    let _redirectPath = ['review/'];
    if(evt.dataSource1 && evt.dataSource2 && (evt.dataSource1 !== evt.dataSource2)) {
        _redirectPath.push(evt.dataSource1);
        _redirectPath.push('vs');
        _redirectPath.push(evt.dataSource2);
    } else if(evt.dataSource1) {
        _redirectPath.push(evt.dataSource1);
    } else if(evt.dataSource2) {
        _redirectPath.push(evt.dataSource2);
    }
    if(evt.statType && evt.statType !== undefined && statTypesToPathParams[evt.statType]) {
        _redirectPath.push(statTypesToPathParams[evt.statType]);
    }
    // redirect to sample page
    this.router.navigate(_redirectPath);
  }
}
