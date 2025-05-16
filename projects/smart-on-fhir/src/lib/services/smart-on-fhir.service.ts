import {Inject, Injectable} from '@angular/core';
import * as FHIR from 'fhirclient'
import Client from "fhirclient/lib/Client";
import {SmartAuthService} from "./smart-auth.service";
import {SmartOnFhirConfig} from "../model/smart-on-fhir.config";
import {client} from "fhirclient";

@Injectable()
export class SmartOnFhirService {

  private importedSHCards: { label?: string, shc: string[], bundle: fhir4.Bundle }[] = [];
  private _importedResources: { [rtype: string]: fhir4.Resource[] } = {};

  get importedResources() {
    return this._importedResources;
  }

  constructor(@Inject('sofConfig') public config: SmartOnFhirConfig = {}, private auth: SmartAuthService) {
  }

  getClient() {
    return this.auth.getClient();
  }

  private async ready<T>(callback: (client: Client) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    return client ? callback(client) : Promise.reject()
  }

  getPatient() {
    return this.auth.getPatient()
  }

  search<T>(resourceType: string, ...params: any[]): Promise<fhir4.Bundle<T>> {
    return this.ready<fhir4.Bundle<T>>(client => client.request({
      url: this.constructQueryURL(resourceType, params)
    }))
  }

  create<T>(resource: T, id?: string): Promise<T> {
    return this.ready<T>(client => {
      if (id) {
        const _resource = { ...resource, id: id }
        return client.update<T>(<any>resource);
      } else {
        const _resource: any = {...resource};
        delete _resource.id;
        return client.create<T>(_resource);
      }
    })
  }

  operation<T>(options: {
    operationName: string,
    resourceType?: string,
    resourceId?: string,
    params?: fhir4.Parameters
    queryParams?: { [key: string]: string|number }[],
  }) {
    const opUrl = (options.resourceType ? options.resourceType + (options.resourceId ? '/' + options.resourceId : '') + '/' : '')
      + '$' + options.operationName;
    return this.ready<T>(client => client.request({
      method: 'POST',
      url: opUrl + (options.queryParams?.length ? this.constructQueryURL('', options.queryParams) : ''),
      body: JSON.stringify(options.params || {})
    }));
  }

  request<T>(url: string): Promise<fhir4.Bundle<T>> {
    if (url.length >= 2048) {
      return this.ready<fhir4.Bundle<T>>(client => client.request({
        method: 'POST',
        url: '',
        body: JSON.stringify({
          resourceType: 'Bundle',
          type: 'batch',
          entry: [{
            request: {
              url,
              method: 'GET'
            }
          }]
        })
      })).then(bundle => <fhir4.Bundle<T>>bundle.entry?.at(0)?.resource);
    }
    return this.ready<fhir4.Bundle<T>>(client => client.request({
      url: url + (url.includes('Observation') ? '&_count=999' : '')
    }))
  }

  logout() {
    this.auth.logout()
  }

  private constructQueryURL(resourceType: string, params?: { [key: string]: string|number }[]) {
    return resourceType + '?' + (params?.map(_params =>
      Object.keys(_params).map(key => key + '=' + _params[key]).join('&')
    ).filter(_ => _).join('&') || '');
  }

  importSHCData(param: { label?: string, shc: string[], bundle: fhir4.Bundle }) {
    const {bundle, shc} = param;
    this.importedSHCards.push(param)
    this._importedResources = this.importedSHCards.map(shc =>
      shc.bundle.entry?.map(entry => entry.resource) || []).flat()
      .reduce((o: any, r: fhir4.Resource|undefined) => {
        if (!r) { return; }
        if (!o[r.resourceType]) { o[r.resourceType] = [] }
        o[r.resourceType].push(r);
        return o;
      }, {})
    const patient = bundle.entry?.find(entry => entry.resource?.resourceType === 'Patient')?.resource;
    this.auth.offline(<fhir4.Patient>patient, shc);
  }

  getAllImportedResources() {
    return Object.values(this.importedResources).flat();
  }
}
