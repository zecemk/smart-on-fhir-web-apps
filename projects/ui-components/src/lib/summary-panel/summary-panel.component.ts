import { Component, Input, Output, ChangeDetectionStrategy, EventEmitter } from '@angular/core';

export interface SummaryItem {
  primary: string;        // e.g., "Type 2 Diabetes"
  secondary?: string;     // e.g., "Clinically diagnosed"
  date?: string;          // e.g., "01/01/1980"
  source?: string;        // e.g., "EHR" | "Patient" | "Lab"
  linkLabel?: string;     // optional link text (e.g., "See response")
  linkHref?: string;      // optional link URL
  diseaseIndex?: number;
}

@Component({
  selector: 'ui-summary-panel',
  templateUrl: './summary-panel.component.html',
  styleUrls: ['./summary-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryPanelComponent {
  @Input() title = '';
  @Input() items: SummaryItem[] = [];

  @Output() linkClicked = new EventEmitter<number>();

  sourceClassFor(src?: string): string | null {
    if (!src) return null;
    if (src === 'EHR') return 'ms-chip--ehr';
    if (src === 'Patient') return 'ms-chip--patient';
    return null;
  }
  onLinkClick(item: SummaryItem, event: Event) {

    event.preventDefault();

    if (item.diseaseIndex !== undefined) {

      this.linkClicked.emit(item.diseaseIndex);

    }

  }

}
