"use client";

import { useCallback, useState } from "react";
import type {
  ChainId,
  MoodProfile,
  RecommendResponse,
} from "@driplab/recommender";
import { ChainSelector } from "@/components/ChainSelector";
import { MoodSliders } from "@/components/MoodSliders";
import { PresetButtons } from "@/components/PresetButtons";
import { ResultPanel } from "@/components/ResultPanel";

const DEFAULT_MOOD: MoodProfile = {
  alertness: 50,
  acidity_pref: 50,
  body_pref: 50,
  sweetness_pref: 50,
};

export function HomeClient() {
  const [mood, setMood] = useState<MoodProfile>(DEFAULT_MOOD);
  const [chainFilter, setChainFilter] = useState<ChainId | "all">("all");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          chains: chainFilter === "all" ? undefined : [chainFilter],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "提案の取得に失敗しました");
      }
      const data: RecommendResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mood, chainFilter]);

  return (
    <main className="app-main">
      <div className="workspace">
        <section className="input-panel">
          <div className="section-card">
            <p className="section-title">気分プリセット</p>
            <PresetButtons mood={mood} onSelect={setMood} />

            <p className="section-title">今日の気分</p>
            <MoodSliders mood={mood} onChange={setMood} />

            <p className="section-title">チェーン（任意）</p>
            <ChainSelector value={chainFilter} onChange={setChainFilter} />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="primary-btn"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "提案を作成中…" : "今日の一杯を見つける"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
        </section>

        <section>
          {loading && !result && (
            <div className="loading section-card">豆と抽出器具を提案中…</div>
          )}
          {result && (
            <ResultPanel
              primary={result.primary}
              alternatives={result.alternatives}
              otherRecipes={result.other_recipes}
            />
          )}
          {!loading && !result && (
            <div
              className="section-card"
              style={{ color: "var(--text-muted)", textAlign: "center" }}
            >
              <p style={{ margin: 0 }}>
                スライダーで気分を選んで
                <br />
                「今日の一杯を見つける」を押してください
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.8125rem",
                }}
              >
                豆・抽出器具・レシピをまとめて提案します
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
