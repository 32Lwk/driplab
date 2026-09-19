import SwiftUI
import UIKit

enum DripHaptics {
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }

    static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(type)
    }
}

struct DripPressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.88 : 1)
            .animation(.snappy(duration: 0.18), value: configuration.isPressed)
    }
}

struct ShimmerView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: CGFloat = -1

    var body: some View {
        LinearGradient(
            colors: [
                Color.dripSurface.opacity(0.35),
                Color.white.opacity(0.8),
                Color.dripSurface.opacity(0.35)
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
        .mask {
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [.clear, .white, .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .offset(x: phase * 240)
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: 1.25).repeatForever(autoreverses: false)) {
                phase = 1
            }
        }
    }
}

struct RevealModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let delay: Double
    @State private var isVisible = false

    func body(content: Content) -> some View {
        content
            .opacity(isVisible || reduceMotion ? 1 : 0)
            .offset(y: isVisible || reduceMotion ? 0 : 12)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeOut(duration: 0.42).delay(delay)) {
                    isVisible = true
                }
            }
    }
}

extension View {
    func dripReveal(delay: Double = 0) -> some View {
        modifier(RevealModifier(delay: delay))
    }
}
