import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'progress-circle',
  templateUrl: 'progress-circle.component.html',
  styleUrls: ['progress-circle.component.scss']
})

export class ProgressCircleComponent implements OnInit {
  @Input() progress: number = 0;
  @Input() width: string|number = '3em';
  @Input() height: string|number = '3em';
  @Input() backgroundColor: string|undefined;
  @Input() color: string|undefined;
  constructor() {
  }

  ngOnInit() {
  }
}
