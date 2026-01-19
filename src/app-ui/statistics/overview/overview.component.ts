import { Component, OnInit, OnDestroy, HostBinding, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
//import { SzStatisticsService } from '@senzing/eval-tool-ui-common';
import { SzCrossSourceSelectComponent, SzCrossSourceSummaryComponent, SzDataMartService, SzEntitySearchParams, SzGrpcProductService, SzLicenseInfoComponent, SzRecordStatsDonutChart, SzSdkSearchResult, SzSearchGrpcComponent } from '@senzing/eval-tool-ui-common';
import { EntitySearchService } from '../../services/entity-search.service';
import { SpinnerService } from '../../services/spinner.service';
import { UiService } from '../../services/ui.service';
import { PrefsManagerService } from '../../services/prefs-manager.service';
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
    SzDataMartService,
    { provide: SzGrpcProductService, useClass: SzGrpcProductService }
  ]
})
export class AppOverViewComponent implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** @internal */
  private _openResultLinksInGraph = false;
  /** @internal */
  private _openSearchResultsInGraph = false;
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;

  public get openResultLinksInGraph() {
    return this._openResultLinksInGraph;
  }
  public get openSearchResultsInGraph() {
    return this._openSearchResultsInGraph;
  }

  constructor(
    public breakpointObserver: BreakpointObserver,
    private entitySearchService: EntitySearchService,
    private productService: SzGrpcProductService,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: SpinnerService,
    private statisticsService: SzDataMartService,
    private titleService: Title,
    private ui: UiService,
    @Inject('GRPC_ENVIRONMENT') private grpcEnvironment: SzEvalToolEnvironmentProvider
  ) {
    
  }
  ngOnInit () {
    this.route
      .data
      .subscribe((params) => {
        console.log("route params",params);
        if(params && params['openResultLinksInGraph'] !== undefined) {
          this._openResultLinksInGraph = params['openResultLinksInGraph'];
        }
        if(params && params['openSearchResultsInGraph'] !== undefined) {
          this._openSearchResultsInGraph = params['openSearchResultsInGraph'];
        }
    });
    this.grpcEnvironment.onConnectivityChange.subscribe((event)=>{
      console.log(` connectivity change in search component: `, event);
    })
  }
  /**
   * Event handler for when a search has been performed in
   * the SzSearchComponent.
   */
  onSearchResults(evt: SzSdkSearchResult[]) {
        console.info('onSearchResultsChange: ', evt);
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
   * the SzSearchComponent | SzSearchByIdComponent has changed.
   * This only happens on submit button click
   */
  //public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
  public onSearchParameterChange(searchParams: SzEntitySearchParams) {

    //console.log('onSearchParameterChange: ', searchParams);
    let isByIdParams = false;
    /*
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    } else {
      // console.warn('not by id: ' + isByIdParams, byIdParams);
    }*/
    if (!isByIdParams) {
      this.entitySearchService.currentSearchParameters = (searchParams as SzEntitySearchParams);
      this.currentSearchParameters = this.entitySearchService.currentSearchParameters;
    } else {
      //this.entitySearchService.currentSearchByIdParameters = (searchParams as SzSearchByIdFormParams);
    }
  }

  public onSearchStart(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }
  public onSearchEnd(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.hide();
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event?) {
    const entityIds = this.entitySearchService.currentSearchResults.map( (ent) => {
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

  onSourceStatClicked(evt) {
    console.log(`AppOverViewComponent.onSourceStatClicked: `, evt);
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

  public getStats() {
    //let url =  `/data-mart/statistics/sizes/1`;

    //this.statsService.getEntitySizeBreakdown().subscribe((results)=>{
    this.statisticsService.getEntitySizeCount(1).subscribe((results)=>{
      console.log(`Got entity size count: `, results);
      alert('got stats...')
    })
    this.statisticsService.getLoadedStatistics().subscribe((results)=>{
      console.log(`Got loaded statistics: `, results);
      alert('got loaded stats...')
    })
  }
}