# Medical Summary Application

Location: `projects/medical-summary`

---

## Overview

The Medical Summary application is a SMART-on-FHIR Angular application that renders a structured clinical overview of a patient.

It provides:

- STAGE-branded navigation header
- Patient demographic sidebar
- Categorized, paginated clinical summaries
- Interactive patient history timeline
- Configurable history settings modal

This application consumes reusable UI components from the `ui-components` library.

---

## High-Level Architecture

The application follows a clean separation of concerns:

- **UI Components (presentation only)** → `ui-components` library
- **Application logic & data transformation** → medical-summary app
- **History building logic** → dedicated service
- **Type definitions & vocabulary mapping** → separate files

Domain logic remains inside the application; UI components remain reusable.

---

## Root Layout

The root component renders the Angular router outlet:

```html
<router-outlet></router-outlet>
```

The summary view is rendered via routing.

---

## Main Layout (Patient Summary View)

### 1) Header

Uses the shared component:

```html
<ui-header></ui-header>
```

Configured with:

- STAGE logo
- "Summary" and "Risks" tabs
- Router-based navigation

---

### 2) Sidebar – Patient Demographics

```html
<ui-sidebar
  title="Patient Demographics"
  [rows]="sidebarRows">
</ui-sidebar>
```

Displays structured demographic information (label/value pairs).

---

### 3) Clinical Summary Panels

```html
<ui-summary-panel></ui-summary-panel>
```

Categories include:

- Conditions
- Symptoms
- Family History
- Medications
- Laboratory
- Vitals
- Lifestyle
- Questionnaires & Surveys

Each category:

- Uses independent pagination
- Shares a global `itemsPerPage` selector
- Maintains its own page state (e.g., `conditionPage`, `labPage`)

---

## Pagination Strategy

- `itemsPerPage` selector (5 / 10 / 20 / 50)
- Independent page state variables
- `pagination-controls` for navigation
- Conditional display when item count exceeds page size

Designed to handle large clinical datasets efficiently.

---

# Patient History Module

The history module provides a horizontally scrollable, interactive clinical timeline.

Files:

- `patient-history.component`
- `history-settings.component`
- `history-builder.service`
- `history.types.ts`
- `vocab.history.ts`

---

## Patient History Component

Renders:

- Timeline baseline
- Event nodes (conditions, lifestyle/derived, medications)
- Icon-based medallions
- Event title + date
- Horizontally scrollable layout

Visual categories:

- Condition → green styling
- Lifestyle / derived → blue styling
- Medication → gray styling

Features:

- Settings button
- Empty state message
- Conditional timeline rendering

---

## History Settings Modal

Allows user to configure:

### Conditions
- Dynamically generated checkbox list

### Lifestyle
- Smoking
- BMI > 30
- Alcohol intake

### Medications
- Dynamically generated checkbox list
- Empty-state alert when no relevant medications exist

Emits:

- `save`
- `cancel`

---

## History Builder Service

Responsible for:

- Transforming patient data into timeline events
- Filtering events based on user settings
- Mapping domain data to UI-friendly event objects

---

## History Types

Defines:

- Timeline event structure
- Event kinds (`condition`, `lifestyle`, `medication`, `derived`)
- Settings model

Ensures consistent typing across the module.

---

## History Vocabulary Mapping

Contains:

- Label mappings
- Icon mappings
- Key-to-display transformations

Prevents UI from depending directly on raw domain keys.

---

# Data Flow

1. Patient context resolved (SMART/FHIR layer external).
2. Clinical data transformed into:
  - `sidebarRows`
  - Summary panel item arrays
  - History event structures
3. Data passed to UI components via `@Input()`.
4. History builder service generates filtered timeline events.
5. Settings control which events are visible.

---

# Internal Dependencies

- `ui-components`
  - HeaderModule
  - SidebarModule
  - SummaryPanelModule

---

# External Dependencies

- Angular Router
- Angular Forms (`ngModel`)
- Bootstrap
- Bootstrap Icons
- Pagination module (`paginate` pipe + `pagination-controls`)

---

# Run

```bash
ng serve medical-summary
```

---

# Build

```bash
ng build medical-summary
```

---

# Extensibility

Future enhancements may include:

- Date-range filtering for timeline
- Risk visualization overlays
- Search within summary panels
- Lazy loading for very large patient datasets
- Event grouping and clustering

---

# Summary

The Medical Summary application provides a modular, scalable, and configurable clinical overview UI built on SMART-on-FHIR principles.

It cleanly separates:

- UI rendering
- Application data transformation
- Timeline construction logic
- Configuration state management

The result is a maintainable, extensible clinical dashboard suitable for large-scale patient datasets.
