import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {withSmartHandlerRoutes} from "ng-smart-on-fhir";
import {ScoreRiskComponent} from "./score-risk/score-risk.component";

const routes: Routes = withSmartHandlerRoutes([{
  path: '',
  component: ScoreRiskComponent
}], '/', 'both', true);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
