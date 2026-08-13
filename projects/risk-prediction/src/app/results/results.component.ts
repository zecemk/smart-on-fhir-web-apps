import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {Chart, ChartData, ChartOptions, LegendItem} from "chart.js";
import {CdsHooksService} from "cds-hooks";
import {SmartOnFhirService} from "ng-smart-on-fhir";
import {MenuService} from "../menu.service";
import {LocalPlotResponse} from "./llm-models";
import annotationPlugin from 'chartjs-plugin-annotation';

const waterfallDirectionPlugin = {
  id: 'waterfallDirectionPlugin',

  afterDatasetsDraw(chart: any) {
    const dataset = chart.data.datasets[0] as any;
    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;

    if (!meta?.data) {
      return;
    }

    ctx.save();

    meta.data.forEach((bar: any, index: number) => {
      const raw = dataset.data[index];

      if (!Array.isArray(raw) || raw.length !== 2) {
        return;
      }

      const [start, end] = raw;

      if (start === end) {
        return;
      }

      const direction = end > start ? '→' : '←';

      const props = bar.getProps(
        ['x', 'base', 'y'],
        true
      );

      const left = Math.min(props.x, props.base);
      const right = Math.max(props.x, props.base);
      const width = right - left;

      /*
       * Ok mümkünse barın içinde ortada.
       * Bar çok küçükse yine de oku göster:
       * barın hemen yanına koy.
       */
      let arrowX: number;

      if (width >= 24) {
        arrowX = left + width / 2;
      } else {
        arrowX = end > start
          ? right + 8
          : left - 8;
      }

      ctx.font = '700 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      /*
       * Büyük barlarda beyaz ok.
       * Küçük barlarda dışarı çıktığı için koyu gri.
       */
      ctx.fillStyle =
        width >= 24
          ? 'rgba(255, 255, 255, 0.95)'
          : '#495057';

      ctx.fillText(
        direction,
        arrowX,
        props.y
      );
    });

    ctx.restore();
  }
};
Chart.register(
  annotationPlugin,
  waterfallDirectionPlugin 
);

interface ShapFeature {
  name: string;
  value: number;
}

interface DiseaseRisk {
  diseaseId: string;
  disease: string;
  riskScore: number;
  shapFeatures: ShapFeature[];
  baselineValue: number;
  finalPrediction: number;
  otherFeaturesContribution: number;
  numOtherFeatures: number;
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
export class ResultsComponent implements OnInit, OnDestroy {

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
  allItems: SummaryItem[] = [];
  chartData: ChartData|undefined;
  chartOptions: ChartOptions | undefined = {
    aspectRatio: 1.5,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(144, 144, 255, 0.5)',
      },
      legend: {
        position: 'bottom'
      }
    }
  };
  waterfallChartData: {[diseaseId: string]: ChartData} = {}
  waterfallChartOptions: ChartOptions = {
    aspectRatio: 1.4,
    indexAxis: 'y',
  
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const dataset = context.dataset as any;
          
            const contribution =
              dataset.contributions?.[context.dataIndex];
          
            const type =
              dataset.pointTypes?.[context.dataIndex];
          
              const absoluteImpact = Math.abs(contribution * 100).toFixed(2);

              if (type === 'other') {
                const directionText =
                  contribution >= 0
                    ? 'Increases prediction'
                    : 'Decreases prediction';
              
                return [
                  `${directionText} by ${absoluteImpact} percentage points`,
                  `${dataset.numOtherFeatures} other features combined`
                ];
              }
              
              const directionText =
                contribution >= 0
                  ? 'Increases prediction'
                  : 'Decreases prediction';
              
              return `${directionText} by ${absoluteImpact} percentage points`;
          }
        }
      },
  
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          generateLabels(chart: Chart): LegendItem[] {
            return [
              {
                text: 'Increases prediction',
                fillStyle: '#0d6efd',
                strokeStyle: '#0d6efd'
              },
              {
                text: 'Decreases prediction',
                fillStyle: '#fd7e14',
                strokeStyle: '#fd7e14'
              },
              {
                text: 'Other features',
                fillStyle: '#adb5bd',
                strokeStyle: '#adb5bd'
              }
            ];
          }
        }
      },
      annotation: {
        annotations: {
          baselineLine: {
            type: 'line',
      
            xMin: (ctx: any) =>
              (ctx.chart.data.datasets[0] as any).baselineValue,
      
            xMax: (ctx: any) =>
              (ctx.chart.data.datasets[0] as any).baselineValue,
      
            borderColor: '#6c757d',
            borderWidth: 2,
            borderDash: [6, 6],
      
            label: {
              display: true,
              content: (ctx: any) => {
                const value =
                  (ctx.chart.data.datasets[0] as any).baselineValue;
      
                return `Baseline ${(value * 100).toFixed(2)}%`;
              },
              position: 'start',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#495057'
            }
          },
      
          finalPredictionLine: {
            type: 'line',
      
            xMin: (ctx: any) =>
              (ctx.chart.data.datasets[0] as any).finalPrediction,
      
            xMax: (ctx: any) =>
              (ctx.chart.data.datasets[0] as any).finalPrediction,
      
            borderColor: '#212529',
            borderWidth: 2,
      
            label: {
              display: true,
              content: (ctx: any) => {
                const value =
                  (ctx.chart.data.datasets[0] as any).finalPrediction;
      
                return `Patient prediction ${(value * 100).toFixed(2)}%`;
              },
              position: 'end',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#212529'
            }
          }
        }
      },
    },
  
    backgroundColor: (ctx: any) => {
      const dataset = ctx.dataset as any;
      const type = dataset.pointTypes?.[ctx.dataIndex];
      const contribution =
        dataset.contributions?.[ctx.dataIndex];
  
      if (type === 'other') {
        return '#adb5bd';
      }
  
      return contribution >= 0
        ? '#0d6efd'
        : '#fd7e14';
    },
  
    borderColor: (ctx: any) => {
      const dataset = ctx.dataset as any;
      const type = dataset.pointTypes?.[ctx.dataIndex];
      const contribution =
        dataset.contributions?.[ctx.dataIndex];
  
      if (type === 'other') {
        return '#adb5bd';
      }
  
      return contribution >= 0
        ? '#0d6efd'
        : '#fd7e14';
    },
  
    scales: {
      x: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) =>
            `${(Number(value) * 100).toFixed(1)}%`
        },
        title: {
          display: true,
          text: 'Predicted risk'
        }
      },
  
      y: {
        ticks: {
          autoSkip: false
        }
      }
    }
  };
  llmSessionId: string|undefined;
  chat: {[diseaseId: string]: boolean} = {};
  riskObservations: { [diseaseId: string]: fhir4.Observation } = {};
  localPlotResponse!: LocalPlotResponse;
  resolvedStratum: string = '';

  constructor(private router: Router, private sof: SmartOnFhirService,
              private cds: CdsHooksService<fhir4.Resource>, private menuService: MenuService) {}

  ngOnInit() {
    this.loadResults();
    this.loading = false;
  }

  ngOnDestroy() {
    this.menuService.menuItems = []
  }

  private loadResults() {
    try {
      const saved = localStorage.getItem('questionnaire_results');
      this.llmSessionId = sessionStorage.getItem('llm_session_id') || undefined;
      if (saved) {
        const cards = JSON.parse(saved);
        this.processLocalPlotCards(cards);
        this.prepareSummaryPanels();
      } else {
        this.error = 'No prediction data available. Please complete the questionnaire first.';
      }
    } catch (e) {
      console.error('Error loading results:', e);
      this.error = 'Error loading prediction results';
    }
  }

  private processLocalPlotCards(cards: any[]) {
    try {
      const diseases: DiseaseRisk[] = [];

      this.localPlotResponse = <LocalPlotResponse>JSON.parse(
        cards[0].detail.replaceAll("&quot;", '"')
      )
      this.resolvedStratum =
        this.localPlotResponse.resolved_stratum
        || this.localPlotResponse.model_name;
      this.localPlotResponse.results.forEach(result => {
        const disease = result.disease;
        const riskScore = result.prediction.risk_score || 0;
        
        const waterfallData =
          result.plots['waterfall'].waterfall_data;
        
        const baselineValue =
          waterfallData.baseline_value;
        
        const finalPrediction =
          waterfallData.final_prediction;
        
        const otherFeaturesContribution =
          waterfallData.other_features_contribution || 0;
        
        const numOtherFeatures =
          waterfallData.num_other_features || 0;

        console.log(
          `[WATERFALL PAYLOAD] ${disease}`,
          result.plots['waterfall'].waterfall_data
        );

        const shapFeatures: ShapFeature[] = [
          ...result.plots['waterfall'].waterfall_data.top_positive_contributors,
          ...result.plots['waterfall'].waterfall_data.top_negative_contributors,
        ].map(contributor => ({
          name: contributor.display_name,
          value: contributor.shap_value
        }));

        diseases.push({
          diseaseId: disease.replaceAll(" ", "_"),
          disease,
          riskScore,
          shapFeatures,
          baselineValue,
          finalPrediction,
          otherFeaturesContribution,
          numOtherFeatures,
          expanded: false
        });

        this.diseases = diseases.sort((a, b) => b.riskScore - a.riskScore);
        this.diseases.forEach(disease => {
          this.waterfallChartData[disease.disease] = this.getWaterfallChartData(disease)
        })
        setTimeout(() => {
          this.menuService.menuItems.splice(0, this.menuService.menuItems.length, ...[{
            label: 'Diseases',
            header: true
          }, ...this.diseases.map(disease => ({
            label: disease.disease,
            callback: () => {
              const accordionBtn = document.getElementById('accordion-btn-' + disease.diseaseId)
              accordionBtn?.scrollIntoView({ behavior: 'smooth' });
              if (accordionBtn?.classList.contains('collapsed')) {
                accordionBtn?.click()
              }
            }
          }))])
        })

        if (this.diseases.length > 0) {
          const top3 = this.diseases.slice(0, 3);
          this.overallRiskScore = top3.reduce((sum, d) => sum + d.riskScore, 0) / top3.length;
        }
      })
    } catch (err) {
      console.error(err)
      this.error = 'Error processing prediction results';
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
                  // if (!this.llmSessionId) {
                  //   this.getShapExplanation(action.resource);
                  // }
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
        this.riskObservations[disease] = obs;
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
          diseaseId: disease.replaceAll(" ", "_"),
          disease,
          riskScore,
          shapFeatures,
          baselineValue: 0,
          finalPrediction: riskScore,
          otherFeaturesContribution: 0,
          numOtherFeatures: 0,
          expanded: false
        });
      }
    });

    this.diseases = diseases.sort((a, b) => b.riskScore - a.riskScore);
    this.diseases.forEach(disease => {
      this.waterfallChartData[disease.disease] = this.getWaterfallChartData(disease)
    })
    setTimeout(() => {
      this.menuService.menuItems.splice(0, this.menuService.menuItems.length, ...[{
        label: 'Diseases',
        header: true
      }, ...this.diseases.map(disease => ({
        label: disease.disease,
        callback: () => {
          const accordionBtn = document.getElementById('accordion-btn-' + disease.diseaseId)
          accordionBtn?.scrollIntoView({ behavior: 'smooth' });
          if (accordionBtn?.classList.contains('collapsed')) {
            accordionBtn?.click()
          }
        }
      }))])
    })

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
          diseaseId: disease.replaceAll(" ", "_"),
          disease,
          riskScore,
          shapFeatures: [],
          baselineValue: 0,
          finalPrediction: riskScore,
          otherFeaturesContribution: 0,
          numOtherFeatures: 0,
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
    this.allItems = [...this.highRiskItems, ...this.moderateRiskItems, ...this.lowRiskItems];
    this.chartData = {
      labels: this.diseases.map(disease => disease.disease),
      datasets: [{
        label: 'Disease Risk (%)',
        data: this.diseases.map(disease => disease.riskScore * 100)
      }]
    }
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

  getRiskLevelColor(riskScore: number): string {
    if (riskScore >= 0.15) return 'var(--bs-danger)';
    if (riskScore >= 0.05) return 'var(--bs-warning)';
    return 'var(--bs-info)';
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
    this.router.navigate(['/form']);
  }

  getWaterfallChartData(disease: DiseaseRisk): ChartData {
    const features = [...disease.shapFeatures]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
    const labels: string[] = [];
    const data: [number, number][] = [];
    const contributions: number[] = [];
    const pointTypes: string[] = [];
  
    let currentValue = disease.baselineValue;
  
    features.forEach(feature => {
      const start = currentValue;
      const end = start + feature.value;
  
      labels.push(feature.name);
      data.push([start, end]);
      contributions.push(feature.value);
      pointTypes.push('feature');
  
      currentValue = end;
    });
  
    if (disease.numOtherFeatures > 0) {
      const start = currentValue;
      const end = start + disease.otherFeaturesContribution;
  
      labels.push('Other features');
      data.push([start, end]);
      contributions.push(disease.otherFeaturesContribution);
      pointTypes.push('other');
  
      currentValue = end;
    }
  
    return {
      labels,
      datasets: [{
        label: 'Prediction',
        data,
        contributions,
        pointTypes,
        baselineValue: disease.baselineValue,
        finalPrediction: disease.finalPrediction,
        numOtherFeatures: disease.numOtherFeatures
      } as any]
    };
  }

  private async getShapExplanation(resource: fhir4.Bundle<fhir4.Observation>) {
    const patient = await this.sof.getPatient()
    this.cds.callService({
      language: 'en',
      serviceId: 'shap_explain',
      context: {
        patientId: patient?.id,
      },
      prefetch: {
        patient,
        risk_predictions: resource
      }
    }).then(response => {
      this.llmSessionId = response.cards?.at(0)?.summary
      sessionStorage.setItem('llm_session_id', <string>this.llmSessionId)
    }, console.error)
  }

}
