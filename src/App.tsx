import { useMemo } from 'react';
import { App as AntApp, Button, Popconfirm, Space, Steps } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useOrderStore, effectiveRate } from './store/useOrderStore';
import { buildUnits } from './lib/split';
import PasteStep from './components/steps/PasteStep';
import AssignStep from './components/steps/AssignStep';
import CustomsStep from './components/steps/CustomsStep';
import ResultsStep from './components/steps/ResultsStep';

const STEPS = [
  { title: 'Order' },
  { title: 'Assign' },
  { title: 'Customs' },
  { title: 'Results' },
];

export default function App() {
  const { modal, message } = AntApp.useApp();
  const currentStep = useOrderStore((s) => s.currentStep);
  const setStep = useOrderStore((s) => s.setStep);
  const items = useOrderStore((s) => s.items);
  const people = useOrderStore((s) => s.people);
  const assignments = useOrderStore((s) => s.assignments);
  const rateManual = useOrderStore((s) => s.rateManual);
  const rateFetched = useOrderStore((s) => s.rateFetched);
  const resetAll = useOrderStore((s) => s.resetAll);

  const unassignedCount = useMemo(
    () => buildUnits(items).filter((u) => !assignments[u.unitId]).length,
    [items, assignments],
  );

  const goNext = () => {
    if (currentStep === 0) {
      if (items.length === 0) {
        message.warning('Parse the order first — there are no items yet.');
        return;
      }
      setStep(1);
    } else if (currentStep === 1) {
      if (people.length === 0) {
        message.warning('Add at least one person.');
        return;
      }
      if (unassignedCount > 0) {
        modal.confirm({
          title: `${unassignedCount} item(s) are still unassigned`,
          content:
            'Unassigned items will be EXCLUDED from the split — nobody pays for them and the totals will not match the order. Continue anyway?',
          okText: 'Continue',
          onOk: () => setStep(2),
        });
        return;
      }
      setStep(2);
    } else if (currentStep === 2) {
      if (effectiveRate({ rateManual, rateFetched }) === null) {
        message.warning('Set an exchange rate first (fetch it or enter it manually).');
        return;
      }
      setStep(3);
    }
  };

  return (
    <div className="app-container">
      <div className="app-sheet">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="app-header">
            <div className="brand">
              <span className="brand-mark" aria-hidden>
                <CourtMark />
              </span>
              <span className="brand-text">
                <h1 className="brand-title">
                  Tenda<em>·</em>Calculator
                </h1>
                <span className="brand-tagline">Padel split · EUR → SAR</span>
              </span>
            </div>
            <Popconfirm
              title="Start over?"
              description="This clears the order, people, assignments and customs."
              okText="Reset"
              okButtonProps={{ danger: true }}
              onConfirm={() => {
                resetAll();
                message.success('Cleared.');
              }}
            >
              <Button danger type="text" icon={<DeleteOutlined />}>
                Reset
              </Button>
            </Popconfirm>
          </div>

          <Steps
          current={currentStep}
          items={STEPS}
          size="small"
          responsive={false}
          labelPlacement="vertical"
          onChange={(step) => {
            // free navigation back to any completed step; forward only via Next (validated)
            if (step < currentStep) setStep(step);
          }}
        />

        {currentStep === 0 && <PasteStep />}
        {currentStep === 1 && <AssignStep />}
        {currentStep === 2 && <CustomsStep />}
        {currentStep === 3 && <ResultsStep />}

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            disabled={currentStep === 0}
            onClick={() => setStep(currentStep - 1)}
          >
            Back
          </Button>
          {currentStep < 3 && (
            <Button type="primary" onClick={goNext}>
              {currentStep === 2 ? 'Calculate' : 'Next'} <ArrowRightOutlined />
            </Button>
          )}
          </div>
        </Space>
      </div>
    </div>
  );
}

/* Court-net mark: a padel ball over service lines. */
function CourtMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7" fill="currentColor" />
      <path
        d="M6.5 7.5C9 10 9 14 6.5 16.5M17.5 7.5C15 10 15 14 17.5 16.5"
        stroke="#0a4438"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
