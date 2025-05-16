import {Component} from '@angular/core';
import {CDSAutoExecutor, CdsSimulationComponent} from "common"
import {environment} from "../../environments/environment";

@Component({
  selector: 'advance-results',
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent extends CdsSimulationComponent implements CDSAutoExecutor {

  override serviceName = environment.cds.serviceName;
  override autoCallCdsService: true = true;

  valid = false
  initialScores: any[] = [];
  scores: any[] = [];

  protected override handleServiceResponseAndSuggestions(response: any, updateSuggestions: boolean) {
    try {
      const advanceCard = response.cards.find((card: any) => card.uuid === 'CVD CARD SCORE')
      const advanceObs = <fhir4.Observation>advanceCard.suggestions[0].actions[0].resource;
      if (updateSuggestions) {
        this.suggestions = response.cards.filter((card: any) => card !== advanceCard)
      }
      this.scores = [Math.floor((advanceObs?.valueQuantity?.value || 0) * 100) / 100,
        Math.floor((advanceObs?.referenceRange?.at(0)?.high?.value || 0) * 100) / 100]
      if (!this.initialScores.length) {
        this.initialScores = this.scores
      }
    } catch (err) {
      if (!response?.cards?.length) {
        this.error = 'ADVANCE cannot be calculated. Make sure all required inputs are provided.'
      }
    }
  }

  protected override resetScores() {
    this.scores = [];
  }

  override handleServiceError(err: any) {
    this.error = err?.message || err?.toString() || 'Unknown error';
  }

  scoreHandler(score: number):string {
    try {
      if(score<0.5) {
        return "<0.5"
      } else if(score > 83){
        return ">83"
      } else {
        return score.toString()
      }
    } catch (Error) {
      return ""
    }

  }
}
