import {Component, Signal} from '@angular/core';
import {Router} from "@angular/router";
import {CdsHooksService} from "cds-hooks";
import {SmartOnFhirService} from "ng-smart-on-fhir";
import {HttpClient} from "@angular/common/http";
import {ShlApiService, SHLink} from "../services/shl-api.service";
import { v4 as UUID } from "uuid";

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
  ipsLoading: boolean = false;
  conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[] = [];
  services: string[] = [];
  selectedService: string|undefined;

  vsStatus: 'IDLE'|'LOADING'|'CREATING'|'CREATED'|'FOUND'|'ERROR' = 'IDLE';
  serviceValueSetUrls: {[serviceId: string]: string} = {};
  links: { [serviceId: string]: SHLink[] } = {};
  stored: SHLink[] = [];
  passcode: string|undefined;
  currentTab: 'cds'|'ips' = 'cds';
  ips: {
    allergies: fhir4.AllergyIntolerance[];
    vitalSigns: fhir4.Observation[];
    immunizations: fhir4.Immunization[];
    medications: fhir4.MedicationStatement[];
    labResults: fhir4.Observation[];
    conditions: fhir4.Condition[]
  } = {
    allergies: [],
    vitalSigns: [],
    immunizations: [],
    medications: [],
    labResults: [],
    conditions: []
  };
  ipsCompositionLoading: boolean = false;
  composition: fhir4.Composition|undefined;
  ipsBundle: fhir4.Bundle<fhir4.Resource> | undefined;

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
    this.prepareIPS();
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

  private async prepareIPS() {
    this.ipsLoading = true;
    const distinctPages = async <T extends fhir4.Resource>(resourceType: string, codePath: string, dateParam: string, params?: fhir4.Parameters): Promise<T[]> =>
      (await this.sof.operation<fhir4.Bundle<T>>({operationName: 'distinct-pages', resourceType, queryParams: [{
        codePath: codePath, subject: 'Patient/' + this.patient?.id, dateParam, _count: 999
      }], params
    })).entry?.map(entry => <T>entry.resource) || []
    const conditions = await distinctPages<fhir4.Condition>('Condition', 'code.coding.code', 'onset-date')
    const medications = await distinctPages<fhir4.MedicationStatement>('MedicationStatement', 'medicationCodeableConcept.coding.code', 'effective')
    const allergies = await distinctPages<fhir4.AllergyIntolerance>('AllergyIntolerance', 'code.coding.code', 'date')
    const immunizations = await distinctPages<fhir4.Immunization>('Immunization', 'vaccineCode.coding.code', 'date')
    const observationCategoryParams = (category: string) => distinctPages<fhir4.Observation>('Observation', 'code.coding.code', 'date', {
        resourceType: 'Parameters',
        parameter: [{
          name: 'queryParams',
          resource: {
            resourceType: 'Parameters',
            parameter: [{
              name: 'category',
              valueString: category
            }]
          }
        }]
      })
    const labResults = await observationCategoryParams('laboratory')
    const vitalSigns = await observationCategoryParams('vital-signs')
    this.ips = { conditions, medications, immunizations, allergies, labResults, vitalSigns };
    this.updateIPSComposition();
  }

  getDosageString(medication: fhir4.MedicationStatement): string {
    if (!medication.dosage?.length) { return ''; }
    return medication.dosage.map(dosage => {
      // if (dosage.text) { return dosage.text; }
      let dosageQuantity = '';
      if (dosage.doseAndRate?.length) {
        dosageQuantity = dosage.doseAndRate.map(dose => dose.doseQuantity?.value + ' ' + (dose.doseQuantity?.unit || dose.doseQuantity?.code)).join(', ')
      }
      if (dosage.timing) {
        if (dosage.timing.repeat) {
          return dosageQuantity + ' ' + [dosage.timing.repeat.frequency, '/', dosage.timing.repeat.period, dosage.timing.repeat.periodUnit].join('');
        }
        if (dosage.timing.event?.length) return dosage.timing.event.join(', ');
      }
      return '';
    }).join(', ')
  }

  private async updateIPSComposition() {
    this.ipsCompositionLoading = true;
    const bundle = await this.sof.search<fhir4.Composition>('Composition', {
      subject: 'Patient/' + this.patient?.id,
      type: 'http://loinc.org|60591-5',
      _sort: '-date',
      _count: 1
    }).catch(() => undefined);
    const userId = (await this.sof.getClient())?.getIdToken()?.sub
    const composition = bundle?.entry?.at(0)?.resource || <fhir4.Composition>{
      resourceType: 'Composition',
      id: UUID(),
      type: {
        coding: [{
          code: '60591-5',
          system: 'http://loinc.org',
          display: 'Patient Summary Document'
        }]
      },
      subject: {
        reference: 'Patient/' + this.patient?.id
      },
      status: 'final',
      title: 'Patient Summary'
    }
    if (userId) {
      composition.author = [{
        reference: 'Practitioner/' + userId
      }]
    }
    composition.date = new Date().toISOString();
    composition.section = [
      {
        title: 'Active Problems',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Active conditions of the patient</div>' },
        code: {
          coding: [{
            "system": "http://loinc.org",
            "code": "11450-4",
            "display": "Problem list Reported"
          }]
        },
        entry: (this.ips.conditions || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
      {
        title: 'Medications',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Active medications of the patient</div>' },
        code: {
          coding: [{
            "system": "http://loinc.org",
            "code": "10160-0",
            "display": "History of Medication use Narrative"
          }]
        },
        entry: (this.ips.medications || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
      {
        title: 'Allergies and Intolerances',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Allergies and intolerances of the patient</div>' },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '48765-2',
              display: 'Allergies and adverse reactions Document'
            }
          ]
        },
        entry: (this.ips.allergies || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
      {
        title: 'Immunizations',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Immunization history of the patient</div>' },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11369-6',
              display: 'History of Immunization Narrative'
            }
          ]
        },
        entry: (this.ips.immunizations || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
      {
        title: 'Results',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Lab results of the patient</div>' },
        code: {
          coding: [
            {
              "system": "http://loinc.org",
              "code": "30954-2",
              "display": "Relevant diagnostic tests/laboratory data Narrative"
            }
          ]
        },
        entry: (this.ips.labResults || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
      {
        title: 'Vitals',
        text: { status: 'generated', div: '<div xmlns=\"http://www.w3.org/1999/xhtml\">Vital sign measurements of the patient</div>' },
        code: {
          coding: [
            {
              "system": "http://loinc.org",
              "code": "8716-3",
              "display": "Vital signs"
            }
          ]
        },
        entry: (this.ips.vitalSigns || []).map(resource => ({ reference: resource.resourceType + '/' + resource.id }))
      },
    ]
    composition.section.forEach(section => {
      if (!section.entry?.length) {
        delete section.entry;
        section.text = {
          status: 'empty',
          div: '<div xmlns=\"http://www.w3.org/1999/xhtml\"><b>No results</b></div>'
        }
      }
    })
    this.composition = composition;
    // console.log(JSON.stringify(this.composition));
    const ipsBundle: fhir4.Bundle<fhir4.Resource> = {
      resourceType: 'Bundle',
      identifier: {
        system: 'urn:oid:2.16.724.4.8.10.200.10',
        value: UUID()
      },
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [ this.composition ]
    }
    Object.values(this.ips).flat().forEach((resource: fhir4.Resource) => {
      ipsBundle.entry?.push({
        fullUrl: resource.resourceType + '/' + resource.id,
        resource
      })
    })
    if (this.patient) {
      const patient = Object.assign({}, this.patient)
      delete patient.photo;
      ipsBundle.entry?.push({
        fullUrl: 'Patient/' + this.patient.id,
        resource: patient
      })
    }
    if (userId) {
      const practitioner = (await this.sof.search<fhir4.Practitioner>('Practitioner', {_id: userId})).entry?.at(0)?.resource
      if (practitioner) {
        delete practitioner.photo;
        ipsBundle.entry?.push({
          fullUrl: 'Practitioner/' + userId,
          resource: practitioner
        })
      }
    }
    this.ipsBundle = ipsBundle;
    this.ipsCompositionLoading = false;
  }

  async createIPSCard() {
    if (!this.composition) { return; }
    await this.sof.create<fhir4.Composition>(this.composition, this.composition.id)
    const data = await this.sof.operation<fhir4.Parameters>({
      resourceType: 'Patient',
      resourceId: this.patient?.id,
      operationName: 'health-cards-issue',
      params: {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'credentialType',
            valueUri: '#ips'
          }
        ]
      }
    })
    this.shl.create(data, 'IPS', this.passcode?.trim()).then(data => {
      this.links['IPS'] = [data, ...(this.links['IPS'] || [])];
    });
  }

  downloadIPS() {
    const jsonStr = JSON.stringify(this.ipsBundle, null, 2); // pretty-print with 2-space indentation
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'IPS.json';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url); // clean up
  }
}
