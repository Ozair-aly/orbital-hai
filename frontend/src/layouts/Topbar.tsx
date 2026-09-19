import { useEffect } from 'react';
import { Menu, Sparkles, CheckCircle2, AlertCircle, Mic } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { checkHealth } from '../services/api';
import { WORKFLOW_STEPS } from '../types';

interface Props {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: Props) {
  const { currentStep, health, setHealth, voiceOpen, setVoiceOpen } = useExperimentStore();

  useEffect(() => {
    let mounted = true;
    const pollHealth = async () => {
      try {
        const res = await checkHealth();
        if (mounted) setHealth(res);
      } catch {
        if (mounted) setHealth({ status: 'error', model_loaded: false });
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setHealth]);

  const currentStepObj = WORKFLOW_STEPS.find((s) => s.id === currentStep) || WORKFLOW_STEPS[0];

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 border-b bg-white shrink-0 z-10"
      style={{ borderColor: '#E5EAF2' }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg border border-[#E5EAF2] hover:bg-[#F7F9FC] text-[#718096] transition-colors"
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF4FD] border border-[#3978E8]/20">
            <span className="w-2 h-2 rounded-full bg-[#3978E8] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#3978E8]">STEP {currentStep} of 5</span>
          </div>
          <span className="text-sm font-semibold text-[#172B4D] hidden sm:inline">
            {currentStepObj.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Synthetic Data Disclaimer Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFF8E6] border border-[#FFE7A3] text-xs font-medium text-[#946200]">
          <Sparkles size={13} className="text-[#F59E0B]" />
          <span>Synthetic Demonstration Mode</span>
        </div>

        {/* Backend API Status */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
          style={{
            backgroundColor: health.status === 'ok' ? '#ECFDF5' : '#FEF2F2',
            borderColor: health.status === 'ok' ? '#A7F3D0' : '#FECACA',
            color: health.status === 'ok' ? '#065F46' : '#991B1B',
          }}
          title={
            health.status === 'ok'
              ? `Backend Connected (Model: ${health.model_loaded ? 'Ready' : 'Not Loaded'})`
              : 'Backend Disconnected'
          }
        >
          {health.status === 'ok' ? (
            <CheckCircle2 size={13} className="text-[#22C55E]" />
          ) : (
            <AlertCircle size={13} className="text-[#EF4444]" />
          )}
          <span className="hidden sm:inline">API</span>
          <span>{health.status === 'ok' ? (health.model_loaded ? 'Ready' : 'Online') : 'Offline'}</span>
        </div>

        {/* Voice Assistant Toggle */}
        <button
          onClick={() => setVoiceOpen(!voiceOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            voiceOpen
              ? 'bg-[#3978E8] text-white border-[#3978E8]'
              : 'bg-white hover:bg-[#F7F9FC] text-[#172B4D] border-[#E5EAF2]'
          }`}
          title="Open ORBITAL Voice"
        >
          <Mic size={14} className={voiceOpen ? 'text-white' : 'text-[#3978E8]'} />
          <span className="hidden sm:inline">ORBITAL Voice</span>
        </button>
      </div>
    </header>
  );
}
