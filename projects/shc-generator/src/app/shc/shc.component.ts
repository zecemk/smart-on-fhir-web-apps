import {Component, Signal} from '@angular/core';
import {Router} from "@angular/router";
import {CdsHooksService} from "cds-hooks";
import {SmartOnFhirService} from "smart-on-fhir";
import {HttpClient} from "@angular/common/http";
import {ShlApiService, SHLink} from "../services/shl-api.service";

@Component({
  selector: 'app-shc',
  templateUrl: './shc.component.html',
  styleUrl: './shc.component.scss'
})
export class ShcComponent {

  title = 'shc-generator';

  error: string | undefined;
  patient: fhir4.Patient|undefined;

  loading: boolean = false;
  conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[] = [];
  services: string[] = [];
  selectedService: string|undefined;

  vsStatus: 'IDLE'|'LOADING'|'CREATING'|'CREATED'|'FOUND'|'ERROR' = 'IDLE';
  serviceValueSetUrls: {[serviceId: string]: string} = {};
  links: { [serviceId: string]: SHLink[] } = {};
  stored: SHLink[] = [];
  passcode: string|undefined;

  get storedExists() {
    return this.selectedService && this.shl.checkStored(this.selectedService);
  }

  constructor(private sof: SmartOnFhirService, private cdsHooksService: CdsHooksService<fhir4.Resource>,
              private router: Router, private http: HttpClient, private shl: ShlApiService) {
  }

  async ngOnInit() {
    this.loading = true;
    this.patient = await this.sof.getPatient()
    this.services = (await this.cdsHooksService.listServices()).filter(service => service !== 'valueset' && service !== 'definition');
    if (this.services[0]) {
      await this.setService(this.services[0]);
    }
    this.loading = false
  }

  async setService(selectedService: string) {
    this.loading = true;
    this.stored = [];
    this.vsStatus = 'LOADING';
    const vsCard = await this.cdsHooksService.callService({
      serviceId: 'valueset',
      context: { serviceId: selectedService },
      prefetch: {}
    }).catch(err => undefined)
    const vs = vsCard?.cards.at(0)?.suggestions?.at(0)?.actions?.at(0)?.resource;
    if (vs.resourceType === 'ValueSet') {
      this.serviceValueSetUrls[selectedService] = vs.url;
      const resp = await this.sof.search<fhir4.ValueSet>('ValueSet', { url: vs.url })
        .catch(err => undefined);
      const valueSet = resp?.entry?.find(entry => entry.resource?.resourceType === 'ValueSet')?.resource;
      if (!valueSet) {
        this.vsStatus = 'CREATING';
        try {
          await this.sof.create(vs);
          this.vsStatus = 'CREATED';
          this.selectedService = selectedService;
        } catch (e: Error|any) {
          this.vsStatus = 'ERROR';
          this.error = e.message;
        }
      } else {
        this.vsStatus = 'FOUND';
        this.selectedService = selectedService;
      }
    } else {
      this.error = 'CDS definition could not be fetched.';
      this.vsStatus = 'ERROR';
    }
    this.loading = false;
  }

  async createSmartHealthCard() {
    if (!this.selectedService) { return; }
    const service = this.selectedService;
    const definition = await this.cdsHooksService.getServiceDefinition(service);
    const resourceTypes = Object.keys(Object.values<string>(definition.prefetch)
      .map(query => query.split('?')[0].split('/')[0])
      .reduce((obj: any, rt) => { obj[rt] = true; return obj; }, {}));
    this.sof.operation<fhir4.Parameters>({
      resourceType: 'Patient',
      resourceId: this.patient?.id,
      operationName: 'health-cards-issue',
      params: {
        resourceType: 'Parameters',
        parameter: [
          ...resourceTypes.map(resourceType => ({
            name: 'credentialType',
            valueUri: resourceType
          })),
          {
            name: 'credentialValueSet',
            valueUrl: this.serviceValueSetUrls[service]
          }
        ]
      }
    }).then((data: fhir4.Parameters) => {
      this.shl.create(data, service, this.passcode?.trim()).then(data => {
        this.links[service] = [data, ...(this.links[service] || [])
        ];
      });
    })
  }

  async storeLink(link: SHLink) {
    this.shl.setPassword(prompt('Enter password') || '');
    if (this.storedExists && this.selectedService) {
      try {
        await this.shl.load(this.selectedService);
      } catch (err) {
        const deleteAll = confirm('Incorrect password! Would you like to delete all previously cards and continue with this password? This action could not be undone.')
        if (!deleteAll) {
          return;
        } else {
          this.shl.clearStore(this.selectedService);
        }
      }
    }
    this.shl.store(link).then(() => {
      this.stored.splice(0, 0, link)
      if (link.serviceId) {
        this.links[link.serviceId].splice(this.links[link.serviceId].indexOf(link), 1)
      }
    }, err => alert(err));
  }

  async unlock() {
    if (!this.selectedService) return;
    this.shl.setPassword(prompt('Enter password') || '');
    try {
      this.stored = await this.shl.load(this.selectedService);
    } catch (err) {
      alert('Incorrect password!')
    }
  }
}
