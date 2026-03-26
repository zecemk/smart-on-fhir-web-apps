import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {SmartCdsCommonModule} from "common";
import {environment} from "../environments/environment";
import { PatientSummaryComponent } from './patient-summary/patient-summary.component';
import { HeaderModule, SidebarModule, SummaryPanelModule } from 'ui-components';
import {NgxPaginationModule} from "ngx-pagination";
import {FormsModule} from "@angular/forms";
import {PatientHistoryComponent} from "./patient-summary/history/patient-history.component";


@NgModule({
  declarations: [AppComponent, PatientSummaryComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HeaderModule,
    SummaryPanelModule,
    SidebarModule,
    SmartCdsCommonModule.forRoot(environment),
    NgxPaginationModule,
    FormsModule,
    PatientHistoryComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
