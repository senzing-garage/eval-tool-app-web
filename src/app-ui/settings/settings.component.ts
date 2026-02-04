import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { SzPrefsService } from '@senzing/eval-tool-ui-common';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [
      CommonModule,
      FormsModule
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
      'searchForm.searchHistory'
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
      public prefs: SzPrefsService
    ) {}

    ngOnInit() {
      this.titleService.setTitle('Settings');
    }

    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
}
