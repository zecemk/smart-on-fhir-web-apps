import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface SidebarRow {
  label: string;
  value: string;
}

@Component({
  selector: 'ui-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  @Input() title = '';
  @Input() rows: SidebarRow[] = [];
}
