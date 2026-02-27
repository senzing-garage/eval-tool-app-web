import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { AboutInfoService } from '../services/about.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UiService } from '../services/ui.service';
import { SzCrossSourceStatistics, SzCrossSourceSummaryCategoryType, SzCrossSourceSummaryCategoryTypeToMatchLevel, SzDataMartService, SzEntityIdentifier } from '@senzing/eval-tool-ui-common';
import { Subject, take, takeUntil } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { SzEvalToolEnvironmentProvider } from '../services/sz-grpc-environment.provider';
import { CommonModule } from '@angular/common';
import { statTypesToPathParams } from '../models/statistics';

/**
 * a component to display the a sampleset of datasource
 *
 * @export
 * @class SampleReviewComponent
 */
@Component({
    selector: 'app-sample-review',
    templateUrl: './sample-review.component.html',
    styleUrls: ['./sample-review.component.scss'],
    imports: [
        CommonModule,
        SzCrossSourceStatistics
    ]
})
export class SampleReviewComponent implements OnInit, AfterViewInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    private _statType: SzCrossSourceSummaryCategoryType;
    private _matchLevel: number;

    public get datasource1(): string {
        return this.dataMart.dataSource1;
    }
    public get datasource2(): string {
        return this.dataMart.dataSource2;
    }
    public get statType(): SzCrossSourceSummaryCategoryType {
        return this._statType;
    }
    public get matchLevel(): number {
        return this._matchLevel;
    }
    public get excludedDataSources(): string[] {
        return this.uiService.globallyHiddenDataSources;
    }
    
    @ViewChild('cssTableRef') cssTableRef: SzCrossSourceStatistics;

    constructor(
        private router: Router, 
        private route: ActivatedRoute,
        public uiService: UiService,
        public dataMart: SzDataMartService,
        private titleService: Title,
        @Inject('GRPC_ENVIRONMENT') private grpcEnvironment: SzEvalToolEnvironmentProvider
    ) {}
    ngOnInit() {
        
        this.dataMart.onSampleRequest.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe({
            next: this.onSampleLoading.bind(this),
            error: () => {
                this.uiService.spinnerActive = false;
            }
        });

        let _ds1        = this.route.snapshot.paramMap.get('datasource1');
        let _ds2        = this.route.snapshot.paramMap.get('datasource2');
        let _statType   = this.route.snapshot.data && this.route.snapshot.data['statType'] ? (this.route.snapshot.data['statType'] as SzCrossSourceSummaryCategoryType) : SzCrossSourceSummaryCategoryType.MATCHES;
        console.log('ROUTE DATA: ', this.route.snapshot.data);
        if(_ds1 || _ds2) {
            if(_ds1) {
                this.dataMart.dataSource1 = _ds1;
            }
            if(_ds2) {
                this.dataMart.dataSource2 = _ds2;
            }
            if(_statType && SzCrossSourceSummaryCategoryTypeToMatchLevel[_statType]) {
                // valid stat type
                this._statType      = _statType;
                this._matchLevel    = SzCrossSourceSummaryCategoryTypeToMatchLevel[this._statType];
                this.dataMart.sampleStatType    = this._statType;
                this.dataMart.sampleMatchLevel  = this._matchLevel;
            } else {
                // just choose matches by default
                this._statType      = SzCrossSourceSummaryCategoryType.MATCHES;
                this._matchLevel    = SzCrossSourceSummaryCategoryTypeToMatchLevel[SzCrossSourceSummaryCategoryType.MATCHES];
            }
            
            // get new sample set
            this.dataMart.createNewSampleSetFromParameters(
                this._statType, 
                this.dataMart.dataSource1,
                this.dataMart.dataSource2
            ).pipe(
                takeUntil(this.unsubscribe$),
                take(1)
            ).subscribe((resp) => {
                if(this.cssTableRef){
                    this.cssTableRef.updateTitle(this.dataMart.sampleDataSource1, this.dataMart.sampleDataSource2, this.dataMart.sampleStatType );
                    this.titleService.setTitle( this.cssTableRef.title );
                }
            });
        }
    }
    ngAfterViewInit() {
        // update title
        this.cssTableRef.onNewSampleSetRequested.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((evt) => {
            // update page title
            if(this.cssTableRef){
                this.titleService.setTitle( this.cssTableRef.title );
            }
        });
    }
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /** since data can be any format we have to use loose typing */
    onCellClick(data: any) {
        console.log(`onCellClick`, data);
    }

    /** when an entity ID or related entity ID is clicked in the results table */
    onEntityIdClick(entityId: SzEntityIdentifier) {
        console.log(`onEntityIdClick`, entityId);
        if (entityId) {
            this.router.navigate(['entity/', entityId]);
        }
    }

    onSampleLoading(isLoading) {
        console.log(`onSampleLoading`, isLoading);
        this.uiService.spinnerActive = isLoading;
    }
    /** when a new selection is made from the components this event handler is called */
    onSourceStatClicked(evt) {
        console.log(`SampleReviewComponent.onSourceStatClicked: `, evt);
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
        this.router.navigate(_redirectPath);
      }
}
