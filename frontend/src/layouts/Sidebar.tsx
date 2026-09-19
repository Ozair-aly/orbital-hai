// Sidebar.tsx — Responsive navigation panel supporting desktop layout & mobile slide-over drawer.

import { Satellite, FlaskConical, ChevronRight, X } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { WORKFLOW_STEPS } from '../types';

interface Props {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ desktopOpen, mobileOpen, onMobileClose }: Props) {
  const { currentStep, setStep, experiment } = useExperimentStore();

  const handleStepClick = (stepId: number, isAccessible: boolean) => {
    if (isAccessible) {
      setStep(stepId);
      onMobileClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo and Header */}
      <div className="flex items-center justify-between px-5 py-4.5 border-b border-[#E5EAF2]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#3978E8] shadow-xs">
            <Satellite size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-[#172B4D]">
              ORBITAL
            </p>
            <p className="text-[11px] text-[#718096]">
              HAI · SIH26174
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-[#718096] hover:bg-[#F7F9FC] transition-colors"
          title="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workflow Steps List */}
      <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        <p className="text-[11px] font-bold uppercase tracking-wider px-2.5 mb-2.5 text-[#718096]">
          Mission Sequence
        </p>

        {WORKFLOW_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isAccessible = step.id <= currentStep + 1 || isCompleted;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id, isAccessible)}
              disabled={!isAccessible}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-[#EFF4FD] text-[#3978E8] font-semibold'
                  : isCompleted
                  ? 'text-[#172B4D] hover:bg-[#F7F9FC]'
                  : 'text-[#94A3B8] opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#3978E8] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-[#E5EAF2] text-[#718096]'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{step.label}</p>
                <p className="text-[10px] text-[#718096] truncate">Step 0{step.id}</p>
              </div>

              {isActive && <ChevronRight size={14} className="text-[#3978E8] shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Active Experiment Metadata Badge */}
      {experiment && (
        <div className="p-3.5 border-t border-[#E5EAF2] bg-[#FAFBFD]">
          <div className="rounded-xl p-3 border border-[#E5EAF2] bg-white shadow-xs">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[#3978E8]">
              <FlaskConical size={13} />
              <span>Active Session</span>
            </div>
            <p className="text-xs font-semibold truncate text-[#172B4D]">
              {experiment.name}
            </p>
            <div className="flex items-center justify-between text-[10px] text-[#718096] mt-1">
              <span className="font-mono truncate">{experiment.id.slice(0, 12)}...</span>
              <span className="capitalize px-1.5 py-0.5 rounded bg-blue-50 text-[#3978E8] font-medium">
                {experiment.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (Visible on large screens when desktopOpen is true) */}
      {desktopOpen && (
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#E5EAF2] bg-white shadow-xs z-10">
          {navContent}
        </aside>
      )}

      {/* Mobile Slide-Over Drawer (Backdrop + Slide-in Panel) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
