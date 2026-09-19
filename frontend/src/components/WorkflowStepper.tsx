import { Check, ChevronRight } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { WORKFLOW_STEPS } from '../types';

export function WorkflowStepper() {
  const { currentStep, setStep, experiment } = useExperimentStore();

  const progressPercent = ((currentStep - 1) / (WORKFLOW_STEPS.length - 1)) * 100;

  return (
    <div className="w-full bg-white border border-[#E5EAF2] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      {/* Mobile Top Progress Bar Indicator */}
      <div className="block sm:hidden mb-2.5">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-bold text-[#3978E8]">Step {currentStep} of 5</span>
          <span className="font-medium text-[#718096]">
            {WORKFLOW_STEPS[currentStep - 1]?.label}
          </span>
        </div>
        <div className="w-full bg-[#E5EAF2] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#3978E8] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepper Steps Row (Touch Scrollable on small devices) */}
      <div className="flex items-center justify-between overflow-x-auto py-1 no-scrollbar gap-2 sm:gap-0">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isAccessible = step.id === 1 || !!experiment;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-[70px] sm:min-w-[120px] last:flex-none">
              <button
                onClick={() => isAccessible && setStep(step.id)}
                disabled={!isAccessible}
                className="flex items-center gap-2 sm:gap-3 text-left group transition-all"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#3978E8] text-white ring-4 ring-[#3978E8]/15 shadow-xs'
                      : isCompleted
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#F1F5F9] text-[#718096] group-hover:bg-[#E2E8F0]'
                  }`}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : step.id}
                </div>
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#3978E8]' : isCompleted ? 'text-[#172B4D]' : 'text-[#718096]'
                    }`}
                  >
                    0{step.id}
                  </p>
                  <p
                    className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                      isActive ? 'text-[#172B4D]' : 'text-[#718096]'
                    }`}
                  >
                    <span className="inline sm:hidden">{step.short}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </p>
                </div>
              </button>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-3 hidden sm:flex items-center">
                  <div
                    className={`h-0.5 w-full rounded-full transition-colors ${
                      isCompleted ? 'bg-[#22C55E]' : 'bg-[#E5EAF2]'
                    }`}
                  />
                  <ChevronRight size={13} className="text-[#CBD5E1] -ml-1 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
