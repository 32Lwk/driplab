import SwiftUI

struct OnboardingView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("driplab_onboarding_done_v1") private var isDone = false
    @State private var step = 0

    private let steps: [(title: String, body: String, icon: String)] = [
        ("気分 or 食事で選ぶ", "気分では4つのスライダーから今日の一杯を、食事ではスイーツや料理に合う豆と淹れ方を提案します。", "slider.horizontal.3"),
        ("理由付きで提案", "豆・淹れ方・レシピを、なぜその組み合わせなのか理由付きで表示します。", "text.bubble"),
        ("気になる豆を保存", "お気に入りはこの端末に保存できます。購入ページや公式情報にもすぐアクセスできます。", "star"),
    ]

    var body: some View {
        VStack(spacing: 24) {
            HStack(spacing: 8) {
                ForEach(steps.indices, id: \.self) { index in
                    Capsule()
                        .fill(index <= step ? Color.dripAccent : Color.dripBorder)
                        .frame(height: 6)
                }
            }

            Spacer()

            Image(systemName: steps[step].icon)
                .font(.system(size: 52, weight: .medium))
                .foregroundStyle(Color.dripAccent)
                .frame(width: 92, height: 92)
                .background(Color.dripHighlight, in: RoundedRectangle(cornerRadius: 20))
                .id("icon-\(step)")
                .transition(reduceMotion ? .opacity : .asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))

            VStack(spacing: 12) {
                Text("ステップ \(step + 1) / \(steps.count)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.dripMuted)
                Text(steps[step].title)
                    .font(.title2.bold())
                    .foregroundStyle(Color.dripInk)
                    .multilineTextAlignment(.center)
                Text(steps[step].body)
                    .font(.body)
                    .foregroundStyle(Color.dripMutedStrong)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .id("copy-\(step)")
            .transition(reduceMotion ? .opacity : .asymmetric(
                insertion: .move(edge: .trailing).combined(with: .opacity),
                removal: .move(edge: .leading).combined(with: .opacity)
            ))

            Spacer()

            HStack(spacing: 12) {
                Button("スキップ") {
                    DripHaptics.impact()
                    finish()
                }
                .buttonStyle(.bordered)
                .buttonStyle(DripPressableButtonStyle())

                Button(step == steps.count - 1 ? "はじめる" : "次へ") {
                    DripHaptics.impact(.medium)
                    if step == steps.count - 1 {
                        finish()
                    } else {
                        if reduceMotion {
                            step += 1
                        } else {
                            withAnimation(.easeInOut(duration: 0.32)) { step += 1 }
                        }
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.dripAccent)
                .buttonStyle(DripPressableButtonStyle())
            }
        }
        .padding(24)
        .background(Color.dripBackground)
    }

    private func finish() {
        isDone = true
        dismiss()
    }
}
