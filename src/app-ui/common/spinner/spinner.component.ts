import { Component } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  imports: [CommonModule]
})
export class SpinnerComponent {

  public get active(): boolean {
    return this.spinner.active;
  }

  public set active(value: boolean) {
    this.spinner.active = value;
  }

  public get label(): string {
    return this.spinner.label;
  }

  constructor(private spinner: SpinnerService) {}
}
