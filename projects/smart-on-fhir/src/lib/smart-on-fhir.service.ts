import {Inject, Injectable} from '@angular/core';
import * as FHIR from 'fhirclient'
import Client from "fhirclient/lib/Client";
import {SmartOnFhirConfig} from "./smart-on-fhir.module";

@Injectable()
export class SmartOnFhirService {

  private client$ = FHIR.oauth2.ready().then(client => {
    this.checkPatientInToken(client)
    return client;
  })

  constructor(@Inject('sofConfig') public config: SmartOnFhirConfig = {}) {
  }

  getClient() {
    return this.client$;
  }

  private async ready<T>(callback: (client: Client) => Promise<T>): Promise<T> {
    return callback(await this.client$)
  }

  getPatient() {
    return this.ready<fhir4.Patient>(client => client.patient.read())
  }

  search<T>(resourceType: string, ...params: any[]): Promise<fhir4.Bundle<T>> {
    return this.ready<fhir4.Bundle<T>>(client => client.request({
      url: this.constructQueryURL(resourceType, params)
    }))
  }

  request<T>(url: string): Promise<fhir4.Bundle<T>> {
    return this.ready<fhir4.Bundle<T>>(client => client.request({
      url: url + (url.includes('Observation') ? '&_count=999' : '')
    }))
  }

  logout() {
    this.getClient().then(client => {
      const loginClient = this.config?.loginClients?.find(lc => lc.iss === client.state.serverUrl);
      if ((<any>loginClient)?.logoutUri) {
        window.location.href = (<any>loginClient).logoutUri
      }
    })
  }

  private constructQueryURL(resourceType: string, params?: { [key: string]: string|number }[]) {
    return resourceType + '?' + (params?.map(_params =>
      Object.keys(_params).map(key => key + '=' + _params[key]).join('&')
    ).filter(_ => _).join('&') || '');
  }

  private checkPatientInToken(client: Client) {
    const sessionId = sessionStorage['SMART_KEY']  && JSON.parse(sessionStorage['SMART_KEY'])
    if (sessionId && sessionStorage[sessionId]) {
      const session = JSON.parse(sessionStorage[sessionId])
      const token = session.tokenResponse?.access_token
      const parsed = JSON.parse(atob(token.split('.')[1]))
      if (!client.getPatientId() && parsed.patient) {
        session.tokenResponse.patient = parsed.patient
        sessionStorage[sessionId] = JSON.stringify(session)
        window.location.reload()
      }
    }
  }
}
