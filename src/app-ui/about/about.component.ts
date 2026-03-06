import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AboutInfoService } from '../services/about.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule
  ]
})
export class AboutComponent {
  constructor(
    public aboutService: AboutInfoService,
    private dialogRef: MatDialogRef<AboutComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
