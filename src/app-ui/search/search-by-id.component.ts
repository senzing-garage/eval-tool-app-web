import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import {
  SzSearchByIdFormParams,
  SzSearchByIdGrpcComponent,
  SzSdkSearchResult, SzEntitySearchParams,
  SzSearchResultCardGrpcComponent,
  SzSdkResolvedEntity,
  SzEntityRecordViewerComponent,
  SzSdkEntityRecord
} from '@senzing/eval-tool-ui-common';

import { EntitySearchService } from '../services/entity-search.service';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { PrefsManagerService } from '../services/prefs-manager.service';
@Component({
  selector: 'app-search-by-id',
  templateUrl: './search-by-id.component.html',
  styleUrls: ['./search-by-id.component.scss'],
  imports: [ CommonModule, 
    SzSearchByIdGrpcComponent, SzEntityRecordViewerComponent ,
    SzSearchResultCardGrpcComponent
  ]
})
export class AppSearchByIdComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** the current search results */
  public currentSearchResults: SzSdkSearchResult[];
  /** the entity to show in the detail view */
  public currentlySelectedEntityId: number = undefined;
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;

  public get currentSearchParametersHumanReadable(): string | undefined {
    let retVal = undefined;
    if(this.entitySearchService.currentSearchByIdParameters) {
      if(this.entitySearchService.currentSearchByIdParameters.recordId) {
        retVal = '"'+ this.entitySearchService.currentSearchByIdParameters.recordId +'"';
        if (this.entitySearchService.currentSearchByIdParameters.dataSource) {
          retVal += ' in "'+ this.entitySearchService.currentSearchByIdParameters.dataSource +'"';
        }
      } else if(this.entitySearchService.currentSearchByIdParameters.entityId) {
        retVal = '"'+ this.entitySearchService.currentSearchByIdParameters.entityId +'"';
      }
    }
    return retVal;
  }
  public get hasCurrentlySelectedSearchResult(): boolean {
    return this.entitySearchService && 
    this.entitySearchService.currentlySelectedSearchResult && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY.RESOLVED_ENTITY && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID ? true : false;

  }
  public noResults: boolean = false;

  constructor(
      public entitySearchService: EntitySearchService,
      private router: Router,
      private route: ActivatedRoute,
      private spinner: SpinnerService,
      private titleService: Title,
      public uiService: UiService,
      private prefsManager: PrefsManagerService
  ) {}

  ngOnInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
      this.spinner.hide();
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
  }

  /**
   * Event handler for when the fields in the SzSearchComponent
   * are cleared.
   */
  public onSearchResultsCleared(searchParams: void) {
    this.noResults = false;
    // hide search results
    this.clearPreviousSearchData()
    this.entitySearchService.currentSearchByIdParameters = undefined;
  }

  private clearPreviousSearchData() {
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.entitySearchService.currentlySelectedEntityData = undefined;
    this.entitySearchService.currentRecord = undefined;
  }

  /**
   * Event handler for when the parameters of the search performed from
   * the SzSearchComponent | SzSearchByIdComponent has changed.
   * This only happens on submit button click
   */
  public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
    let isByIdParams = false;
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    }
    if (!isByIdParams) {
      this.entitySearchService.currentSearchParameters = (searchParams as SzEntitySearchParams);
      this.currentSearchParameters = this.entitySearchService.currentSearchParameters;
    } else {
      this.entitySearchService.currentSearchByIdParameters = (searchParams as SzSearchByIdFormParams);
    }
  }

  public onSearchStart(evt) {
    this.noResults = false;
    this.clearPreviousSearchData();

    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }
  public onSearchEnd(evt) {
    console.log('onSearchEnd: ', evt);
    this.spinner.hide();
    if(!evt) {
      // no results
      this.noResults = true;
    }
  }
  public onSearchException(evt) {
    console.log('onSearchException: ', evt);
    this.spinner.hide();
    this.noResults = true;
    this.clearPreviousSearchData();
  }
  /** when user clicks on a search result item */
  onSearchResultClick(entityId: number) {
    console.log('onSearchResultClick: ', entityId);
    this.router.navigate(['search','by-id','entities', entityId]);
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event) {
    const entityIds = this.currentSearchResults.map( (ent) => {
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

  /** when the value from the sz-search-by-id component changes */
  onRecordChange(evt: SzSdkEntityRecord) {
    console.log('onRecordChange: ', evt);
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.entitySearchService.currentlySelectedEntityData = undefined;
    this.entitySearchService.currentRecord = evt;
  }
  /** when the by entity id result from the sz-search-by-id component changes */
  onEntityResult(entity: SzSdkResolvedEntity) {
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentRecord = undefined;
    let inputData = entity;
    let searchTitle = this.entitySearchService.searchTitle;
    console.log('onEntityResult: '+searchTitle, inputData);
    
    this.entitySearchService.currentlySelectedEntityData = inputData;
    this.entitySearchService.currentlySelectedEntityId = entity.ENTITY_ID;

    this.titleService.setTitle(this.entitySearchService.searchTitle);// currentlySelectedEntityId
  }

  /** handler for when the entityId of the component is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entitySearchService.currentlySelectedEntityId && this.entitySearchService.currentlySelectedEntityId !== entityId) {
      this.entitySearchService.currentlySelectedEntityId = entityId;
      // update route if needed
      this.router.navigate(['search/by-attribute/entity/' + entityId]);
    }
  }
}
