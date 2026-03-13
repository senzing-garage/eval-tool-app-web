import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild, HostBinding, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { takeUntil, take, filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import {Overlay } from '@angular/cdk/overlay';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { AboutInfoService } from '../services/about.service';
import { SzFoliosService, SzPrefsService, SzDataMartService, SzSearchHistoryFolio, SzSearchHistoryFolioItem } from '@senzing/eval-tool-ui-common';
import { SzDialogService } from '../dialogs/common-dialog/common-dialog.service';
import { AboutComponent } from '../about/about.component';
import { EulaComponent } from '../eula/eula.component';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface NavItem {
  key: string;
  name: string;
  tooltip: string;
  order: number;
  submenuItems?: NavItem[];
  default?: boolean;
  route?: string;
  disabled?: boolean;
  /** Tooltip shown when the item is disabled. Falls back to a generic message if not set. */
  disabledTooltip?: string;
  hidden?: boolean;
  notYetImplemented?: boolean;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ],
  providers: [
    AboutInfoService,
    SzDialogService,
    Title
  ]
})
export class SideNavComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  /** Items that require loaded data to be accessible */
  private static readonly DATA_REQUIRED_ITEMS = ['overview', 'search', 'graph', 'review'];
  
  @HostBinding('class')
  get cssClasses(): string[] {
    let retVal = [];
    if(this.primaryExpanded) {
      retVal.push('expanded')
    }
    if(this.showSubNav) {
      retVal.push('subnav-expanded')
      // add specifically selected subnav class
      retVal.push('subnav-'+ this.selectedPrimaryNavItem.key.toLowerCase() +'-visible' );
    }
    if(this.graphOpen) {
      retVal.push('graph-open')
    }
    return retVal;
  };

  @Input() public primaryExpanded: boolean = false;
  @Input() public secondaryExpanded: boolean = false;

  @Output() public  onItemHover = new EventEmitter<NavItem>();
  @Output() public  expand = new EventEmitter<NavItem>();

  protected menuItems: {[key: string]: NavItem} = {
    'projects': {
      name: 'Projects',
      key: 'projects',
      tooltip: 'Open or create projects',
      order: -1,
      route: '/projects',
      hidden: true
    },
    'overview': {
      name: 'overview',
      key: 'overview',
      order: 0,
      route: 'overview',
      disabled: false,
      notYetImplemented: true,
      tooltip: 'Dashboard and Quick Search'
    },
    'search': {
      name: 'search',
      key: 'search',
      tooltip: 'Search By Attribute or ID',
      order: 1,
      submenuItems: [
        {
          name: 'By Attribute',
          key: '/search-by-attribute',
          tooltip: 'Search by name, address, or other attributes',
          order: 0,
          route: 'search/by-attribute'
        },
        {
          name: 'By Record/Entity Id',
          key: 'search-by-id',
          tooltip: 'Search by entity or record ID',
          order: 1,
          route: '/search/by-id'
        }
      ]
    },
    'graph': {
      name: 'graph',
      tooltip: 'Show connections between entities visually',
      key: 'graph',
      route: 'graph',
      order: 2
    },
    'statistics': {
      name: 'statistics',
      key: 'statistics',
      tooltip: 'Entity Size breakdown & unresolved entities',
      order: 3,
      disabled: true,
      hidden: true,
      notYetImplemented: true
    },
    'composition': {
      name: 'composition',
      key: 'composition',
      tooltip: '',
      order: 4,
      disabled: true,
      hidden: true,
      notYetImplemented: true
    },
    'review': {
      name: 'review',
      key: 'review',
      tooltip: 'Browse a result set by single or overlapping data sources',
      order: 5,
      route: '/review'
    },
    'datasources': {
      name: 'Data Sources',
      key: 'datasources',
      tooltip: 'Add data and data sources',
      order: 6,
      route: '/datasources'
    },
    'settings': {
      name: 'Settings',
      key: 'settings',
      tooltip: 'Settings for how data is displayed',
      order: 7,
    },
    'support': {
      name: 'Support',
      key: 'support',
      tooltip: 'About & License Information',
      order: 9,
      submenuItems: [
        {
          name: 'About',
          key: 'about',
          tooltip: 'About this application',
          order: 0
        },
        {
          name: 'License Information',
          key: 'license',
          tooltip: 'License details',
          order: 1,
          route: '/license'
        },
        {
          name: 'View EULA',
          key: 'eula',
          tooltip: 'End User License Agreement',
          order: 2
        }
      ]
    }
  }

  /** the folio items that holds last "X" searches performed */
  public search_history: SzSearchHistoryFolioItem[];

  private selectedPrimaryNavItem: NavItem = this.getDefaultMenuItem();
  public get showSubNav(): boolean {
    return (this.selectedPrimaryNavItem
      && !this.selectedPrimaryNavItem.disabled
      && this.selectedPrimaryNavItem.submenuItems
      && this.selectedPrimaryNavItem.submenuItems.length > 0);
  }

  
  public get graphOpen(): boolean {
    return this.uiService.graphOpen;
  }
  
  constructor(
    public aboutService: AboutInfoService,
    public overlay: Overlay,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService,
    private titleService: Title,
    public uiService: UiService,
    private dialogService: SzDialogService,
    private prefs: SzPrefsService,
    private foliosService: SzFoliosService
  ) {}

  private dataMartService = inject(SzDataMartService);

  ngOnInit() {
    // Start with data-dependent items disabled
    this.setDataItemsDisabled(true);

    // Subscribe to count stats changes — when data is loaded, the
    // data-mart service emits updated stats and we re-enable items.
    this.dataMartService.onCountStats.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((stats: any) => {
      if (stats) {
        const hasData = (stats.totalRecordCount > 0
            || stats.totalEntityCount > 0);
        this.setDataItemsDisabled(!hasData);
      }
    });

    // Actively check stats on init and on every route navigation
    // (covers the case where data was loaded on a different page
    // or a project switch occurred)
    this.refreshDataLoadedState();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      // Reset to disabled first in case we switched to a project
      // with no data — then re-check asynchronously
      this.setDataItemsDisabled(true);
      this.refreshDataLoadedState();
    });
  }

  /** Actively triggers a stats refresh to check data-loaded state */
  protected refreshDataLoadedState() {
    this.dataMartService.getLoadedStatistics().pipe(
      take(1),
      takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  /** Enable or disable menu items that require loaded data */
  protected setDataItemsDisabled(disabled: boolean) {
    for (const key of SideNavComponent.DATA_REQUIRED_ITEMS) {
      if (this.menuItems[key]) {
        this.menuItems[key].disabled = disabled;
        this.menuItems[key].tooltip = disabled
          ? this.menuItems[key].name + ' is disabled until data loaded'
          : this.getDefaultTooltip(key);
      }
    }
  }

  /** Returns the original tooltip for a menu item */
  protected getDefaultTooltip(key: string): string {
    const defaults: Record<string, string> = {
      'overview': 'Dashboard and Quick Search',
      'search': 'Search By Attribute or ID',
      'graph': 'Show connections between entities visually',
      'review': 'Browse a result set by single or overlapping data sources'
    };
    return defaults[key] || '';
  }

  /**
   * reusable method for getting search history lists deduped, ordered,
   * mapped from "search_history" property
   */
   public getHistoryOptions(fieldName: string): string[] {
    let retVal = [];
    if(this.search_history && this.search_history.map) {
      retVal = this.search_history.filter( (folio: SzSearchHistoryFolioItem) => {
        return folio && folio.data && folio.data[fieldName] && folio.data[fieldName] !== undefined && folio.data[fieldName] !== null;
      }).map( (folio: SzSearchHistoryFolioItem ) => {
        return folio.data[fieldName];
      }).filter(function(elem, index, self) {
        return index == self.indexOf(elem);
      });
    }
    return retVal;
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private submenuCollapseTimer;

  private getDefaultMenuItem(): NavItem {
    let retValue = this.menuItems['overview'];
    for(let key in this.menuItems) {
      let menuItem = this.menuItems[ key ];
      if(menuItem.default) {
        retValue = menuItem;
      }
    }
    return retValue;
  }
  public isDisabled(itemKey: string): boolean {
    return (itemKey && this.menuItems[ itemKey ] && this.menuItems[ itemKey ].disabled) ? true : false;
  }
  public isHidden(itemKey: string): boolean {
    return (itemKey && this.menuItems[ itemKey ] && this.menuItems[ itemKey ].hidden) ? true : false;
  }
  public selectMenuItem(itemKey: string) {
    this.selectedPrimaryNavItem = this.menuItems[ itemKey ];
    let isDisabled              = this.selectedPrimaryNavItem.disabled;
    let notYetImplemented       = this.selectedPrimaryNavItem.notYetImplemented;
    console.log(`selectMenuItem: "${itemKey}"`,this.selectedPrimaryNavItem, isDisabled, notYetImplemented);
    if(this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.route && !this.selectedPrimaryNavItem.submenuItems) {
      if(!isDisabled) {
        // go to primary menu item link
        this.router.navigateByUrl(this.selectedPrimaryNavItem.route)
      } else if(isDisabled === true && notYetImplemented === true) {
        // show not yet implemented modal
        this.dialogService.alert('Work on this feature is still in progress. When the feature is complete this link will be enabled.', 'Not Yet Implemented')
      }
    }
  }
  public getTooltip(itemKey: string) {
    let selectedPrimaryNavItem  = this.menuItems[ itemKey ];
    if(selectedPrimaryNavItem) {
      let isDisabled              = selectedPrimaryNavItem.disabled;
      let notYetImplemented       = selectedPrimaryNavItem.notYetImplemented;
      let tooltipText             = selectedPrimaryNavItem.tooltip;
      if(notYetImplemented) {
        return `${itemKey} feature is not yet available`
      } else if(isDisabled) {
        return selectedPrimaryNavItem.disabledTooltip || `${itemKey} is disabled until data loaded`
      } else if(selectedPrimaryNavItem.route && !selectedPrimaryNavItem.submenuItems) {
        return tooltipText;
      }
    }
    return '';
  }
  public onMouseEnterMenuItem(itemKey: string) {
    if (this.menuItems[itemKey]?.disabled) return;
    this.selectedPrimaryNavItem = this.menuItems[ itemKey ];
    this.onItemHover.emit(this.selectedPrimaryNavItem);
  }
  public onMouseEnterSubNav() {
    console.log('onMouseEnterSubNav');
    if(this.submenuCollapseTimer) {
      clearTimeout(this.submenuCollapseTimer);
    }
  }
  public onMouseLeaveSubNav() {
    console.log('onMouseLeaveSubNav');
    this.submenuCollapseTimer = setTimeout(() => {
      this.selectedPrimaryNavItem = undefined
    }, 1000);
  }

  public openAboutDialog() {
    this.dialogService.openFromComponent(AboutComponent, { width: '500px' });
  }

  public openEulaDialog() {
    this.dialogService.openFromComponent(EulaComponent, { width: '40vw', height: '80vh', panelClass: [null, 'sz-eula-dialog'] });
  }

  public openContactSupport() {
    // Use location.href so Electron's will-navigate handler intercepts
    // the external URL and opens it in the system browser
    window.location.href = 'https://senzing.zendesk.com/hc/en-us/requests/new';
  }

  public get showGraphDataSources(): string [] {
    return this.uiService.graphFilterDataSources;
  }
}
