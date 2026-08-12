"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChainId,
  EquipmentId,
  MoodProfile,
  PairingResponse,
  ReadjustDirection,
  RecommendMode,
  RecommendResponse,
} from "@driplab/recommender";
import { ChainSelector } from "@/components/ChainSelector";
import { EquipmentSelector } from "@/components/EquipmentSelector";
import { FoodFreeInput } from "@/components/FoodFreeInput";
import { FoodPresetSelector } from "@/components/FoodPresetSelector";
import { ModeToggle } from "@/components/ModeToggle";
import { MoodSliders } from "@/components/MoodSliders";
import { Onboarding } from "@/components/Onboarding";
import { PresetButtons } from "@/components/PresetButtons";
import { ResultPanel } from "@/components/ResultPanel";
import { TermLabel } from "@/components/TermTooltip";
import { isOnboardingDone } from "@/lib/onboarding";

const DEFAULT_MOOD: MoodProfile = {
  alertness: 50,
  acidity_pref: 50,
  body_pref: 50,
  sweetness_pref: 50,
};

const DEFAULT_EQUIPMENT: EquipmentId[] = ["drip"];

type ResultState =
  | { mode: "mood"; data: RecommendResponse }
  | { mode: "pairing"; data: PairingResponse };

export function HomeClient() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mode, setMode] = useState<RecommendMode>("mood");
  const [mood, setMood] = useState<MoodProfile>(DEFAULT_MOOD);
  const [foodPresetId, setFoodPresetId] = useState<string | null>("chocolate");
  const [foodText, setFoodText] = useState("");
  const [equipment, setEquipment] =
    useState<EquipmentId[]>(DEFAULT_EQUIPMENT);
  const [chainFilter, setChainFilter] = useState<ChainId | "all">("all");
  const [servings, setServings] = useState<1 | 2>(2);
  const [result, setResult] = useState<ResultState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setShowOnboarding(!isOnboardingDone());
  }, []);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "mood") {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mood,
            equipment,
            servings,
            chains: chainFilter === "all" ? undefined : [chainFilter],
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "提案の取得に失敗しました");
        }
        const data: RecommendResponse = await res.json();
        setResult({ mode: "mood", data });
      } else {
        if (!foodPresetId && !foodText.trim()) {
          throw new Error("食事プリセットを選ぶか、自由入力してください");
        }
        const res = await fetch("/api/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            food_preset_id: foodPresetId ?? undefined,
            food_text: foodText.trim() || undefined,
            equipment,
            servings,
            chains: chainFilter === "all" ? undefined : [chainFilter],
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "カップリングの取得に失敗しました");
        }
        const data: PairingResponse = await res.json();
        setResult({ mode: "pairing", data });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mode, mood, foodPresetId, foodText, equipment, servings, chainFilter]);

  const readjust = useCallback(
    async (direction: ReadjustDirection, recipeOnly: boolean) => {
      if (!result) return;
      setLoading(true);
      setError(null);
      try {
        const body =
          result.mode === "mood"
            ? {
                mode: "mood" as const,
                direction,
                fixed_bean_id: recipeOnly
                  ? result.data.primary.bean_id
                  : undefined,
                mood,
                equipment,
                servings,
                chains: chainFilter === "all" ? undefined : [chainFilter],
              }
            : {
                mode: "pairing" as const,
                direction,
                fixed_bean_id: recipeOnly
                  ? result.data.primary.bean_id
                  : undefined,
                food_preset_id: result.data.food_preset_id,
                food_text: result.data.food_label,
                equipment,
                servings,
                chains: chainFilter === "all" ? undefined : [chainFilter],
              };

        const res = await fetch("/api/readjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error ?? "再調整に失敗しました");
        }
        const adjusted = await res.json();
        if (result.mode === "mood") {
          setResult({ mode: "mood", data: adjusted.result });
        } else {
          setResult({ mode: "pairing", data: adjusted.result });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    [result, mood, equipment, servings, chainFilter],
  );

  function scrollToInput() {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="app-main">
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="workspace">
        <section className="input-panel" ref={inputRef}>
          <ModeToggle mode={mode} onChange={setMode} />

          <div className="section-card" style={{ marginTop: "1rem" }}>
            {mode === "mood" ? (
              <>
                <p className="section-title">気分プリセット</p>
                <PresetButtons mood={mood} onSelect={setMood} />

                <p className="section-title">
                  今日の気分（<TermLabel term="酸味" />・
                  <TermLabel term="コク" /> など）
                </p>
                <MoodSliders mood={mood} onChange={setMood} />
              </>
            ) : (
              <>
                <p className="section-title">食事・スイーツ</p>
                <FoodPresetSelector
                  value={foodPresetId}
                  onChange={(id) => {
                    setFoodPresetId(id);
                    setFoodText("");
                  }}
                />
                <FoodFreeInput
                  value={foodText}
                  onChange={(text) => {
                    setFoodText(text);
                    if (text.trim()) setFoodPresetId(null);
                  }}
                />
              </>
            )}

            <p className="section-title">持っている器具</p>
            <EquipmentSelector value={equipment} onChange={setEquipment} />

            <p className="section-title">杯数</p>
            <div className="filter-row" style={{ marginTop: "0.25rem" }}>
              <button
                type="button"
                className={`filter-chip${servings === 1 ? " active" : ""}`}
                onClick={() => setServings(1)}
              >
                1杯
              </button>
              <button
                type="button"
                className={`filter-chip${servings === 2 ? " active" : ""}`}
                onClick={() => setServings(2)}
              >
                2杯
              </button>
            </div>

            <p className="section-title">チェーン（任意）</p>
            <ChainSelector value={chainFilter} onChange={setChainFilter} />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="primary-btn"
              onClick={submit}
              disabled={
                loading ||
                equipment.length === 0 ||
                (mode === "pairing" && !foodPresetId && !foodText.trim())
              }
            >
              {loading
                ? "提案を作成中…"
                : mode === "mood"
                  ? "今日の一杯を見つける"
                  : "食事に合う一杯を見つける"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
        </section>

        <section>
          {loading && !result && (
            <div className="loading section-card">
              {mode === "mood"
                ? "豆と抽出器具を提案中…"
                : "食事に合う豆と淹れ方を提案中…"}
            </div>
          )}
          {result && (
            <ResultPanel
              mode={result.mode}
              primary={result.data.primary}
              alternatives={result.data.alternatives}
              otherRecipes={result.data.other_recipes}
              pairingReason={
                result.mode === "pairing"
                  ? result.data.primary.pairing_reason
                  : undefined
              }
              foodLabel={
                result.mode === "pairing" ? result.data.food_label : undefined
              }
              mood={result.mode === "mood" ? mood : undefined}
              foodPresetId={
                result.mode === "pairing"
                  ? result.data.food_preset_id
                  : undefined
              }
              loading={loading}
              onReadjust={readjust}
              onEditConditions={scrollToInput}
            />
          )}
          {!loading && !result && (
            <div
              className="section-card"
              style={{ color: "var(--text-muted)", textAlign: "center" }}
            >
              <p style={{ margin: 0 }}>
                {mode === "mood" ? (
                  <>
                    気分と所持器具を選んで
                    <br />
                    「今日の一杯を見つける」を押してください
                  </>
                ) : (
                  <>
                    食事・スイーツと器具を選んで
                    <br />
                    「食事に合う一杯を見つける」を押してください
                  </>
                )}
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.8125rem",
                }}
              >
                豆・淹れ方・レシピを、理由付きで提案します
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
