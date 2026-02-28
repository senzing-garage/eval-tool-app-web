import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ErrorPageComponent } from '../../common/error/error.component';

@Component({
  selector: 'app-error-unknown',
  templateUrl: './unknown.component.html',
  styleUrls: ['./unknown.component.scss'],
  imports: [
    CommonModule, ErrorPageComponent
  ]
})
export class UnknownErrorComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
