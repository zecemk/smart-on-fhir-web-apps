export type HistoryKind = 'condition' | 'lifestyle' | 'medication' | 'derived';

export type ConditionKey =
  | 'diabetes'
  | 'cvd'
  | 'cld'
  | 'crd'
  | 'ckd'
  | 'oa'
  | 'dementia'
  | 'depression';

/**
 * One unified event shown on the Patient History timeline.
 * Every illness, lifestyle change, or medication is normalized into this shape.
 */
export interface HistoryEvent {
  id: string;          // stable key (FHIR resource id or a derived hash)
  kind: HistoryKind;   // drives grouping and styling in the UI
  subtype: string;     // 'diabetes' | 'smoking' | 'bmi' | 'med' | ...
  title: string;       // text shown under the icon
  date: string;        // ISO date (yyyy-mm-dd)
  iconKey: string;     // maps to an icon/SVG
  meta?: any;          // optional raw data (FHIR refs, values, etc.)
}



/**
 * Controls what the user chooses to see in the history timeline.
 * This directly maps to the History Settings UI.
 */
export interface HistorySettings {
  conditions: { [K in ConditionKey]: boolean };
  lifestyle: {
    smoking: boolean;
    bmi: boolean;
    alcohol: boolean;
  };
  meds: {
    // We will dynamically populate this with "Drug Name": boolean
    // e.g. { 'Metformin': true, 'Lisinopril': false }
    visibility: { [drugName: string]: boolean };
  };
}

/**
 * Default configuration used on first load (per patient).
 */
export function defaultHistorySettings(): HistorySettings {
  return {
    conditions: {
      diabetes: true,
      cvd: true,
      cld: true,
      crd: true,
      ckd: false,
      oa: false,
      dementia: false,
      depression: false
    },
    lifestyle: {
      smoking: true,
      bmi: true,
      alcohol: false
    },
    meds: {
      visibility: {} // Empty by default, populated at runtime based on what we find
    }
  };
}
