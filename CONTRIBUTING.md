# Contributing to ORBITAL (SIH26174)

Thank you for your interest in contributing to **ORBITAL — Human Activity Intelligence**!

---

## Code Style & Standards

### Python / Backend
- **Framework**: FastAPI with Pydantic V2 models.
- **Type Annotations**: Use PEP 484 type hints across all functions and route handlers.
- **ML Preprocessing**: Any changes to feature extraction must be made within `backend/app/utils/feature_extraction.py` to preserve alignment between training and serving.

### Frontend / TypeScript
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS v4 design tokens. Avoid ad-hoc inline styles when tokens are applicable.
- **State Management**: Zustand store (`useExperimentStore`) is the single source of truth for workflow state.
- **Type Safety**: Maintain strict type definitions in `src/types/index.ts`.

---

## Development Workflow

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/telemetry-filter
   ```
2. Implement your changes with corresponding tests.
3. Validate backend endpoints:
   ```bash
   python tests/test_api.py
   ```
4. Validate frontend TypeScript compilation:
   ```bash
   cd frontend && npm run build
   ```
5. Commit your changes with clear semantic messages.
