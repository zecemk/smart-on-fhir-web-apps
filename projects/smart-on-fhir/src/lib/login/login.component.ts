import {Component, Inject} from '@angular/core';
import * as FHIR from 'fhirclient'
import {LoginClientConfig, SmartOnFhirConfig} from "../smart-on-fhir.module";

@Component({
  selector: 'lib-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(@Inject('sofConfig') public config: SmartOnFhirConfig) {
  }

  login(config: LoginClientConfig) {
    sessionStorage.removeItem('launchUrl')
    FHIR.oauth2.authorize({
      iss: config.iss,
      redirectUri: config.redirectUri,
      clientId: config.clientId,
      scope: config.scope,
      noRedirect: true
    }).then(redirectUrl => {
      const [url, params] = (<string>redirectUrl).split('?')
      let queryParams = params.split('&')
      if (config.aud) {
        queryParams = queryParams.filter(param => !param.startsWith('aud='))
        queryParams.push('aud=' + config.aud)
      }
      if (config.promptLogin) {
        queryParams.push('prompt=login')
      }
      window.location.href = [url, queryParams.join('&')].join('?')
    }, console.error)
  }
}
