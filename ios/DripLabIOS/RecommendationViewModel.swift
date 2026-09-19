import Foundation
import SwiftUI

@MainActor
final class RecommendationViewModel: ObservableObject {
    @AppStorage("apiBaseURL") private var storedBaseURL = "https://coffee.yutok.dev"

    @Published var mode: RecommendMode = .mood
    @Published var mood = MoodProfile()
    @Published var selectedChain: ChainID?
    @Published var foodPresetID: String? = "chocolate"
    @Published var foodText = ""
    @Published var result: RecommendationResult?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var apiBaseURLDraft = "https://coffee.yutok.dev"

    let foodPresets: [(id: String, label: String, icon: String)] = [
        ("chocolate", "チョコレート", "square.grid.2x2"),
        ("cheesecake", "チーズケーキ", "birthday.cake"),
        ("fruit_tart", "フルーツタルト", "leaf"),
        ("croissant", "クロワッサン・パン", "fork.knife"),
        ("matcha_sweet", "抹茶スイーツ", "cup.and.saucer"),
        ("ice_cream", "アイスクリーム", "snowflake"),
        ("pancake", "パンケーキ", "circle.grid.cross"),
        ("cheese_plate", "チーズ・ナッツ", "circle.hexagongrid"),
        ("savory_breakfast", "ベーコンエッグ", "sunrise"),
        ("salad", "サラダ・軽食", "leaf.circle"),
        ("curry", "カレー・スパイス", "flame"),
        ("japanese", "和食・寿司", "fish")
    ]

    init() {
        apiBaseURLDraft = storedBaseURL
    }

    var apiBaseURL: URL {
        URL(string: storedBaseURL) ?? URL(string: "https://coffee.yutok.dev")!
    }

    var selectedChains: [ChainID]? {
        selectedChain.map { [$0] }
    }

    var canSubmit: Bool {
        if isLoading { return false }
        if mode == .pairing {
            return foodPresetID != nil || !foodText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        return true
    }

    func submit() {
        Task {
            await fetchRecommendation()
        }
    }

    func saveAPIBaseURL() {
        let trimmed = apiBaseURLDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        storedBaseURL = trimmed
    }

    func resetAPIBaseURL() {
        storedBaseURL = "https://coffee.yutok.dev"
        apiBaseURLDraft = storedBaseURL
    }

    func readjust(_ direction: ReadjustDirection, recipeOnly: Bool = false) {
        Task {
            await fetchReadjustment(direction, recipeOnly: recipeOnly)
        }
    }

    private func fetchRecommendation() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            switch mode {
            case .mood:
                let response = try await client.recommend(
                    RecommendRequest(mood: mood, chains: selectedChains)
                )
                result = .mood(response)
            case .pairing:
                let response = try await client.pair(
                    PairingRequest(
                        foodPresetID: foodTextTrimmed.isEmpty ? foodPresetID : nil,
                        foodText: foodTextTrimmed.isEmpty ? nil : foodTextTrimmed,
                        chains: selectedChains
                    )
                )
                result = .pairing(response)
            }
            DripHaptics.notification(.success)
        } catch {
            result = nil
            errorMessage = error.localizedDescription
            DripHaptics.notification(.error)
        }
    }

    private func fetchReadjustment(_ direction: ReadjustDirection, recipeOnly: Bool) async {
        guard let current = result else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let fixedBeanID = recipeOnly ? current.primary.beanID : nil
            switch current {
            case .mood:
                let response = try await client.readjustMood(
                    ReadjustRequest(
                        mode: "mood",
                        direction: direction,
                        fixedBeanID: fixedBeanID,
                        mood: mood,
                        foodPresetID: nil,
                        foodText: nil,
                        chains: selectedChains
                    )
                )
                result = .mood(response.result)
            case .pairing(let pairing):
                let response = try await client.readjustPairing(
                    ReadjustRequest(
                        mode: "pairing",
                        direction: direction,
                        fixedBeanID: fixedBeanID,
                        mood: nil,
                        foodPresetID: pairing.foodPresetID,
                        foodText: pairing.foodLabel,
                        chains: selectedChains
                    )
                )
                result = .pairing(response.result)
            }
            DripHaptics.notification(.success)
        } catch {
            errorMessage = error.localizedDescription
            DripHaptics.notification(.error)
        }
    }

    private var client: APIClient {
        APIClient(baseURL: apiBaseURL)
    }

    private var foodTextTrimmed: String {
        foodText.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
