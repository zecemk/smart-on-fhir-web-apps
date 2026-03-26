/**
 * Minimal vocabulary map for the Patient History feature.
 * It standardizes titles and icon keys, and (optionally) carries code lists
 * that we’ll use later to filter/recognize FHIR resources.
 */

export type CodeRef = { system: string; code: string };

export interface ConceptDef {
  title: string;
  iconKey: string;     // used by the UI to pick an SVG
  codes?: CodeRef[];   // optional list of SNOMED/LOINC/RxNorm, etc.
}

/**
 * The specific list of top 10 medications we want to scan for.
 * These are based on common global prescription data for chronic conditions.
 */
export const TOP_MEDICATIONS_LIST = [
  'atorvastatin',  // Cholesterol
  'levothyroxine', // Thyroid
  'lisinopril',    // BP
  'metformin',     // Diabetes
  'amlodipine',    // BP
  'metoprolol',    // BP / Heart
  'albuterol',     // Asthma
  'omeprazole',    // GERD
  'losartan',      // BP
  'simvastatin'    // Cholesterol
];

export const ICON_MAP: Record<string, string> = {
  // Conditions
  diabetes:   'bi-droplet-half',      // or bi-activity
  heart:      'bi-heart-pulse-fill',
  liver:      'bi-capsule',           // No perfect liver icon, using generic medical or bi-bandaid
  lungs:      'bi-lungs',
  kidney:     'bi-water',             // Abstract rep for fluids/kidney
  bone:       'bi-person-arms-up',    // or bi-person-standing for OA
  brain:      'bi-exclude',           // Abstract brain shape or use bi-memory
  mood:       'bi-emoji-frown',       // for depression

  // Lifestyle
  smoking:    'bi-lungs-fill',        // or bi-fire if you prefer
  bmi:        'bi-speedometer2',      // Standard gauge icon for BMI
  alcohol:    'bi-cup-straw',

  // Generic
  medication: 'bi-prescription2',
  condition:  'bi-clipboard-pulse',
  other:      'bi-circle'
};

export interface HistoryVocab {
  conditions: Record<
    | 'diabetes'
    | 'cvd'
    | 'cld'
    | 'crd'
    | 'ckd'
    | 'oa'
    | 'dementia'
    | 'depression',
    ConceptDef
  >;
  lifestyle: Record<
    | 'smoking'
    | 'bmi'
    | 'alcohol',
    ConceptDef
  >;
  med: ConceptDef; // generic medication icon/title fallback
}

/** Common code systems you may reference later. */
export const CODESYSTEM = {
  SNOMED: 'http://snomed.info/sct',
  LOINC: 'http://loinc.org',
  RXNORM: 'http://www.nlm.nih.gov/research/umls/rxnorm'
} as const;

export const HISTORY_VOCAB: HistoryVocab = {
  conditions: {
    diabetes:   { title: 'Type 2 Diabetes',             iconKey: 'diabetes',
      // SNOMED examples can be added later if you want filtering by code.
      // codes: [{ system: CODESYSTEM.SNOMED, code: '44054006' }]
    },
    cvd:        { title: 'Cardiovascular Disease',      iconKey: 'heart'     },
    cld:        { title: 'Chronic Liver Disease',       iconKey: 'liver'     },
    crd:        { title: 'Chronic Respiratory Disease', iconKey: 'lungs'     },
    ckd:        { title: 'Chronic Kidney Disease',      iconKey: 'kidney'    },
    oa:         { title: 'Osteoarthritis',              iconKey: 'bone'      },
    dementia:   { title: 'Dementia',                    iconKey: 'brain'     },
    depression: { title: 'Depression',                  iconKey: 'mood'      }
  },

  lifestyle: {
    smoking: { title: 'Smoking',  iconKey: 'smoking',
      // LOINC Tobacco Use (panel) often: 72166-2 or others, depending on dataset.
      codes: [{ system: CODESYSTEM.LOINC, code: '72166-2' }]
    },
    bmi: { title: 'BMI > 30', iconKey: 'bmi',
      // LOINC Body mass index (BMI): 39156-5
      codes: [{ system: CODESYSTEM.LOINC, code: '39156-5' }]
    },
    alcohol: { title: 'Alcohol Intake', iconKey: 'alcohol' }
  },

  // Generic fallback for medication entries (we’ll use RxNorm strings from FHIR for labels)
  med: { title: 'Medication', iconKey: 'pill' }
};
