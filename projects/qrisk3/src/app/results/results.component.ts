import {Component} from '@angular/core';
import {CDSAutoExecutor, CdsSimulationComponent} from "common"
import {environment} from "../../environments/environment";

@Component({
  selector: 'qrisk3-results',
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent extends CdsSimulationComponent implements CDSAutoExecutor {

  override serviceName = environment.cds.serviceName
  override autoCallCdsService: true = true;

  valid = false
  initialScores: any[] = [];
  scores: any[] = [];

  protected override handleServiceResponseAndSuggestions(response: any, updateSuggestions: boolean) {
    try {
      const qrisk3Card = response.cards.find((card: any) => card.uuid === 'CVD CARD SCORE')
      const qrisk3Obs = <fhir4.Observation>qrisk3Card.suggestions[0].actions[0].resource;
      if (updateSuggestions) {
        this.suggestions = response.cards.filter((card: any) => card !== qrisk3Card)
      }
      this.scores = [Math.floor((qrisk3Obs?.valueQuantity?.value || 0) * 100) / 100,
        Math.floor((qrisk3Obs?.referenceRange?.at(0)?.high?.value || 0) * 100) / 100]
      if (!this.initialScores.length) {
        this.initialScores = this.scores
      }
    } catch (err) {
      if (!response?.cards?.length) {
        this.error = 'QRISK3 cannot be calculated. Make sure all required inputs are provided.'
      }
    }
  }

  protected override resetScores() {
    this.scores = [];
  }

  override handleServiceError(err: any) {
    this.error = err?.message || err?.toString() || 'Unknown error';
  }
}
