import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'sz-mapping-help-dialog',
  templateUrl: './mapping-help-dialog.component.html',
  styleUrls: ['./mapping-help-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class SzMappingHelpDialogComponent {
  constructor(private dialogRef: MatDialogRef<SzMappingHelpDialogComponent>) {}

  close() {
    this.dialogRef.close();
  }
}
