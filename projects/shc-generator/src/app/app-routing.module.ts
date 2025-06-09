import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {withSmartHandlerRoutes} from "ng-smart-on-fhir";
import {ShcComponent} from "./shc/shc.component";

const routes: Routes = withSmartHandlerRoutes([
  {
    path: '',
    component: ShcComponent
  }
], '/', 'both', true);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
