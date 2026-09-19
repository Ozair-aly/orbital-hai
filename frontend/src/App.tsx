import { AppLayout } from './layouts/AppLayout';
import { WorkflowStepper } from './components/WorkflowStepper';
import ExperimentSetup from './pages/ExperimentSetup';
import { DataCollection } from './pages/DataCollection';
import { ActivityRecognition } from './pages/ActivityRecognition';
import { ResultsAnalysis } from './pages/ResultsAnalysis';
import { ReportExport } from './pages/ReportExport';
import { useExperimentStore } from './store/experimentStore';

export function App() {
  const { currentStep } = useExperimentStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ExperimentSetup />;
      case 2:
        return <DataCollection />;
      case 3:
        return <ActivityRecognition />;
      case 4:
        return <ResultsAnalysis />;
      case 5:
        return <ReportExport />;
      default:
        return <ExperimentSetup />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pb-12">
        <WorkflowStepper />
        {renderStep()}
      </div>
    </AppLayout>
  );
}

export default App;
