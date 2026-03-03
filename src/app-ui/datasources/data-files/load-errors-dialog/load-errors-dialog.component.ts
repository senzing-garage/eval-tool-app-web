import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface LoadErrorsDialogData {
  errors: { dataSource: string; recordId: string | number; message: string; error: any }[];
  dataSourceName?: string;
}

@Component({
  selector: 'sz-load-errors-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Load Errors{{ data.dataSourceName ? ' - ' + data.dataSourceName : '' }}</h2>
    <mat-dialog-content>
      <div class="error-list">
        <div *ngFor="let err of data.errors; let i = index"
             class="error-row"
             [class.expanded]="expandedIndex === i"
             (click)="toggleExpand(i)">
          <div class="error-summary">
            <span class="error-index">{{ i + 1 }}.</span>
            <span class="error-ds" *ngIf="err.dataSource">{{ err.dataSource }}</span>
            <span class="error-rid" *ngIf="err.recordId">{{ err.recordId }}</span>
            <span class="error-message">{{ err.message }}</span>
            <span class="expand-icon material-icons">{{ expandedIndex === i ? 'expand_less' : 'expand_more' }}</span>
          </div>
          <div class="error-detail" *ngIf="expandedIndex === i">
            <div *ngIf="err.dataSource" class="detail-row"><strong>Data Source:</strong> {{ err.dataSource }}</div>
            <div *ngIf="err.recordId" class="detail-row"><strong>Record ID:</strong> {{ err.recordId }}</div>
            <div class="detail-row"><strong>Message:</strong> {{ err.message }}</div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }
    h2 {
      margin: 0;
      font-size: 18px;
    }
    mat-dialog-content {
      max-height: 60vh;
      overflow-y: auto;
    }
    .error-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .error-row {
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .error-row:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    .error-row.expanded {
      background-color: rgba(255, 255, 255, 0.08);
    }
    .error-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      min-height: 36px;
      overflow: hidden;
    }
    .error-index {
      flex-shrink: 0;
      opacity: 0.5;
      font-size: 12px;
      min-width: 28px;
    }
    .error-ds {
      flex-shrink: 0;
      font-size: 12px;
      font-weight: 500;
      color: #90caf9;
    }
    .error-rid {
      flex-shrink: 0;
      font-size: 12px;
      opacity: 0.7;
    }
    .error-message {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }
    .error-row.expanded .error-message {
      white-space: normal;
    }
    .expand-icon {
      flex-shrink: 0;
      font-size: 18px;
      opacity: 0.5;
    }
    .error-detail {
      padding: 4px 12px 12px 40px;
      font-size: 13px;
    }
    .detail-row {
      padding: 2px 0;
      word-break: break-all;
    }
    .detail-row strong {
      opacity: 0.7;
    }
  `]
})
export class SzLoadErrorsDialogComponent {
  expandedIndex: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<SzLoadErrorsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoadErrorsDialogData
  ) {}

  toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }
}
