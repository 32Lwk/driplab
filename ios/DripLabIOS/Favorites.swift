import Foundation
import SwiftUI

struct FavoriteEntry: Codable, Identifiable {
    let id: String
    let savedAt: Date
    let mode: RecommendMode
    let mood: MoodProfile?
    let foodLabel: String?
    let foodPresetID: String?
    let beanID: String
    let chainNameJA: String
    let productName: String
    let buyURL: URL
    let imageURL: URL?
    let recipe: BrewRecipe
    let pairingReason: String?
}

@MainActor
final class FavoritesStore: ObservableObject {
    @Published private(set) var entries: [FavoriteEntry] = []

    private let storageKey = "driplab_favorites_v1"
    private let maximumCount = 50

    init() {
        load()
    }

    func contains(beanID: String, method: String) -> Bool {
        entries.contains { $0.beanID == beanID && $0.recipe.method == method }
    }

    func add(item: RecommendItem, mode: RecommendMode, mood: MoodProfile?) {
        guard !contains(beanID: item.beanID, method: item.recipe.method) else { return }
        let entry = FavoriteEntry(
            id: "\(item.beanID)-\(item.recipe.method)-\(Date().timeIntervalSince1970)",
            savedAt: Date(),
            mode: mode,
            mood: mood,
            foodLabel: item.foodLabel,
            foodPresetID: nil,
            beanID: item.beanID,
            chainNameJA: item.chainNameJA,
            productName: item.productName,
            buyURL: item.buyURL,
            imageURL: item.imageURL,
            recipe: item.recipe,
            pairingReason: item.pairingReason
        )
        entries = Array(([entry] + entries).prefix(maximumCount))
        save()
    }

    func remove(_ entry: FavoriteEntry) {
        entries.removeAll { $0.id == entry.id }
        save()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([FavoriteEntry].self, from: data) else {
            return
        }
        entries = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}

struct FavoritesView: View {
    @EnvironmentObject private var favorites: FavoritesStore

    var body: some View {
        ScrollView {
            if favorites.entries.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Image(systemName: "star")
                        .font(.title2)
                        .foregroundStyle(Color.dripAccent)
                    Text("お気に入りはまだありません")
                        .font(.headline)
                    Text("推薦結果の「お気に入りに保存」から、気になった豆とレシピを端末に保存できます。")
                        .font(.subheadline)
                        .foregroundStyle(Color.dripMuted)
                }
                .sectionPanel()
                .padding(18)
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(favorites.entries) { entry in
                        FavoriteCard(entry: entry)
                            .dripReveal(delay: 0.04)
                    }
                }
                .padding(18)
            }
        }
        .background(Color.dripBackground)
        .navigationTitle("お気に入り")
    }
}

struct FavoriteCard: View {
    @EnvironmentObject private var favorites: FavoritesStore
    let entry: FavoriteEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                ProductImageFrame(url: entry.imageURL, title: entry.productName, size: .compact)
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.chainNameJA)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(Color.dripAccent)
                    Text(entry.productName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.dripInk)
                        .lineLimit(2)
                    Text("\(entry.recipe.methodJA) / \(entry.recipe.coffeeG)g / \(entry.recipe.waterTempC)℃")
                        .font(.caption)
                        .foregroundStyle(Color.dripMutedStrong)
                }
                Spacer()
                Button {
                    withAnimation(.easeInOut(duration: 0.24)) {
                        favorites.remove(entry)
                    }
                    DripHaptics.notification(.warning)
                } label: {
                    Image(systemName: "trash")
                        .foregroundStyle(Color.dripMutedStrong)
                }
                .buttonStyle(.plain)
                .buttonStyle(DripPressableButtonStyle())
                .accessibilityLabel("お気に入りから削除")
            }

            HStack(spacing: 10) {
                Link(destination: entry.buyURL) {
                    Label("購入ページ", systemImage: "safari")
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.dripAccent)
                Spacer()
                Text(entry.savedAt.formatted(date: .numeric, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(Color.dripMuted)
            }
        }
        .sectionPanel()
    }
}
