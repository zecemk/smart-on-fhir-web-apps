import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import {SmartCdsCommonModule} from "common";
import {FormsModule} from "@angular/forms";
import {environment} from "../environments/environment";
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpClient} from "@angular/common/http";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {QuestionComponent} from "./question/question.component";
import { ResultsComponent } from './results/results.component';
import {SidebarModule, SummaryPanelModule, HeaderModule} from "ui-components";


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    QuestionComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SmartCdsCommonModule.forRoot(environment),
    FormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    SidebarModule,
    HeaderModule,
    SummaryPanelModule
  ],
  providers: [],
  bootstrap: [AppComponent],

})
export class AppModule {
}

