import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface ShapFeature {
  name: string;
  value: number;
}

interface DiseaseRisk {
  disease: string;
  riskScore: number;
  shapFeatures: ShapFeature[];
  expanded: boolean;
}

interface SummaryItem {
  primary: string;
  secondary?: string;
  date?: string;
  source?: string;
  linkLabel?: string;  // "Show SHAP Details"
  linkHref?: string;   // Will use this to store disease index for lookup
  diseaseIndex?: number; // Store index to find disease
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

  diseases: DiseaseRisk[] = [];
  overallRiskScore: number = 0;
  loading: boolean = true;
  error: string | null = null;

  // Summary panel items
  highRiskItems: SummaryItem[] = [];
  moderateRiskItems: SummaryItem[] = [];
  lowRiskItems: SummaryItem[] = [];

  // Track which disease SHAP is showing
  selectedDiseaseForShap: DiseaseRisk | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadResults();
    this.loading = false;
  }

  private loadResults() {
    try {
      const saved = localStorage.getItem('questionnaire_results');
      if (saved) {
        const cards = JSON.parse(saved);
        this.processCards(cards);
        this.prepareSummaryPanels();
      } else {
        this.error = 'No prediction data available. Please complete the questionnaire first.';
      }
    } catch (e) {
      console.error('Error loading results:', e);
      this.error = 'Error loading prediction results';
    }
  }

  private processCards(cards: any[]) {
    try {
      for (const card of cards) {
        if (card.suggestions && card.suggestions.length > 0) {
          for (const suggestion of card.suggestions) {
            if (suggestion.actions && suggestion.actions.length > 0) {
              for (const action of suggestion.actions) {
                if (action.type === 'create' && action.resource?.resourceType === 'Bundle') {
                  this.processBundle(action.resource);
                  return;
                }
              }
            }
          }
        }
      }

      if (this.diseases.length === 0) {
        this.extractFromCardSummaries(cards);
      }
    } catch (e) {
      console.error('Error processing cards:', e);
      this.error = 'Error processing prediction results';
    }
  }

  private processBundle(bundle: any) {
    if (!bundle.entry || bundle.entry.length === 0) {
      this.error = 'No observations found in bundle';
      return;
    }

    const diseases: DiseaseRisk[] = [];

    bundle.entry.forEach((entry: any) => {
      const obs = entry.resource;

      if (obs.resourceType === 'Observation') {
        const disease = obs.code?.text || 'Unknown Disease';
        const riskScore = obs.valueQuantity?.value || 0;

        const shapFeatures: ShapFeature[] = [];
        if (obs.component && Array.isArray(obs.component)) {
          obs.component.forEach((comp: any) => {
            shapFeatures.push({
              name: comp.code?.text || 'Unknown',
              value: comp.valueQuantity?.value || 0
            });
          });
        }

        diseases.push({
          disease,
          riskScore,
          shapFeatures,
          expanded: false
        });
      }
    });

    this.diseases = diseases.sort((a, b) => b.riskScore - a.riskScore);

    if (this.diseases.length > 0) {
      const top3 = this.diseases.slice(0, 3);
      this.overallRiskScore = top3.reduce((sum, d) => sum + d.riskScore, 0) / top3.length;
    }
  }

  private extractFromCardSummaries(cards: any[]) {
    cards.forEach(card => {
      const summary = card.summary || '';
      const match = summary.match(/(.+?)\s*-\s*Risk:\s*([\d.]+)%/);

      if (match) {
        const disease = match[1].trim();
        const riskScore = parseFloat(match[2]) / 100;

        this.diseases.push({
          disease,
          riskScore,
          shapFeatures: [],
          expanded: false
        });
      }
    });
  }

  private prepareSummaryPanels() {
    const high: SummaryItem[] = [];
    const moderate: SummaryItem[] = [];
    const low: SummaryItem[] = [];

    this.diseases.forEach((disease, index) => {
      const riskPercent = (disease.riskScore * 100).toFixed(1) + '%';

      const topFeatures = disease.shapFeatures
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 3)
        .map(f => {
          const impact = f.value > 0 ? '↑' : '↓';
          const cleanName = f.name.replace(' 0.0', '').trim();
          return `${cleanName} ${impact}`;
        })
        .join(', ');

      const item: SummaryItem = {
        primary: disease.disease,
        secondary: topFeatures || 'No contributing factors identified',
        date: riskPercent,
        source: this.getRiskLevelText(disease.riskScore),
        linkLabel: disease.shapFeatures.length > 0 ? 'Show SHAP Details' : undefined,
        linkHref: disease.shapFeatures.length > 0 ? `#disease-${index}` : undefined,
        diseaseIndex: index
      };

      if (disease.riskScore >= 0.15) {
        high.push(item);
      } else if (disease.riskScore >= 0.05) {
        moderate.push(item);
      } else {
        low.push(item);
      }
    });

    this.highRiskItems = high;
    this.moderateRiskItems = moderate;
    this.lowRiskItems = low;
  }

  /**
   * Show SHAP details for a specific disease
   * Called when user clicks "Show SHAP Details" link in summary panel
   */
  showShapDetails(diseaseIndex: number, event?: Event) {
    if (event) {
      event.preventDefault();
    }

    const disease = this.diseases[diseaseIndex];
    if (disease) {
      this.selectedDiseaseForShap = disease;
      // Scroll to SHAP modal
      setTimeout(() => {
        document.getElementById('shap-modal')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  /**
   * Close SHAP details
   */
  closeShapDetails() {
    this.selectedDiseaseForShap = null;
  }

  getRiskLevelClass(riskScore: number): string {
    if (riskScore >= 0.30) return 'risk-critical';
    if (riskScore >= 0.15) return 'risk-high';
    if (riskScore >= 0.05) return 'risk-moderate';
    return 'risk-low';
  }

  getRiskLevelText(riskScore: number): string {
    if (riskScore >= 0.30) return 'Very High Risk';
    if (riskScore >= 0.15) return 'High Risk';
    if (riskScore >= 0.05) return 'Moderate Risk';
    return 'Low Risk';
  }

  formatPercent(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  getTopShapFeatures(features: ShapFeature[], n: number = 10): ShapFeature[] {
    return [...features]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, n);
  }

  getShapImpact(value: number): string {
    return value > 0 ? '↑ Increases' : '↓ Decreases';
  }

  getShapImpactClass(value: number): string {
    return value > 0 ? 'shap-positive' : 'shap-negative';
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
