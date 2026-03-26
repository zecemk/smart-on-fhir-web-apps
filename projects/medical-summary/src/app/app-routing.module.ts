import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientSummaryComponent } from './patient-summary/patient-summary.component';
import { withSmartHandlerRoutes } from 'ng-smart-on-fhir';
import { environment } from '../environments/environment';

const featureRoutes: Routes = [
  { path: 'summary', component: PatientSummaryComponent },
  { path: 'risks',   component: PatientSummaryComponent }
];

const smartRoutes: Routes = withSmartHandlerRoutes(
  featureRoutes, '/', 'both', true, environment.smart.shcLoginEnabled
);

const routes: Routes = [
  ...smartRoutes,
  { path: '', pathMatch: 'full', redirectTo: 'summary' },
  { path: '**', redirectTo: 'summary' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
