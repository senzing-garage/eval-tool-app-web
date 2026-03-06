import { Component } from '@angular/core';
import { MatDialogRef, MatDialogContent, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { EulaLicenseComponent } from './eula-license.component';

@Component({
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    MatButtonModule,
    CdkDrag,
    EulaLicenseComponent
  ]
})
export class EulaComponent {
  constructor(private dialogRef: MatDialogRef<EulaComponent>) {}

  close() {
    this.dialogRef.close();
  }
}
