import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'sz-basic-dialog',
  templateUrl: './basic-dialog.component.html',
  styleUrls: ['./basic-dialog.component.scss'],
  imports: [
    MatDialogModule
  ]
})
export class SzBasicDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

  }
}
