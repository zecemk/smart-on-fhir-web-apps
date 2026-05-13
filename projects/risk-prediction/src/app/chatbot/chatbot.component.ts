import {Component, EventEmitter, Input, OnInit, Output, SecurityContext} from '@angular/core';
import {SmartOnFhirService} from "ng-smart-on-fhir";
import {CdsHooksService} from "cds-hooks";
import {Router} from "@angular/router";
import {DomSanitizer} from "@angular/platform-browser";
import MarkdownIt from 'markdown-it';
import {LocalPlotResponse} from "../results/llm-models";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";

const md = MarkdownIt()

@Component({
  selector: 'rp-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit {
  @Input() sessionId: string|undefined;
  @Input() disease: string|undefined;
  @Input() chart!: 'beeswarm'|'waterfall';
  @Input() context: string[] = [];
  @Input() riskPredictionObservation!: fhir4.Observation;
  @Input() runOnInit: boolean|undefined = true;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  private patient: fhir4.Patient | undefined;
  possibleNextQuestions: string[] = [];

  history: { user: boolean, text: string|null, error?: boolean }[] = []
  loading: boolean = false;
  @Input() localPlotResponse!: LocalPlotResponse;
  summary: boolean = true;
  increasingFactors: string[]|undefined;
  decreasingFactors: string[]|undefined;
  plotSummary: string|undefined;
  plotOverview: string|undefined;

  constructor(private router: Router, private sof: SmartOnFhirService, private http: HttpClient,
              private cds: CdsHooksService<fhir4.Resource>, private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    this.patient = await this.sof.getPatient()
    this.loading = true;
    if (this.runOnInit) this.init()
  }

  async init() {
    this.cds.callService({
      language: 'en',
      serviceId: 'shap_explain',
      context: {
        patientId: this.patient?.id,
        sessionId: this.sessionId,
        riskPredictions: this.chart === 'beeswarm' ? await firstValueFrom(this.http.get("assets/beeswarm/" + this.disease + "_beeswarm.json"))
          : this.localPlotResponse.results.find(result => result.disease === this.disease)?.plots['waterfall']
      },
      prefetch: {
        patient: this.patient,
        risk_predictions: { resourceType: 'Bundle', type: 'searchset', total: 1, entry: [{
            resource: this.riskPredictionObservation,
            search: { mode: 'match' }
          }] }
      }
    }).then(response => {
      console.log(response)
      this.possibleNextQuestions = response.cards?.at(0)?.suggestions?.filter((suggestion: any) => suggestion.uuid.startsWith("suggested-question")).map((suggestion: any) => suggestion.label) || []
      this.increasingFactors = JSON.parse(response.cards?.at(0)?.suggestions?.find((suggestion: any) => suggestion.uuid === 'increasing-factors')?.label || '[]')
      this.decreasingFactors = JSON.parse(response.cards?.at(0)?.suggestions?.find((suggestion: any) => suggestion.uuid === 'decreasing-factors')?.label || '[]')
      this.plotOverview = response.cards?.at(0)?.suggestions?.find((suggestion: any) => suggestion.uuid === 'overview')?.label
      this.plotSummary = response.cards?.at(0)?.suggestions?.find((suggestion: any) => suggestion.uuid === 'summary')?.label
      this.sessionId = response.cards?.at(0)?.summary
      console.log(this.possibleNextQuestions)
    }, err => {
      console.error(err);
      this.history.push({
        user: false,
        error: true,
        text: this.sanitizer.sanitize(SecurityContext.HTML, 'Something went wrong, please try again...')
      })
    }).finally(() => this.loading = false)
  }

  ask(question: string, scrollDiv?: HTMLElement) {
    this.possibleNextQuestions = []
    this.history.push({user: true, text: this.sanitizer.sanitize(SecurityContext.HTML, question)})
    this.loading = true;
    this.cds.callService({
      language: 'en',
      serviceId: 'ask_llm',
      context: {
        patientId: this.patient?.id,
        sessionId: this.sessionId,
        disease: this.disease,
        chartType: this.getExplaination(this.chart),
        question
      },
      prefetch: {
        patient: this.patient
      }
    }).then(response => {
      this.history.push({
        user: false,
        text: this.sanitizer.sanitize(SecurityContext.HTML, md.render(response.cards?.at(0)?.detail))
      })
      this.possibleNextQuestions = response.cards?.at(0)?.suggestions?.map((suggestion: any) => suggestion.label) || []
      console.log(this.history, this.possibleNextQuestions)
    }, err => {
      console.error(err);
      this.history.push({
        user: false,
        text: this.sanitizer.sanitize(SecurityContext.HTML, 'Something went wrong, please try again...')
      })
    }).finally(() => {
      this.loading = false
      if (scrollDiv) {
        setTimeout(() => {
          scrollDiv.scrollTo({
            top: scrollDiv.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    })
  }

  private getExplaination(chart: string | undefined) {
    switch (chart) {
      case 'waterfall':
        return `[Waterfall Chart, y-axis: SHAP feature names, x-axis: numeric SHAP values: negative values are shown as orange bars, positive values are shown as blue bars ]`
      default:
        return chart;
    }
  }
}
