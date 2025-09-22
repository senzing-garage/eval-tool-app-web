import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild, HostBinding } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import {Overlay } from '@angular/cdk/overlay';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { AboutInfoService } from '../services/about.service';
import { Timer } from 'd3-timer';
import { SzFoliosService, SzPrefsService, SzSearchHistoryFolio, SzSearchHistoryFolioItem } from '@senzing/eval-tool-ui-common';
import { SzDialogService } from '../dialogs/common-dialog/common-dialog.service';

export interface NavItem {
  key: string;
  name: string;
  order: number;
  submenuItems?: NavItem[],
  default?: boolean,
  route?: string,
  disabled?: boolean,
  notYetImplemented?: boolean
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ],
  providers: [
    AboutInfoService,
    EntitySearchService,
    SpinnerService,
    SzDialogService,
    Title,
    UiService
  ]
})
export class SideNavComponent {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  
  @HostBinding('class.expanded')
  get expandedClass() {
      return this.primaryExpanded;
  };
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

  private menuItems: {[key: string]: NavItem} = {
    'overview': {
      name: 'overview',
      key: 'overview',
      order: 0,
      route: 'overview',
      disabled: true,
      notYetImplemented: true
    },
    'search': {
      name: 'search',
      key: 'search',
      order: 1,
      submenuItems: [
        {
          name: 'By Attribute',
          key: '/search-by-attribute',
          order: 0,
          route: 'search/by-attribute'
        },
        {
          name: 'By Record/Entity Id',
          key: 'search-by-id',
          order: 1,
          route: '/search/by-id'
        }
      ]
    },
    'graph': {
      name: 'graph',
      key: 'graph',
      order: 2
    },
    'statistics': {
      name: 'statistics',
      key: 'statistics',
      order: 3,
      disabled: true,
      notYetImplemented: true
    },
    'composition': {
      name: 'composition',
      key: 'composition',
      order: 4,
      disabled: true,
      notYetImplemented: true
    },
    'review': {
      name: 'review',
      key: 'review',
      order: 5,
      disabled: true,
      notYetImplemented: true
    },
    'datasources': {
      name: 'Data Sources',
      key: 'datasources',
      order: 6,
      submenuItems: [
        {
          name: 'List',
          key: 'datasources-list',
          order: 0
        },
        {
          name: 'Import Data',
          key: 'datasources-import',
          order: 1
        }
      ]
    },
    'settings': {
      name: 'Settings',
      key: 'settings',
      order: 7,
      /*submenuItems: [
        {
          name: 'Search',
          key: 'settings-search-results',
          order: 0
        },
        {
          name: 'Entity Resume',
          key: 'settings-entity-resume',
          order: 1
        },
        {
          name: 'Graph',
          key: 'settings-graph',
          order: 2
        }
      ]*/
      disabled: true,
      notYetImplemented: true
    },
    'admin': {
      name: 'Admin',
      key: 'admin',
      order: 8,
      route: '/admin',
      disabled: true
    },
    'license': {
      name: 'License Information',
      key: 'license',
      order: 9,
      route: '/license',
      disabled: true,
      notYetImplemented: true
    }
  }

  /** the folio items that holds last "X" searches performed */
  public search_history: SzSearchHistoryFolioItem[];

  private selectedPrimaryNavItem: NavItem = this.getDefaultMenuItem();
  public get showSubNav(): boolean {
    return (this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.submenuItems && this.selectedPrimaryNavItem.submenuItems.length > 0);
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

  /** when admin is enabled in the poc/api server the "Admin" sub menu is shown */
  public get showAdminOptions(): boolean {
    return true;
    //return this.aboutService.isAdminEnabled;
  }

  private submenuCollapseTimer;

  private getDefaultMenuItem(): NavItem {
    let retValue = this.menuItems[0];
    if(this.menuItems) {
      for(let key in this.menuItems) {
        let menuItem = this.menuItems[ key ];
        if(menuItem.default) {
          retValue = menuItem;
        }
      }
    }
    return retValue;
  }
  public isDisabled(itemKey: string): boolean {
    return (itemKey && this.menuItems[ itemKey ] && this.menuItems[ itemKey ].disabled) ? true : false;
  }
  public selectMenuItem(itemKey: string, ) {
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
  public onMouseEnterMenuItem(itemKey: string) {
    this.selectedPrimaryNavItem = this.menuItems[ itemKey ];
    this.onItemHover.emit(this.selectedPrimaryNavItem);
  }
  public onMouseLeaveMenuItem(itemKey: string) {
    /*
    this.submenuCollapseTimer = setTimeout(() => {
      this.selectedPrimaryNavItem = undefined
    }, 1000);
    */
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

  public get showGraphDataSources(): string [] {
    return this.uiService.graphFilterDataSources;
  }
  public onGraphOptionChange(event: {name: string, value: any}) {
    console.log('GraphComponent.onOptionChange: ', event);
    switch(event.name) {
      case 'showLinkLabels':
        //this.showMatchKeys = event.value;
        break;
    }
  }
}