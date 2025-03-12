import { Injectable } from '@angular/core';
import {SmartOnFhirService} from "smart-on-fhir";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom, take} from "rxjs";

export interface SHLinkManifest {
  url: string;
  key: string;
  exp?: string;
  flag?: 'L'|'U'|'P'|'LU'|'LP';
  label?: string; // max len: 80
  v?: number;
}

interface SHLinkCreateResponse {
  manifest: SHLinkManifest;
  qr: string;
}

export class SHLink {

  private _manifest: SHLinkManifest;
  private _qr: string;
  private _link: string;
  private _copied: boolean = false;
  private _serviceId: string|undefined;
  nbf: Date|undefined;
  exp: Date|undefined;
  needPasscode?: string;
  passcode?: string;

  get serviceId() {
    return this._serviceId;
  }

  get copied(): boolean {
    return this._copied;
  }

  get label() {
    return this._manifest.label;
  }

  get url() {
    return this._manifest.url;
  }

  get link(): string {
    return this._link;
  }

  get isPasswordProtected() {
    return !!this._manifest.flag?.includes('P');
  }

  get qr(): string {
    return this._qr;
  }

  constructor(resp: SHLinkCreateResponse, serviceId?: string) {
    this._manifest = resp.manifest;
    this._qr = resp.qr;
    this._link = 'shlink:/' + btoa(JSON.stringify(this._manifest))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    this.exp = this._manifest?.exp ? new Date(this._manifest.exp) : undefined;
    this._serviceId = serviceId;
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.link).then(() => {
      this._copied = true;
      setTimeout(() => this._copied = false, 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  async store(patientId: string | undefined, password: string | undefined, fhirUrl: string | undefined) {
    if (!password) { throw new Error('Password is required.'); }
    const encrypted = await SHLink.encryptData(JSON.stringify({
      manifest: this._manifest,
      qr: this._qr
    }), password)
    const stored: any[] = JSON.parse(localStorage.getItem([patientId, fhirUrl, this.serviceId].join('.')) || '[]')
    stored.splice(0, 0, encrypted)
    localStorage.setItem([patientId, fhirUrl, this.serviceId].join('.'), JSON.stringify(stored))
  }

  static async loadStored(patientId: string | undefined, password: string, fhirUrl: string | undefined, serviceId: string|undefined) {
    const encrypted = localStorage.getItem([patientId, fhirUrl, serviceId].join('.'))
    if (encrypted) {
      return await Promise.all((<any[]>JSON.parse(encrypted)).map(data => SHLink.decryptData(data, password)))
        .then(data => {
          return data.map(shl => new SHLink(JSON.parse(shl), serviceId))
        })
    } else {
      return [];
    }
  }

  static async encryptData(data: string, password: string) {
    const encoder = new TextEncoder();

    // Generate a salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive a key from the password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );

    // Generate an initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    return {
      cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  static async decryptData(storedData: any, password: string) {
    const decoder = new TextDecoder();

    // Retrieve encrypted data, salt, and IV from storage
    if (!storedData.cipherText || !storedData.salt || !storedData.iv) {
      throw new Error('No encrypted data found');
    }

    const cipherText = Uint8Array.from(atob(storedData.cipherText), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(storedData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(storedData.iv), c => c.charCodeAt(0));

    // Derive the key from the password
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherText
    );

    return decoder.decode(decrypted);
  }


}

@Injectable({
  providedIn: 'root'
})
export class ShlApiService {

  private patient: fhir4.Patient|undefined;
  private fhirUrl: string|undefined;
  private password: string|undefined;

  constructor(private sof: SmartOnFhirService, private http: HttpClient) {
    this.sof.getClient().then(client => this.fhirUrl = client?.state.serverUrl)
    this.sof.getPatient().then(patient => this.patient = patient);
  }

  async create(data: fhir4.Parameters, service: string, passcode?: string): Promise<any> {
    let response: SHLinkCreateResponse = await firstValueFrom<SHLinkCreateResponse>(
      this.http.post<SHLinkCreateResponse>('http://localhost:3000/shl/create', {
        shc: {verifiableCredential: data.parameter?.filter(parameter => parameter.name === 'verifiableCredential').map(parameter => parameter.valueString)},
        label: this.patient?.name?.map(name => (name.given || []).join(' ') + name.family) + "'s data for " + service,
        passcode: passcode || undefined
    }));
    return new SHLink(response, service);
  }

  async store(link: SHLink) {
    return await link.store(this.patient?.id, this.password, this.fhirUrl);
  }

  checkStored(serviceId: string) {
    return !!this.patient && !!serviceId && !!localStorage[[this.patient?.id, this.fhirUrl, serviceId].join('.')];
  }

  async load(serviceId: string) {
    if (!this.password) { throw new Error('Password is needed.'); }
    if (!this.patient) { throw new Error('Unknown patient.'); }
    return await SHLink.loadStored(this.patient.id, this.password, this.fhirUrl, serviceId);
  }

  setPassword(password: string) {
    this.password = password;
  }

  clearStore(serviceId: string) {
    delete localStorage[[this.patient?.id, this.fhirUrl, serviceId].join('.')]
  }
}
