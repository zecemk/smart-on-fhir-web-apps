import {NgModule} from '@angular/core';

import {ProgressCircleComponent} from './progress-circle.component';
import {CommonModule} from "@angular/common";

@NgModule({
  imports: [CommonModule],
  exports: [ProgressCircleComponent],
  declarations: [ProgressCircleComponent],
  providers: [],
})
export class ProgressCircleModule {
}
