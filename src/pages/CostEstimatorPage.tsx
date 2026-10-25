import { useState, type FormEvent } from "react";
import { CostResult } from "../components/CostResult";
import { DiagnosisSearch } from "../components/DiagnosisSearch";
import { DrugPicker, type DrugDraft } from "../components/DrugPicker";
import { PlanPicker, type PlanDraft } from "../components/PlanPicker";
import { useEstimate } from "../hooks/queries";
import type { Diagnosis } from "../types";

export function CostEstimatorPage() {
  const [diagnosis, setDiagnosis] = useState<Diagnosis>();
  const [plan, setPlan] = useState<PlanDraft>({});
  const [drug, setDrug] = useState<DrugDraft>({});
  const estimate = useEstimate();

  const ready =
    diagnosis && plan.insurer && plan.coverageType && plan.formularyId && drug.rxcui && drug.strength && drug.quantity;

  function onDiagnosisChange(d?: Diagnosis) {
    setDiagnosis(d);
    setDrug({}); // drug list depends on diagnosis
    estimate.reset();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    estimate.mutate({
      diagnosis,
      plan: { insurer: plan.insurer!, coverageType: plan.coverageType!, formularyId: plan.formularyId! },
      drug: { rxcui: drug.rxcui!, strength: drug.strength!, quantity: drug.quantity! },
    });
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Drug cost estimator</h1>
        <p>See whether your plan covers a prescription and roughly what you'll pay.</p>
      </header>

      <form className="steps" onSubmit={onSubmit}>
        <section className="card">
          <h2><span className="num">1</span> Diagnosis</h2>
          <DiagnosisSearch value={diagnosis} onChange={onDiagnosisChange} />
        </section>

        <section className="card">
          <h2><span className="num">2</span> Insurance</h2>
          <PlanPicker
            value={plan}
            onChange={(p) => {
              setPlan(p);
              estimate.reset();
            }}
          />
        </section>

        <section className="card">
          <h2><span className="num">3</span> Drug</h2>
          <DrugPicker
            icd10={diagnosis?.icd10}
            value={drug}
            onChange={(d) => {
              setDrug(d);
              estimate.reset();
            }}
          />
        </section>

        <button type="submit" className="primary" disabled={!ready || estimate.isPending}>
          {estimate.isPending ? "Estimating…" : "Estimate cost"}
        </button>
      </form>

      {estimate.isError && <p className="error">Couldn't get an estimate: {estimate.error.message}</p>}
      {estimate.data && <CostResult result={estimate.data} />}
    </main>
  );
}
