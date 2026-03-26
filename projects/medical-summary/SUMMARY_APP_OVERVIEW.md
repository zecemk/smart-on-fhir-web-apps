# Medical Summary Application

Location: `projects/medical-summary`

---

# 1. Core Responsibility

The **Medical Summary** application is a SMART-on-FHIR Angular application responsible for transforming patient clinical data into a structured, paginated, and interactive UI.

The architectural center of the application is:

```
patient-summary.component.ts
```

This file acts as the orchestration layer and is responsible for:

- Managing UI state
- Transforming clinical domain data into UI-ready models
- Managing pagination per category
- Handling empty states safely
- Integrating the patient history module
- Passing normalized data into reusable UI components

All rendered content originates from this component.

---

# 2. Application Architecture Overview

The app follows a layered structure:

| Layer | Responsibility |
|-------|---------------|
| UI Library (`ui-components`) | Presentation only |
| `patient-summary.component` | Data shaping + UI state |
| History Builder Service | Timeline construction |
| Types & Vocabulary | Type safety + mapping |

This separation ensures that:

- UI components remain reusable
- Business logic stays in the app layer
- Timeline logic is isolated
- Domain mapping is centralized

---

# 3. Root Layout

The root template:

```html
<router-outlet></router-outlet>
```

Routing determines when the summary view is displayed.

---

# 4. The Heart of the App: `patient-summary.component.ts`

This file coordinates the entire page.

---

## 4.1 UI State Management

The component maintains independent pagination state:

- `itemsPerPage`
- `conditionPage`
- `symptomPage`
- `familyPage`
- `medicationPage`
- `labPage`
- `vitalPage`
- `lifestylePage`
- `surveyPage`

Each category is isolated, preventing cross-category pagination conflicts.

---

## 4.2 Data Normalization

Raw domain data is transformed into two normalized UI models.

### Sidebar Model

```ts
{
  label: string;
  value: string;
}
```

Used by:

```html
<ui-sidebar [rows]="sidebarRows">
```

Edge handling:
- Missing values fallback to safe defaults (e.g., empty string or dash)
- Optional chaining is used when accessing patient data

---

### Summary Panel Model

Each panel receives:

```ts
{
  primary: string;
  secondary?: string;
  date?: Date;
  source?: string;
}
```

Important considerations:

- Undefined arrays are guarded with `!` or optional chaining
- Dates are formatted consistently
- Source values determine badge styling
- Empty datasets trigger panel-level empty states
- Pagination controls are conditionally rendered:

```html
*ngIf="(items?.length || 0) > itemsPerPage"
```

This prevents rendering unnecessary controls.

---

## 4.3 Category Separation

Categories rendered independently:

- Conditions
- Symptoms
- Family History
- Medications
- Laboratory
- Vitals
- Lifestyle
- Questionnaires & Surveys


---

## 4.4 Edge Cases Handled in Summary View

The component carefully handles:

- Undefined patient
- Empty resource arrays
- Null dates
- Missing secondary labels
- Pagination state reset
- Conditional rendering using safe navigation
- Avoiding template crashes with `?.` operators
- Empty state messaging

Large datasets are segmented to avoid DOM overload.

---

# 5. Patient History Module

The summary view integrates:

```html
<ms-patient-history [patientId]="patient?.id"></ms-patient-history>
```

Directory structure:

```
history/
 ├── patient-history.component.*
 ├── history-settings.component.*
 ├── history-builder.service.ts
 ├── history.types.ts
 └── vocab.history.ts
```

---

## 5.1 Patient History Component

Renders:

- Horizontal timeline baseline
- Event nodes with icons
- Event title and formatted date
- Scrollable container
- Settings button
- Empty state message

Edge cases handled:

- `!loading && !filtered?.length` shows empty state
- Timeline rendered only when filtered events exist
- Safe property access on events
- Default icon fallback if mapping missing

Event kinds:

| Kind        | Styling |
|-------------|---------|
| condition   | green   |
| lifestyle   | blue    |
| derived     | blue    |
| medication  | gray    |

---

## 5.2 History Settings Modal

Modal sections:

### Conditions
- Dynamically generated checkboxes
- Uses `trackBy` for performance

### Lifestyle
- Smoking
- BMI > 30
- Alcohol intake

### Medications
- Visibility map generated from data
- Empty alert when no relevant medications exist

Important details:

- Uses a working copy to prevent accidental mutation
- Emits `save` and `cancel`
- Parent component updates state
- Modal backdrop manually controlled
- Prevents null visibility maps

---

## 5.3 History Builder Service

Responsibilities:

- Construct timeline events
- Normalize event structure
- Apply user-selected filters
- Sort chronologically
- Deduplicate if necessary

Edge handling:

- Missing dates
- Undefined categories
- Filter combinations resulting in zero results
- Medication visibility map empty state
- Safe handling of optional fields

---

## 5.4 History Types

Defines:

- Event interface
- Event kind union
- Settings model
- Medication visibility structure

Benefits:

- Strong compile-time guarantees
- Reduced runtime errors
- Clear filtering logic

---

## 5.5 Vocabulary Mapping

`vocab.history.ts`:

- Maps domain keys to readable labels
- Maps keys to icon identifiers
- Decouples UI from raw codes

Edge handling:

- Missing mapping fallback
- Unknown keys handled gracefully

---

# 6. Data Flow Summary

1. SMART resolves patient.
2. Patient data retrieved.
3. `patient-summary.component.ts` transforms data into:
  - Sidebar rows
  - Summary panel arrays
  - History event inputs
4. History builder service constructs timeline.
5. Settings filter determines visible events.
6. UI components render presentation-only views.

---


# 7. Internal Dependencies

- `ui-components`
  - HeaderModule
  - SidebarModule
  - SummaryPanelModule

---

# 8. External Dependencies

- Angular Router
- Angular Forms (`ngModel`)
- Bootstrap
- Bootstrap Icons
- Pagination module (`paginate`, `pagination-controls`)

---

# 9. Run

```bash
ng serve medical-summary
```

