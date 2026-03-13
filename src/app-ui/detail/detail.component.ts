//import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, Subject, fromEvent } from 'rxjs';
//import { SzEntityDetailComponent, SzPdfUtilService } from '@senzing/sdk-components-ng';
import { UiService } from '../services/ui.service';
// new grpc components
import {
  SzEntityDetailGrpcComponent,
  SzResumeEntity,
  SzSdkResolvedEntity,
  SzGraphStorageService,
  SzGraphExportRecord,
} from '@senzing/eval-tool-ui-common';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  imports: [
    CommonModule,
    SzEntityDetailGrpcComponent
  ],
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('entityDetailComponent') entityDetailComponent: SzEntityDetailGrpcComponent;
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;

  /** Saved graphs for the "Add to Graph" context menu submenu */
  public savedGraphs: SzGraphExportRecord[] = [];
  /** Whether graph storage is available */
  public get graphStorageAvailable(): boolean {
    return this.graphStorageService.isAvailable;
  }

  public _showGraphMatchKeys = true;
  @Input() public set showGraphMatchKeys( value: boolean ) {
    this._showGraphMatchKeys = value;
  }

  public _showEntityHowFunction = true;
  @Input() public set showEntityHowFunction( value: boolean ) {
    this._showEntityHowFunction = value;
  }

  sub: Subscription;
  overlayRef: OverlayRef | null;

  /** local setter that sets selected entity at service level */
  public set entityId(value: any) {
    this.search.currentlySelectedEntityId = value;
  }
  /** get the currently selected entity from service level */
  public get entityId(): any {
    return this.search.currentlySelectedEntityId;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    //public pdfUtil: SzPdfUtilService,
    public overlay: Overlay,
    public uiService: UiService,
    public viewContainerRef: ViewContainerRef,
    private titleService: Title,
    private graphStorageService: SzGraphStorageService
    ) {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe( (params) => this.entityId = parseInt(params['entityId'], 10) );
  }

  ngOnInit() {
    this.uiService.createPdfClicked.pipe(takeUntil(this.destroy$)).subscribe((entityId: number) => {
      this.createPDF();
    });

    // Load saved graphs when storage becomes available
    this.graphStorageService.available$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(available => {
      if (available) {
        this.refreshSavedGraphs();
      } else {
        this.savedGraphs = [];
      }
    });

    // Refresh when graphs change
    this.graphStorageService.graphsChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.refreshSavedGraphs());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** handler for when the entityId of the component is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entityId && this.entityId !== entityId) {
      // update route if needed
      this.router.navigate(['entity/' + entityId]);
    }
  }

  public toggleGraphMatchKeys(event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    }
    this.showGraphMatchKeys = _checked;
  }

  /**
   * gets a filename based on entity name for generating a pdf document.
  */
  private get pdfFileName(): string {
    let filename = 'entity';
    if ( this.entityDetailComponent.entity) {
      if ( this.entityDetailComponent.entity.BEST_NAME ) {
        filename = this.entityDetailComponent.entity.BEST_NAME.replace(/ /g, '_');
      } else if (this.entityDetailComponent.entity.ENTITY_NAME) {
        filename = this.entityDetailComponent.entity.ENTITY_NAME.replace(/ /g, '_');
      }
    }
    filename = filename + '.pdf';
    return filename;
  }
  /**
   * creates a PDF document from the currently visible entity
   */
  private createPDF(): void {
    const filename = this.pdfFileName;
    //this.pdfUtil.createPdfFromHtmlElement(this.entityDetailComponent.nativeElement, filename);
  }

  /**
   * open up a context menu on graph entity right-click
   */
  public onGraphContextClick(event: any): void {
    this.openContextMenu(event);
  }
  /**
   * open up a entity route from graph right click in new tab/window
  */
  public openGraphItemInNewMenu(entityId: number) {
    window.open('/entity/' + entityId, '_blank', 'noopener,noreferrer');
  }

  /**
   * create context menu for graph options
   */
  public openContextMenu(event: any) {
    this.closeContextMenu();
    // Use the actual mouse coordinates (eventPageX/eventPageY) captured from the
    // original pointer event, converted to viewport coords for CDK overlay.
    const scrollX = window.scrollX || 0;
    const scrollY = window.scrollY || 0;
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: event.eventPageX - scrollX, y: event.eventPageY - scrollY })
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.graphContextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeContextMenu());

    return false;
  }
  /**
   * close graph context menu
   */
  closeContextMenu() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  /** update the page title to the entity name */
  onEntityDataChanged(data: SzResumeEntity) {
    const titleCaseWord = (word: string) => {
      if (!word) { return word; }
      return word[0].toUpperCase() + word.substr(1).toLowerCase();
    };
    const titleCaseSentence = (words: string) => {
      if (!words) { return words; }
      return (words.split(' ').map( titleCaseWord ).join(' '));
    };
    if(data) {
      if(data.ENTITY_NAME) {
        this.titleService.setTitle( titleCaseSentence(data.ENTITY_NAME) + ': Details');
      }
    }
  }
  onGraphPopout(event) {
    console.log('on graph popout: ', event);
    this.router.navigate(['graph/' + this.entityId]);
  }

  onHowButtonClick(event: any) {
    console.log('on how button click: ', event);
    this.router.navigate(['/how', this.entityId]);
  }

  /** Refresh the saved graphs list */
  private refreshSavedGraphs(): void {
    if (!this.graphStorageService.isAvailable) return;
    this.graphStorageService.listGraphs().then(graphs => {
      this.savedGraphs = graphs;
    }).catch(() => {
      this.savedGraphs = [];
    });
  }

  /** Add entity to an existing saved graph and navigate to it */
  public addToGraph(entityId: number, graph: SzGraphExportRecord): void {
    this.closeContextMenu();
    if (!graph.id) return;

    this.graphStorageService.getGraph(graph.id).then(record => {
      const graphData = record.graphData ? JSON.parse(record.graphData) : null;
      if (graphData?.query?.graphIds) {
        const ids: number[] = graphData.query.graphIds;
        if (!ids.includes(entityId)) {
          ids.push(entityId);
        }
        return this.graphStorageService.updateGraph(graph.id!, {
          graphExport: graphData
        });
      }
      return record;
    }).then(() => {
      this.router.navigate(['/graph/canvas', graph.id]);
    }).catch(err => {
      console.error('Failed to add entity to graph', err);
    });
  }
}
