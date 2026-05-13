import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import {SmartCdsCommonModule} from "common";
import {FormsModule} from "@angular/forms";
import {environment} from "../environments/environment";
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {QuestionComponent} from "./question/question.component";
import { ResultsComponent } from './results/results.component';
import {ProgressCircleModule, SidebarModule, SummaryPanelModule, HeaderModule} from "ui-components";
import {ChartjsModule} from "@coreui/angular-chartjs";
import { ChatbotComponent } from './chatbot/chatbot.component';
import {MenuService} from "./menu.service";
import {PatientSummaryComponent} from "./patient-summary/patient-summary.component";
import {NgxPaginationModule} from "ngx-pagination";
import {HistorySettingsComponent} from "./patient-summary/history/history-settings.component";
import {PatientHistoryComponent} from "./patient-summary/history/patient-history.component";


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    QuestionComponent,
    ResultsComponent,
    ChatbotComponent,
    HistorySettingsComponent,
    PatientHistoryComponent,
    PatientSummaryComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SmartCdsCommonModule.forRoot(environment),
    FormsModule,
    HttpClientModule,
    ChartjsModule,
    ProgressCircleModule,
    NgxPaginationModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    SidebarModule,
    HeaderModule,
    SummaryPanelModule,
  ],
  providers: [MenuService],
  bootstrap: [AppComponent],

})
export class AppModule {
}

