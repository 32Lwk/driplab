"use client";

import { useState } from "react";
import { ONBOARDING_STEPS, markOnboardingDone } from "@/lib/onboarding";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  function finish() {
    markOnboardingDone();
    onComplete();
  }

  function next() {
    if (isLast) finish();
    else setStep((s) => s + 1);
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot${i <= step ? " active" : ""}`}
            />
          ))}
        </div>
        <p className="onboarding-step-label">
          ステップ {step + 1} / {ONBOARDING_STEPS.length}
        </p>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-body">{current.body}</p>
        <div className="onboarding-actions">
          <button type="button" className="ghost-btn" onClick={finish}>
            スキップ
          </button>
          <button type="button" className="primary-btn" onClick={next}>
            {isLast ? "はじめる" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
