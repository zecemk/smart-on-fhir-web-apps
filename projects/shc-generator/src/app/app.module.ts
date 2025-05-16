import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {environment} from '../environments/environment';
import {SmartCdsCommonModule} from 'common';
import { ShcComponent } from './shc/shc.component'
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {DatePipe} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    ShcComponent
  ],
  imports: [
    DatePipe,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SmartCdsCommonModule.forRoot(environment),
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
