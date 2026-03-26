import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistorySettings, defaultHistorySettings } from './history.types';
import { HISTORY_VOCAB } from './vocab.history';

function cloneSettings(s: HistorySettings): HistorySettings {
  return JSON.parse(JSON.stringify(s));
}

type ConditionKey = keyof HistorySettings['conditions'];

@Component({
  selector: 'ms-history-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-settings.component.html',
  styleUrls: ['./history-settings.component.scss']
})
export class HistorySettingsComponent implements OnChanges {
  @Input() value: HistorySettings = defaultHistorySettings();
  @Output() save = new EventEmitter<HistorySettings>();
  @Output() cancel = new EventEmitter<void>();

  working: HistorySettings = cloneSettings(this.value);

  ngOnChanges(): void {
    this.working = cloneSettings(this.value);
  }

  condKeys: readonly ConditionKey[] = [
    'diabetes', 'cvd', 'cld', 'crd', 'ckd', 'oa', 'dementia', 'depression'
  ] as const;

  trackByKey = (_: number, k: ConditionKey) => k;

  getLabel(key: string): string {
    // Look up the full title from your central vocabulary
    // e.g. 'cvd' -> 'Cardiovascular Disease'
    const def = (HISTORY_VOCAB.conditions as any)[key];
    return def ? def.title : key;
  }

  onSave(): void {
    this.save.emit(cloneSettings(this.working));
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
