import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { SzPrefsService, SzGrpcConfigManagerService, SzSearchIdentifiersPickerDialogComponent, SzSdkConfigAttr } from '@senzing/eval-tool-ui-common';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [
      CommonModule,
      FormsModule,
      MatButtonModule
    ]
  })
  export class AppSettingsComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    /** list of preference keys to hide from the UI */
    public hiddenPreferences: string[] = [
      'dataMart.dataSource1',
      'dataMart.dataSource2',
      'dataMart.defaultDataSource1',
      'dataMart.defaultDataSource2',
      'dataMart.defaultMatchLevel',
      'dataMart.defaultStatType',
      'dataMart.sampleDataSource1',
      'dataMart.sampleDataSource2',
      'dataMart.sampleStatType',
      'dataMart.sampleMatchLevel',
      'searchForm.savedSearches',
      'searchForm.searchHistory',
      'graph.suppressL1InterLinks',
      'graph.dataSourcesFiltered',
      'graph.matchKeysIncluded',
      'graph.matchKeyTokensIncluded',
      'graph.matchKeyCoreTokensIncluded',
      'graph.matchKeyTokenSelectionScope'
    ];

    /** list of sections to hide from the UI */
    public hiddenSections: string[] = [
      'admin'
    ];

    /** check if a preference key should be hidden */
    isHidden(key: string): boolean {
      return this.hiddenPreferences.includes(key);
    }

    /** check if an entire section should be hidden */
    isSectionHidden(section: string): boolean {
      return this.hiddenSections.includes(section);
    }

    constructor(
      private titleService: Title,
      private dialog: MatDialog,
      private configManager: SzGrpcConfigManagerService,
      public prefs: SzPrefsService
    ) {}

    /** opens the identifier types picker dialog */
    chooseIdentifiers() {
      this.configManager.config.then((config) => {
        const attributeTypes = config.attributes.filter((attr: SzSdkConfigAttr) => {
          return attr.ATTR_CLASS === 'IDENTIFIER';
        });

        const dialogRef = this.dialog.open(SzSearchIdentifiersPickerDialogComponent, {
          width: '375px',
          height: '50vh',
          data: {
            attributeTypes: attributeTypes,
            selected: this.prefs.searchForm.allowedTypeAttributes
          }
        });

        dialogRef.afterClosed().subscribe((result: SzSdkConfigAttr[]) => {
          if (result) {
            const newAllowedList = result.map((attrObj: SzSdkConfigAttr) => {
              return attrObj.ATTR_CODE;
            });
            this.prefs.searchForm.allowedTypeAttributes = newAllowedList;
          }
        });
      });
    }

    /** default value for truncateDataTableCellLines when set to true */
    private readonly TRUNCATE_DEFAULT_LINES = 3;

    /** getter for truncateDataTableCellLines that returns a number or null */
    get truncateCellLines(): number | null {
      const value = this.prefs.dataMart.truncateDataTableCellLines;
      if (value === false) {
        return null;
      } else if (value === true) {
        return this.TRUNCATE_DEFAULT_LINES;
      }
      return value as number;
    }

    /** setter for truncateDataTableCellLines */
    set truncateCellLines(value: number | null) {
      if (value === null || value === undefined || (value as any) === '') {
        this.prefs.dataMart.truncateDataTableCellLines = false;
      } else {
        this.prefs.dataMart.truncateDataTableCellLines = value;
      }
    }

    ngOnInit() {
      this.titleService.setTitle('Settings');
    }

    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
}
