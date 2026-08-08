"use client";

import { useCallback, useState } from "react";
import type {
  EquipmentId,
  MoodProfile,
  RecommendResponse,
} from "@driplab/recommender";
import { EquipmentSelector } from "@/components/EquipmentSelector";
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
  const [equipment, setEquipment] = useState<EquipmentId[]>(["drip"]);
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
        body: JSON.stringify({ mood, equipment }),
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
  }, [mood, equipment]);

  return (
    <main className="app-main">
      <div className="workspace">
        <section className="input-panel">
          <div className="section-card">
            <p className="section-title">気分プリセット</p>
            <PresetButtons mood={mood} onSelect={setMood} />

            <p className="section-title">今日の気分</p>
            <MoodSliders mood={mood} onChange={setMood} />
          </div>

          <div className="section-card" style={{ marginTop: "1rem" }}>
            <p className="section-title">抽出器具</p>
            <EquipmentSelector selected={equipment} onChange={setEquipment} />
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
            <div className="loading section-card">提案を計算しています…</div>
          )}
          {result && (
            <ResultPanel
              primary={result.primary}
              alternatives={result.alternatives}
            />
          )}
          {!loading && !result && (
            <div
              className="section-card"
              style={{ color: "var(--text-muted)", textAlign: "center" }}
            >
              <p style={{ margin: 0 }}>
                スライダーと器具を選んで
                <br />
                「今日の一杯を見つける」を押してください
              </p>
            </div>
          )}
        </section>
      </div>

      <p className="footer-note">
        データ出典: 各チェーン公式サイト · 全160品目 · ゲスト利用（ログイン不要）
      </p>
    </main>
  );
}
