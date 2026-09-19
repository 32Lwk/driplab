import SwiftUI

@main
struct DripLabIOSApp: App {
    @StateObject private var viewModel = RecommendationViewModel()
    @StateObject private var favorites = FavoritesStore()
    @AppStorage("driplab_onboarding_done_v1") private var onboardingDone = false

    var body: some Scene {
        WindowGroup {
            AppLaunchView {
                ContentView()
                    .environmentObject(viewModel)
                    .environmentObject(favorites)
                    .sheet(isPresented: Binding(
                        get: { !onboardingDone },
                        set: { onboardingDone = !$0 }
                    )) {
                        OnboardingView()
                            .presentationDetents([.medium, .large])
                    }
            }
        }
    }
}

struct AppLaunchView<Content: View>: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isSplashVisible = true
    @ViewBuilder let content: () -> Content

    var body: some View {
        ZStack {
            content()

            if isSplashVisible {
                splash
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .task {
            if reduceMotion {
                isSplashVisible = false
            } else {
                try? await Task.sleep(for: .milliseconds(760))
                withAnimation(.easeInOut(duration: 0.38)) {
                    isSplashVisible = false
                }
            }
        }
    }

    private var splash: some View {
        ZStack {
            Color.dripBackground
                .ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "cup.and.saucer.fill")
                    .font(.system(size: 42, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(width: 82, height: 82)
                    .background(Color.dripAccent, in: RoundedRectangle(cornerRadius: 22))
                    .shadow(color: Color.dripAccent.opacity(0.28), radius: 20, y: 10)
                    .scaleEffect(isSplashVisible ? 1 : 0.82)
                    .opacity(isSplashVisible ? 1 : 0)
                    .animation(.spring(response: 0.55, dampingFraction: 0.72), value: isSplashVisible)

                Text("DripLab")
                    .font(.title.bold())
                    .foregroundStyle(Color.dripInk)
                    .opacity(isSplashVisible ? 1 : 0)
                    .offset(y: isSplashVisible ? 0 : 8)
                    .animation(.easeOut(duration: 0.3).delay(0.08), value: isSplashVisible)
            }
        }
        .accessibilityLabel("DripLabを起動中")
    }
}
