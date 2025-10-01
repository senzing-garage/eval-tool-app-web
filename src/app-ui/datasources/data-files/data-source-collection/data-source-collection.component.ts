import {from as observableFrom,  Observable ,  Subscription, Subject } from 'rxjs';

import {debounceTime, map, takeUntil, filter, take} from 'rxjs/operators';
import {
  Component,
  HostBinding,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy, ViewChildren, QueryList
} from '@angular/core';


/*import {
  SzProject,
  SzDataFile, SzDataFileInfo,
  SzDataFileCardHighlightType,
  SzProjectHttpService,
  SzDataSource,
  SzDataSourceService,
  SzEntityClass, SzEntityType, SzEntityTypeService,
  SzServerErrorsService,
  SzDialogService,
  SzServerError,
  SzBusyInfo, SzDataCardComponent, SzDataCardEvent, SzDataCardEventType,
  SzMessageBundle,
  SzMessageHandler, SzMessageHandlerView, SzDataFileCardComponent
} from '@senzing/app-lib';*/

import { SzDataSourceCardComponent } from '../data-source-card/data-source-card.component';
import { SzDataFile, SzDataFileCardHighlightType, SzImportedDataFile } from '../../../models/data-files';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sz-data-source-collection',
  templateUrl: './data-source-collection.component.html',
  styleUrls: ['./data-source-collection.component.scss'],
  imports: [
    CommonModule,
    SzDataSourceCardComponent
  ]
})
export class SzDataSourceCollectionComponent
implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @ViewChildren("currentCard")
  public sourceCards: QueryList<SzDataSourceCardComponent>;

  // tslint:disable-next-line:no-input-rename
  @Input("sz-tab-index-offset")
  public tabIndexOffset = 0;

  @Input('sz-delete-disabled') public deleteDisabled = false;

  //protected _project: SzProject;

  //private _onProjectChanged: Subject<SzProject> = new Subject<SzProject>();
  //public onProjectChanged: Observable<SzProject> = this._onProjectChanged.asObservable();

  private _onSourcesChanged: Subject<Array<SzDataFile | SzImportedDataFile>> = new Subject<SzDataFile[]>();
  public onSourcesChanged: Observable<Array<SzDataFile | SzImportedDataFile>> = this._onSourcesChanged.asObservable();

  /*public get project(): SzProject {
    return this._project;
  }
  @Input() public set project(value: SzProject) {
    this._project = value;
    this._onProjectChanged.next(value);
  }*/

  private _previousSources: Array<SzDataFile | SzImportedDataFile>;
  private _uploadedFiles: SzImportedDataFile[];
  private _sources: Array<SzDataFile>;
  public get sources(): Array<SzDataFile> | undefined {
    return this._sources;
  }
  @Input() public set sources(value: Array<SzDataFile>) {
    if(this._sources && this._sources.length > 0) {
      this._previousSources = this._sources;
    } else {
      setTimeout(() => {
        this._allowSparkle = false;
      }, 5000);
    }
    this._sources = value;
    this._onSourcesChanged.next(value);
  }
  @Input() public set uploadedFiles(value: SzImportedDataFile[]) {
    console.log(`SzDataSourceCollectionComponent.uploadedFiles(): `, value);
    this._uploadedFiles = value;
    this._onSourcesChanged.next(value);
  }
  public get dataFiles(): SzDataFile[] {
    let _dataFiles = this._sources;
    if(this._uploadedFiles) {
      console.log(`SzDataSourceCollectionComponent.dataFiles(): `, this._uploadedFiles);
      let _uploadsAsCards = this._uploadedFiles.map((uploadedFile: SzImportedDataFile)=> {
        let retVal: SzDataFile = Object.assign({
          configId: -1,
          name: uploadedFile.name,
          dataSource: uploadedFile.dataSource
        }, uploadedFile);
        return retVal;
      });
      _dataFiles = _dataFiles.concat(_uploadsAsCards);
    }
    return _dataFiles;
  }
  
  /** highlight the create new tile */
  @Input() highlightNewTile:boolean = false;
  /** highlight the "add datasource" tile */
  /** highlight datasources by specific file names */
  @Input() highlightDataSourcesByFileName: string[];
  /** highlight children elements of the cards matching highlightDataSourcesByFileName */
  @Input() highlightedElements: SzDataFileCardHighlightType[];

  /** when cards are in a selected state they get added to this collection */
  private _selectedDataSources: SzDataFile[] = [];
  /** internal subject that selection changes get published to */
  private _selectionChanged: Subject<SzDataFile[]> = new Subject<SzDataFile[]>();
  /** when the selection value of the project picker changes */
  public selectionChanged = this._selectionChanged.asObservable();
  private _allowSparkle = true;
  public get allowSparkle():boolean {
    return this._allowSparkle;
    //return (!this._previousSources && this._previousSources !== undefined && this._previousSources.length > 0) ? true : false;
  }

  // ----------------------------- event emitters -----------------------------
  // tslint:disable-next-line:no-output-rename
  @Output('sz-review-results')     public _onReviewResultsClicked   = new EventEmitter<SzDataFile | SzImportedDataFile>();
  // tslint:disable-next-line:no-output-rename
  @Output('sz-delete-datasources') public _onDeleteDataSources      = new EventEmitter<Array<SzDataFile | SzImportedDataFile>>();
  // tslint:disable-next-line:no-output-rename
  @Output('sz-edit-mappings')      public _onEditDataSourceMappings = new EventEmitter<SzDataFile>();
  // tslint:disable-next-line:no-output-rename
  @Output('sz-load')               public _onLoad                   = new EventEmitter<SzDataFile>();
  // tslint:disable-next-line:no-output-rename
  @Output('sz-resolve')            public _onResolve                = new EventEmitter<SzDataFile>();
  /** emitted when the value of which cards are selected is changed */
  // tslint:disable-next-line:no-output-rename
  @Output('sz-selection-changed')  public _onSelectionChanged       = new EventEmitter<Array<SzDataFile | SzImportedDataFile>>();
  // tslint:disable-next-line:no-output-rename
  @Output('sz-show-errors')        public _onViewErrorsClicked      = new EventEmitter<{"dataSource": SzDataFile, "errorChannel": string}>();

  // ----------------------------- event emitters proxies -----------------------------
  public onLoadClicked(dataSource: SzDataFile): void {
    console.log('SzDataSourceCollectionComponent.onLoadClicked', dataSource);
    this._onLoad.emit( dataSource );
  }
  public onEditClicked(dataSource: SzDataFile): void {
    console.log('SzDataSourceCollectionComponent.onEditClicked', dataSource);
    this._onEditDataSourceMappings.emit( dataSource );
  }
  public onReviewClicked(dataSource: SzDataFile): void {
    console.log('SzDataSourceCollectionComponent.onReviewClicked', dataSource);
    this._onReviewResultsClicked.emit( dataSource );
  }
  public onDeleteClicked(dataSource: SzDataFile): void {
    console.log('SzDataSourceCollectionComponent.onDeleteClicked', dataSource);
    this._onDeleteDataSources.emit( [dataSource] );
  }
  public onCardClicked(dataSource: SzDataFile, component?: SzDataSourceCardComponent) {
    console.log('SzDataSourceCollectionComponent.onDeleteClicked', dataSource);
    this.toggleInMultiSelection(dataSource, component);
  }
  public onDoubleClick(dataSource: SzDataFile, component?: SzDataSourceCardComponent): void {
    console.log('SzDataSourceCollectionComponent.onDoubleClick', dataSource);
    const isLoaded = false;
    const isMapped = false;
    if(isLoaded) {
      // review
      this._onReviewResultsClicked.emit( dataSource );
    } else if(isMapped) {
      // load now
      this._onLoad.emit( dataSource );
    } else {
      // edit mappings
      this._onEditDataSourceMappings.emit( dataSource );
    }
    //this._onDeleteDataSources.emit( [dataSource] );
  }
  public onViewErrorsClicked(dataSource: SzDataFile, errorChannel: string) {
    this._onViewErrorsClicked.emit({"dataSource": dataSource, "errorChannel": errorChannel});
  }

  constructor(
    //private dialogService: SzDialogService
    ) {

  }


  ngAfterViewInit() {
    //super.ngAfterInit();
    //console.warn('SzDataSourceCollectionComponent.ngAfterInit');

    // proxy "selectionChanged" observeable stream to component emitter
    this.selectionChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (selected: SzDataFile[]) => {
      this._onSelectionChanged.emit(selected);
    });
  }

  ngOnInit() {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  // ------------------------------------- card highlighting

  /** convenience method used to detect whether or not a specific card should be highlighted */
  public isCardHighlighted(file: SzDataFile): boolean {
    let retVal = false;
    // check various sources for whether or not this card should be highlighted
    if(file && (file.url || file.name) && this.highlightDataSourcesByFileName && this.highlightDataSourcesByFileName.length > 0) {
      retVal = (this.highlightDataSourcesByFileName.indexOf( SzDataFile.getName(file.url) ) > -1);
    }
    return retVal;
  }

  // ------------------------------------- multi-selection -------------------------------

  /** add/remove a project card from  _selectedProjects */
  public toggleInMultiSelection(ds: SzDataFile, event?: SzDataSourceCardComponent) {
    console.log('toggleInMultiSelection: ', ds, event);
    if(ds && (ds.id)){
      // for some weird reason this gets triggered twice
      // once with the project card as the event and
      // once with a generic MouseEvent
      if(this.isDataSourceSelected(ds)){
        this.removeFromMultiSelection(ds);
      } else {
        this.addToMultiSelection(ds);
      }
    } else {
      console.log('toggleInMultiSelection: ', ds, event);
    }
  }
  /** add project to _selectedProjects if not already a member */
  public addToMultiSelection(ds: SzDataFile) {
    if(!this.isDataSourceSelected( ds )) {
      this._selectedDataSources.push( ds );
      console.log('addToMultiSelection: ', this._selectedDataSources);
    } else {
      console.warn('addToMultiSelection: ', this.isDataSourceSelected( ds ));
    }
  }
  /** remove project from _selectedProjects if it is a member */
  public removeFromMultiSelection(ds: SzDataFile) {
    const indexOfItem = this.indexOfSelectedDataSource(ds);
    if(indexOfItem > -1) {
      this._selectedDataSources.splice(indexOfItem, 1);
      this._selectionChanged.next(this._selectedDataSources);
      console.log('removeFromMultiSelection: ', this._selectedDataSources);
    } else {
      console.warn('removeFromMultiSelection: no index', this.indexOfSelectedDataSource(ds));
    }
  }
  /** is project in _selectedProjects */
  public isDataSourceSelected(ds?: SzDataFile) {
    if(ds && ds.id) {
      if(this._selectedDataSources && this._selectedDataSources.length > 0) {
        const exists = this._selectedDataSources.find( (iDS: SzDataFile) => {
          return iDS.id === ds.id;
        });
        return exists ? true : false;
      }
    }
    return false;
  }
  /** return the index position of project in _selectedProjects. -1 if not found */
  private indexOfSelectedDataSource(ds?: SzDataFile): number {
    let retVal = -1;
    if(ds && ds.id) {
      if(this._selectedDataSources && this._selectedDataSources.length > 0) {
        retVal = this._selectedDataSources.findIndex( (iDS: SzDataFile) => {
          return iDS.id === ds.id;
        });
      }
    }
    return retVal;
  }
  /** remove all selected projects */
  public deleteSelected() {
    if(this._selectedDataSources) {

      /*this.dialogService.confirm("This action cannot be undone.","Delete Selected Data Sources?").subscribe( (actionConfirmed) => {
        if(actionConfirmed) {
          this._onDeleteDataSources.emit(this._selectedDataSources);
        }
      });
      */
    } else {
      //this.dialogService.open("No projects selected.","Select a project first");
    }
  }
  public selectAll() {
    this._selectedDataSources = this._sources;
  }
  public deselectAll() {
    this._selectedDataSources = [];
  }
  /** cards selected */
  public get selectedDataSources(): SzDataFile[] | undefined {
    return this._selectedDataSources;
  }

  trackSourcesById(index: number, source: SzDataFile): number | null {
    return (source) ? source.id : null;
  }
}
