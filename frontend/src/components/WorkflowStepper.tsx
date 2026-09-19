import { Check, ChevronRight } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { WORKFLOW_STEPS } from '../types';

export function WorkflowStepper() {
  const { currentStep, setStep, experiment } = useExperimentStore();

  return (
    <div className="w-full bg-white border border-[#E5EAF2] rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between overflow-x-auto py-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isAccessible = step.id === 1 || !!experiment;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-[120px] last:flex-none">
              <button
                onClick={() => isAccessible && setStep(step.id)}
                disabled={!isAccessible}
                className="flex items-center gap-3 text-left group transition-all"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-[#3978E8] text-white ring-4 ring-[#3978E8]/15'
                      : isCompleted
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#F1F5F9] text-[#718096] group-hover:bg-[#E2E8F0]'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isActive ? 'text-[#3978E8]' : isCompleted ? 'text-[#172B4D]' : 'text-[#718096]'
                    }`}
                  >
                    Step 0{step.id}
                  </p>
                  <p
                    className={`text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-[#172B4D] font-bold' : 'text-[#718096]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </button>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-1 mx-3 hidden sm:flex items-center">
                  <div
                    className={`h-0.5 w-full rounded-full transition-colors ${
                      isCompleted ? 'bg-[#22C55E]' : 'bg-[#E5EAF2]'
                    }`}
                  />
                  <ChevronRight size={14} className="text-[#CBD5E1] -ml-1 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
