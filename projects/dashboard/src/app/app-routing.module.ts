import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {withSmartHandlerRoutes} from "ng-smart-on-fhir";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {ApplicationMetadataComponent} from "./application-metadata/application-metadata.component";

const routes: Routes = [
  ...withSmartHandlerRoutes([{
    path: 'dashboard',
    component: DashboardComponent
  }, {
    path: 'app/:id',
    component: ApplicationMetadataComponent
  }], 'dashboard', 'both', true),
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  }
  ]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
