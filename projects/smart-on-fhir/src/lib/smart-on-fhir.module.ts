import {ModuleWithProviders, NgModule} from '@angular/core';
import {SmartOnFhirService} from "./services/smart-on-fhir.service";
import {LoginComponent} from "./components/login/login.component";
import {LaunchComponent} from "./components/launch/launch.component";
import {CallbackComponent} from "./components/callback/callback.component";
import {AsyncPipe, KeyValuePipe, NgStyle} from "@angular/common";
import {QrReaderComponent} from "./components/qr-reader/qr-reader.component";
import {CamelCaseSpacedPipe} from "./pipes/camel-case-spaced.pipe";
import {ShcShlHandlerComponent} from "./components/shc-shl-handler/shc-shl-handler.component";
import {RouterModule} from "@angular/router";
import {SmartOnFhirConfig} from "./model/smart-on-fhir.config";
import {SmartAuthService} from "./services/smart-auth.service";
import {FormsModule} from "@angular/forms";

@NgModule({
    imports: [
        NgStyle, KeyValuePipe, RouterModule, AsyncPipe, FormsModule
    ],
  exports: [],
  declarations: [LoginComponent, LaunchComponent, CallbackComponent, QrReaderComponent, CamelCaseSpacedPipe, ShcShlHandlerComponent],
  providers: [SmartOnFhirService, SmartAuthService],
})
export class SmartOnFhirModule {
  static forRoot(config: SmartOnFhirConfig): ModuleWithProviders<SmartOnFhirModule> {
    return {
      ngModule: SmartOnFhirModule,
      providers: [SmartOnFhirService, {provide: 'sofConfig', useValue: config}, SmartAuthService]
    }
  }
}
