import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { SzStatisticsService } from '@senzing/eval-tool-ui-common';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    imports: [
      CommonModule
    ],
    providers: [
      SzStatisticsService
    ],
    styleUrls: ['./overview.component.scss']
  })
  export class AppOverViewComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    public getStats() {
      //let url =  `/data-mart/statistics/sizes/1`;

      //this.statsService.getEntitySizeBreakdown().subscribe((results)=>{
        this.statsService.getEntitySizeCount(1).subscribe((results)=>{
        console.log(`Got entity size breakdown: `, results);
        alert('got stats...')
      })
    }

    constructor(
      private statsService: SzStatisticsService
    ) {
      
    }
    ngOnInit () {

    }
}