import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {withSmartHandlerRoutes} from "ng-smart-on-fhir";
import {FormComponent} from "./form/form.component";
import {ResultsComponent} from "./results/results.component";
import {environment} from "../environments/environment";

const routes: Routes = withSmartHandlerRoutes([
  {
    path: '',
    component: FormComponent
  },
  {
    path: 'results',
    component: ResultsComponent
  }
], '/', 'both', true, environment.smart.shcLoginEnabled);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
