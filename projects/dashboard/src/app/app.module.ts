import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {SmartOnFhirModule} from "ng-smart-on-fhir";
import {environment} from "../environments/environment";
import {HttpClientModule} from "@angular/common/http";
import {SidebarModule, HeaderModule} from "ui-components";
import { ApplicationMetadataComponent } from './application-metadata/application-metadata.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ApplicationMetadataComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    HeaderModule,
    SidebarModule,
    SmartOnFhirModule.forRoot(environment.smart)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
