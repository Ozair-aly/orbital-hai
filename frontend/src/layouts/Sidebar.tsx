// Sidebar.tsx — Left navigation panel showing the workflow steps.

import { Satellite, FlaskConical, ChevronRight } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { WORKFLOW_STEPS } from '../types';

interface Props { open: boolean }

export function Sidebar({ open }: Props) {
  const { currentStep, setStep, experiment } = useExperimentStore();

  if (!open) return null;

  return (
    <aside
      className="flex flex-col w-64 shrink-0 border-r"
      style={{
        background: '#FFFFFF',
        borderColor: '#E5EAF2',
        boxShadow: '1px 0 4px 0 rgb(0 0 0 / 0.04)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: '#E5EAF2' }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: '#3978E8' }}
        >
          <Satellite size={18} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight" style={{ color: '#172B4D' }}>
            ORBITAL
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>
            HAI · SIH26174
          </p>
        </div>
      </div>

      {/* Workflow steps */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-3" style={{ color: '#718096' }}>
          Workflow
        </p>

        {WORKFLOW_STEPS.map((step) => {
          const isActive    = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isAccessible = step.id <= currentStep + 1 || isCompleted;

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && setStep(step.id)}
              disabled={!isAccessible}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background:  isActive ? '#EFF4FD' : 'transparent',
                color:       isActive ? '#3978E8' : isCompleted ? '#172B4D' : '#718096',
                cursor:      isAccessible ? 'pointer' : 'not-allowed',
                opacity:     isAccessible ? 1 : 0.5,
              }}
            >
              {/* Step indicator */}
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
                style={{
                  background: isActive ? '#3978E8' : isCompleted ? '#22C55E' : '#E5EAF2',
                  color:      isActive || isCompleted ? '#fff' : '#718096',
                }}
              >
                {isCompleted ? '✓' : step.id}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{step.label}</p>
              </div>

              {isActive && <ChevronRight size={14} style={{ color: '#3978E8' }} />}
            </button>
          );
        })}
      </nav>

      {/* Experiment badge */}
      {experiment && (
        <div className="px-4 pb-5">
          <div
            className="rounded-xl p-3 border"
            style={{ background: '#F7F9FC', borderColor: '#E5EAF2' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={12} style={{ color: '#3978E8' }} />
              <span className="text-xs font-semibold" style={{ color: '#3978E8' }}>
                Active Experiment
              </span>
            </div>
            <p className="text-xs font-medium truncate" style={{ color: '#172B4D' }}>
              {experiment.name}
            </p>
            <p className="text-xs capitalize mt-0.5" style={{ color: '#718096' }}>
              {experiment.status}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
