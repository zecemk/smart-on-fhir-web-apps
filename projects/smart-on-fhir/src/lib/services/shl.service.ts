import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import * as jose from 'jose';
import * as pako from 'pako';

@Injectable({
  providedIn: 'root'
})
export class ShlService {

  get emptyBundle(): fhir4.Bundle {
    return {
      resourceType: 'Bundle',
      type: 'document',
      entry: []
    }
  }

  constructor(private http: HttpClient) {
  }

  async handleShl(shl: string) {
    if (shl.startsWith('shlink:/')) { shl = shl.slice('shlink:/'.length) }
    const metadata: { url: string, label?: string, flag?: string, key: string } = JSON.parse(atob(shl))
    if (!metadata.url) {
      throw new Error('URL is missing in SMART Health Link')
    }
    let payload;
    if (metadata.flag?.includes('U')) {
      payload = await firstValueFrom(this.http.get(metadata.url + '?recipient=' + window.location.origin))
        .then((data: any) => data.files.filter((file: any) => file.contentType === 'application/smart-health-card' && file.embedded).map((file: any) => file.embedded))
    } else {
      let passcode;
      if (metadata.flag?.includes('P')) {
        passcode = prompt('Enter the passcode for SMART Health Link')
      }
      payload = await firstValueFrom(this.http.post(metadata.url, {
        recipient: window.location.origin,
        passcode
      })).then((data: any) => data.files.filter((file: any) => file.contentType === 'application/smart-health-card' && file.embedded).map((file: any) => file.embedded))
    }
    if (!payload) { throw new Error('Cannot get SMART Health Link content.') }
    const shcs = await this.decryptSHLPayloadAndGetSHCs(payload, metadata.key)
    const bundles = await Promise.all(shcs.map(shc => this.getSingleBundle(shc)))
    return {
      label: metadata.label,
      shc: shcs,
      verified: await Promise.all(shcs.map(_shc => this.verifyShc(_shc))).then(results => results.every(value => value)),
      bundle: <fhir4.Bundle>Object.assign(this.emptyBundle, {
        entry: bundles.filter(_ => _).map(bundle => bundle.entry).reduce((arr, entries) => arr.concat(entries), [])
      })
    };
  }

  private async decryptSHLPayloadAndGetSHCs(payload: string[], key: string) {
    const SHCs: string[] = []
    for (const encrypted of payload) {
      const data = await jose.compactDecrypt(encrypted, jose.base64url.decode(key))
      SHCs.push(...JSON.parse(new TextDecoder().decode(data.plaintext)).verifiableCredential)
    }
    return SHCs;
  }

  async handleShc(shc: string) {
    if (shc.startsWith('shc:/')) { shc = shc.slice('shc:/'.length) }
    return {
      shc: [shc],
      bundle: await this.getSingleBundle(shc),
      verified: await this.verifyShc(shc)
    };
  }

  async getSingleBundle(shc: string) {
    return await this.parseShc(shc).then(data => data.vc.credentialSubject.fhirBundle)
  }

  private async parseShc(shc: string): Promise<any> {
    try {
      const [h, p, s] = shc.split('.').map((part) => this.base64UrlToBytes(part));
      return JSON.parse(this.inflate(p));
    } catch (error) {
      console.error('Error parsing SMART Health Card:', error);
      throw error;
    }
  }

  private async verifyShc(shc: string): Promise<boolean> {
    try {
      await jose.compactVerify(shc, jose.createLocalJWKSet(await this.fetchJWKs(shc)));
      return true;
    } catch (err) {
      return false;
    }
  }

  private async fetchJWKs(shc: string): Promise<jose.JSONWebKeySet> {
    try {
      const card = JSON.parse(this.inflate(this.base64UrlToBytes(shc.split('.')[1])));
      const issuer = card.iss;
      const jwksUrl = `${issuer.replace(/\/$/, '')}/.well-known/jwks`;

      const jwksResponse = await firstValueFrom(this.http.get<jose.JSONWebKeySet>(jwksUrl));
      return jwksResponse;
    } catch (error) {
      console.error('Error fetching JWKs:', error);
      throw new Error('Unable to fetch JWKs for signature verification');
    }
  }

  private inflate(data: Uint8Array): string {
    try {
      const decompressed = pako.inflateRaw(data, { to: 'string' });
      return decompressed;
    } catch (error) {
      console.error('Error inflating data:', error);
      throw new Error('Failed to inflate data');
    }
  }

  private base64UrlToBytes(base64Url: string): Uint8Array {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
  }


}
