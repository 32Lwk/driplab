import SwiftUI
import UIKit

struct ContentView: View {
    var body: some View {
        TabView {
            RecommendationHomeView()
                .tabItem {
                    Label("推薦", systemImage: "sparkles")
                }

            NavigationStack {
                BeanCatalogView()
            }
            .tabItem {
                Label("豆一覧", systemImage: "list.bullet.rectangle")
            }

            NavigationStack {
                FavoritesView()
            }
            .tabItem {
                Label("お気に入り", systemImage: "star")
            }

            NavigationStack {
                BrewMethodsView()
            }
            .tabItem {
                Label("淹れ方", systemImage: "mug")
            }

            NavigationStack {
                CoffeeKnowledgeView()
            }
            .tabItem {
                Label("知識", systemImage: "book.closed")
            }
        }
        .tint(.dripAccent)
        .preferredColorScheme(.light)
    }
}

struct RecommendationHomeView: View {
    @EnvironmentObject private var viewModel: RecommendationViewModel
    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        header
                        inputSection

                        if let errorMessage = viewModel.errorMessage {
                            ErrorBanner(message: errorMessage)
                        }

                        if let result = viewModel.result {
                            ResultView(result: result)
                        } else {
                            EmptyStateView(mode: viewModel.mode)
                        }

                    }
                    .padding(18)
                    .padding(.bottom, 28)
                }
                .background(Color.dripBackground)

            }
            .background(Color.dripBackground)
            .navigationTitle("DripLab")
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(Color.dripInk)
                            .padding(8)
                            .background(Color.dripHighlight, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("API設定")
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.dripAccent)
                    Image(systemName: "cup.and.saucer.fill")
                        .font(.title3)
                        .foregroundStyle(.white)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 5) {
                    Text("DripLab")
                        .font(.headline.bold())
                        .foregroundStyle(Color.dripInk)
                    Text("今日の一杯を、気分か食事から。")
                        .font(.title2.bold())
                        .foregroundStyle(Color.dripInk)
                    Text("豆・淹れ方・購入先を、いまの条件で提案します。")
                        .font(.subheadline)
                        .foregroundStyle(Color.dripMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.top, 4)
    }

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            Picker("モード", selection: $viewModel.mode) {
                ForEach(RecommendMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            if viewModel.mode == .mood {
                MoodInputView(mood: $viewModel.mood)
            } else {
                PairingInputView()
            }

            ChainPickerView(selection: $viewModel.selectedChain)

            submitButton
        }
        .sectionPanel()
    }

    private var submitButton: some View {
        Button {
            viewModel.submit()
        } label: {
            HStack {
                if viewModel.isLoading {
                    ProgressView()
                        .tint(.white)
                }
                Text(viewModel.mode == .mood ? "今日の一杯を見つける" : "食事に合う一杯を見つける")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
        }
        .buttonStyle(.borderedProminent)
        .tint(.dripAccent)
        .foregroundStyle(.white)
        .disabled(!viewModel.canSubmit)
    }
}

struct MoodInputView: View {
    @Binding var mood: MoodProfile

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("今日の気分")
                .font(.headline)
            MoodSlider(title: "覚醒度", value: $mood.alertness)
            MoodSlider(title: "酸味", value: $mood.acidityPref)
            MoodSlider(title: "コク", value: $mood.bodyPref)
            MoodSlider(title: "甘み", value: $mood.sweetnessPref)
        }
    }
}

struct MoodSlider: View {
    let title: String
    @Binding var value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.dripInk)
                Spacer()
                Text("\(value)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(Color.dripMuted)
            }
            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { value = Int($0.rounded()) }
                ),
                in: 0...100,
                step: 1
            )
            .tint(.dripAccent)
        }
    }
}

struct PairingInputView: View {
    @EnvironmentObject private var viewModel: RecommendationViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("食事・スイーツ")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(viewModel.foodPresets, id: \.id) { preset in
                    FoodChoiceCard(
                        icon: preset.icon,
                        title: preset.label,
                        isSelected: viewModel.foodPresetID == preset.id && viewModel.foodText.isEmpty
                    ) {
                        viewModel.foodPresetID = preset.id
                        viewModel.foodText = ""
                    }
                }
            }
            TextField("自由入力: 例 抹茶テリーヌ", text: $viewModel.foodText)
                .foregroundStyle(Color.dripInk)
                .tint(Color.dripAccent)
                .padding(12)
                .background(Color.dripSurface, in: RoundedRectangle(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.dripBorder, lineWidth: 1)
                }
                .onChange(of: viewModel.foodText) { _, newValue in
                    if !newValue.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).isEmpty {
                        viewModel.foodPresetID = nil
                    }
                }
        }
    }
}

struct ChainPickerView: View {
    @Binding var selection: ChainID?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("チェーン")
                .font(.headline)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ChoiceChip(title: "すべて", isSelected: selection == nil) {
                        selection = nil
                    }
                    ForEach(ChainID.allCases) { chain in
                        ChoiceChip(title: chain.label, isSelected: selection == chain) {
                            selection = chain
                        }
                    }
                }
            }
        }
    }
}

struct ChoiceChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .foregroundStyle(isSelected ? .white : Color.dripInk)
                .background(isSelected ? Color.dripAccent : Color.dripSurface, in: Capsule())
                .overlay {
                    Capsule().stroke(isSelected ? Color.clear : Color.dripBorder, lineWidth: 1)
                }
        }
        .buttonStyle(.plain)
    }
}

struct FoodChoiceCard: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.title3)
                    .frame(width: 26)
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.subheadline)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
            .padding(.horizontal, 12)
            .foregroundStyle(isSelected ? .white : Color.dripInk)
            .background(isSelected ? Color.dripAccent : Color.dripSurface, in: RoundedRectangle(cornerRadius: 10))
            .overlay {
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isSelected ? Color.clear : Color.dripBorder, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
    }
}

struct ResultView: View {
    let result: RecommendationResult

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            PrimaryResultCard(item: result.primary)

            if !result.otherRecipes.isEmpty {
                RecipeAlternativesView(recipes: result.otherRecipes)
            }

            if !result.alternatives.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("ほかの候補")
                        .font(.headline)
                        .foregroundStyle(Color.dripInk)
                    ForEach(result.alternatives.prefix(5)) { item in
                        AlternativeCard(item: item)
                    }
                }
                .sectionPanel()
            }
        }
    }
}

struct PrimaryResultCard: View {
    @EnvironmentObject private var viewModel: RecommendationViewModel
    @EnvironmentObject private var favorites: FavoritesStore
    let item: RecommendItem

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let imageURL = item.displayImageURL(baseURL: viewModel.apiBaseURL) {
                ProductImageFrame(url: imageURL, title: item.productName, size: .large)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(item.chainNameJA)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.dripAccent)
                Text(item.productName)
                    .font(.title2.bold())
                    .foregroundStyle(Color.dripInk)
                FlowLayout(spacing: 8) {
                    ResultBadge(icon: "sparkles", text: "\(Int((item.matchScore * 100).rounded()))%")
                    ResultBadge(icon: "cup.and.saucer", text: item.recipe.methodJA)
                    if let roast = item.roastLabelJA ?? item.roastLevelLabel {
                        ResultBadge(icon: "flame", text: roast)
                    }
                }
            }

            ProductMetaView(item: item)

            if let pairingReason = item.pairingReason {
                InfoBlock(title: "なぜこの食事に合う？", text: pairingReason)
            }

            ReasonView(item: item)

            if let episode = item.episode {
                InfoBlock(title: "この豆のストーリー", text: episode)
            }

            if let tasteNotes = item.tasteNotes, tasteNotes != "不明" {
                InfoBlock(title: "味わいの特徴", text: tasteNotes)
            }

            BeanDetailSummary(item: item)

            RecipeView(recipe: item.recipe)

            ReadjustActionsView()

            Button {
                guard !favorites.contains(beanID: item.beanID, method: item.recipe.method) else { return }
                withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) {
                    favorites.add(item: item, mode: viewModel.mode, mood: viewModel.mode == .mood ? viewModel.mood : nil)
                }
                DripHaptics.notification(.success)
            } label: {
                Label(
                    favorites.contains(beanID: item.beanID, method: item.recipe.method) ? "保存済み" : "お気に入りに保存",
                    systemImage: favorites.contains(beanID: item.beanID, method: item.recipe.method) ? "star.fill" : "star"
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(.dripAccent)
            .disabled(favorites.contains(beanID: item.beanID, method: item.recipe.method))
            .buttonStyle(DripPressableButtonStyle())

            VStack(spacing: 10) {
                Link(destination: item.buyURL) {
                    Label("購入ページへ", systemImage: "safari")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .tint(.dripAccent)

                if let episodeSource = item.episodeSource {
                    Link(destination: episodeSource) {
                        Label("公式サイトの詳細", systemImage: "arrow.up.right.square")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.bordered)
                    .tint(.dripAccent)
                }
            }
        }
        .sectionPanel()
    }
}

struct ProductMetaView: View {
    let item: RecommendItem

    var body: some View {
        let meta = item.productMeta
        if !meta.isEmpty {
            FlowLayout(spacing: 8) {
                ForEach(meta, id: \.self) { value in
                    Text(value)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.dripMutedStrong)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 6)
                        .background(Color.dripSurface, in: Capsule())
                        .overlay {
                            Capsule().stroke(Color.dripBorder, lineWidth: 1)
                        }
                }
            }
        }
    }
}

struct BeanDetailSummary: View {
    let item: RecommendItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let description = item.description, !description.isEmpty, description != item.tasteNotes {
                InfoBlock(title: "商品メモ", text: description)
            }

            if let tags = item.flavorTags, !tags.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("風味タグ")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.dripInk)
                    FlowLayout(spacing: 8) {
                        ForEach(tags.prefix(8), id: \.self) { tag in
                            Text(tag)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(Color.dripAccent)
                                .padding(.horizontal, 9)
                                .padding(.vertical, 6)
                                .background(Color.dripHighlight, in: Capsule())
                                .overlay {
                                    Capsule().stroke(Color.dripBorder, lineWidth: 1)
                                }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                if let processing = item.processing, processing != "不明" {
                    DetailRow(icon: "leaf", label: "精製", value: processing)
                }
                if let beanScore = item.beanScore {
                    DetailRow(icon: "chart.bar", label: "豆の適合", value: "\(Int((beanScore * 100).rounded()))%")
                }
                if let equipmentScore = item.equipmentScore {
                    DetailRow(icon: "dial.low", label: "器具の適合", value: "\(Int((equipmentScore * 100).rounded()))%")
                }
            }
        }
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        Label {
            Text("\(label): \(value)")
                .font(.footnote)
                .foregroundStyle(Color.dripMutedStrong)
        } icon: {
            Image(systemName: icon)
                .foregroundStyle(Color.dripAccent)
        }
    }
}

struct ReasonView: View {
    let item: RecommendItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let reasonParts = item.reasonParts {
                if let mood = reasonParts.moodSummary {
                    InfoLine(title: "志向", text: mood)
                }
                if let food = reasonParts.foodSummary {
                    InfoLine(title: "食事", text: food)
                }
                if let bean = reasonParts.beanFit {
                    InfoLine(title: "豆", text: bean)
                }
                if let brew = reasonParts.brewFit {
                    InfoLine(title: "淹れ方", text: brew)
                }
            } else {
                Text(item.reason)
                    .font(.subheadline)
                    .foregroundStyle(Color.dripMutedStrong)
            }
        }
    }
}

struct InfoLine: View {
    let title: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(Color.dripAccent)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.dripMuted)
        }
    }
}

struct InfoBlock: View {
    let title: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(Color.dripInk)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.dripMuted)
        }
        .padding(12)
        .background(Color.dripHighlight, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct RecipeView: View {
    let recipe: BrewRecipe

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("レシピ")
                .font(.headline)
                .foregroundStyle(Color.dripInk)

            LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 10) {
                RecipeMetric(label: "豆", value: "\(recipe.coffeeG)g")
                RecipeMetric(label: "湯量", value: recipe.waterML.map { "\($0)ml" } ?? recipe.yieldML.map { "\($0)ml" } ?? "-")
                RecipeMetric(label: "湯温", value: "\(recipe.waterTempC)℃")
                RecipeMetric(label: "時間", value: formatSeconds(recipe.timeSec))
                RecipeMetric(label: "挽き目", value: recipe.grindJA)
                RecipeMetric(label: "器具", value: recipe.methodJA)
            }

            if let steps = recipe.steps, !steps.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        Text("\(index + 1). \(step)")
                            .font(.footnote)
                            .foregroundStyle(Color.dripMuted)
                    }
                }
            }

            if let notes = recipe.notes {
                Text(notes)
                    .font(.footnote)
                    .foregroundStyle(Color.dripMuted)
            }

            if let suitabilityNote = recipe.suitabilityNote {
                Text(suitabilityNote)
                    .font(.footnote)
                    .foregroundStyle(Color.dripMutedStrong)
            }

            if let referenceURL = recipe.referenceURL {
                Link(destination: referenceURL) {
                    Label("参考資料", systemImage: "arrow.up.right.square")
                        .font(.footnote.weight(.semibold))
                }
                .foregroundStyle(Color.dripAccent)
            }
        }
    }

    private func formatSeconds(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let rest = seconds % 60
        return minutes > 0 ? "\(minutes):\(String(format: "%02d", rest))" : "\(seconds)秒"
    }
}

struct RecipeMetric: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundStyle(Color.dripMuted)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.dripInk)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.dripSurface, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
    }
}

struct ReadjustActionsView: View {
    @EnvironmentObject private var viewModel: RecommendationViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("再調整")
                .font(.headline)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(ReadjustDirection.allCases) { direction in
                        ChoiceChip(title: direction.label, isSelected: false) {
                            viewModel.readjust(direction)
                        }
                    }
                    ChoiceChip(title: "豆は固定", isSelected: false) {
                        viewModel.readjust(.lighter, recipeOnly: true)
                    }
                }
            }
        }
        .disabled(viewModel.isLoading)
    }
}

struct RecipeAlternativesView: View {
    let recipes: [BrewRecipe]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ほかの淹れ方")
                .font(.headline)
            ForEach(recipes.prefix(3)) { recipe in
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(recipe.methodJA)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.dripInk)
                        Text("\(recipe.grindJA) / \(recipe.coffeeG)g / \(recipe.waterTempC)℃")
                            .font(.caption)
                            .foregroundStyle(Color.dripMutedStrong)
                    }
                    Spacer()
                    Text(formatSeconds(recipe.timeSec))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(Color.dripMutedStrong)
                }
                .padding(12)
                .background(Color.dripSurface, in: RoundedRectangle(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.dripBorder, lineWidth: 1)
                }
            }
        }
        .sectionPanel()
    }

    private func formatSeconds(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let rest = seconds % 60
        return minutes > 0 ? "\(minutes):\(String(format: "%02d", rest))" : "\(seconds)秒"
    }
}

struct AlternativeCard: View {
    @EnvironmentObject private var viewModel: RecommendationViewModel
    let item: RecommendItem

    var body: some View {
        HStack(spacing: 12) {
            ProductImageFrame(
                url: item.displayImageURL(baseURL: viewModel.apiBaseURL),
                title: item.productName,
                size: .compact
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(item.productName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.dripInk)
                    .lineLimit(2)
                Text("\(item.chainNameJA) / マッチ \(Int((item.matchScore * 100).rounded()))%")
                    .font(.caption)
                    .foregroundStyle(Color.dripMutedStrong)
                Text([item.recipe.methodJA, item.roastLabelJA, item.priceText].compactMap { $0 }.joined(separator: " / "))
                    .font(.caption)
                    .foregroundStyle(Color.dripMutedStrong)
                    .lineLimit(2)
                Link("購入ページ", destination: item.buyURL)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.dripAccent)
            }
            Spacer()
        }
        .padding(12)
                .background(Color.dripSurface, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
    }
}

struct EmptyStateView: View {
    let mode: RecommendMode

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: mode == .mood ? "slider.horizontal.3" : "fork.knife")
                .font(.title2)
                .foregroundStyle(Color.dripAccent)
            Text(mode == .mood ? "スライダーを調整して提案を作成します。" : "食事を選ぶか入力して、相性の良い一杯を探します。")
                .font(.subheadline)
                .foregroundStyle(Color.dripMuted)
        }
        .sectionPanel()
    }
}

struct ErrorBanner: View {
    let message: String

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle")
            .font(.subheadline)
            .foregroundStyle(.red)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
}

enum ProductImageSize {
    case large
    case compact

    var frame: CGSize {
        switch self {
        case .large: CGSize(width: 0, height: 252)
        case .compact: CGSize(width: 82, height: 82)
        }
    }

    var imagePadding: CGFloat {
        switch self {
        case .large: 20
        case .compact: 8
        }
    }
}

struct ProductImageFrame: View {
    let url: URL?
    let title: String
    let size: ProductImageSize

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.dripSurface, Color.dripImageBase],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            if let url {
                RemoteImage(url: url, title: title, padding: size.imagePadding)
            } else {
                PlaceholderImage()
            }
        }
        .frame(
            maxWidth: size == .large ? .infinity : size.frame.width,
            minHeight: size.frame.height,
            maxHeight: size.frame.height
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(alignment: .bottomLeading) {
            if size == .large {
                Text(title)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .foregroundStyle(Color.dripInk)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(12)
            }
        }
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripSurface.opacity(0.82), lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(size == .large ? 0.12 : 0.07), radius: size == .large ? 14 : 5, y: size == .large ? 8 : 3)
        .accessibilityLabel(title)
    }
}

struct RemoteImage: View {
    let url: URL
    let title: String
    let padding: CGFloat
    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .padding(padding)
                    .transition(.opacity)
            } else if failed {
                PlaceholderImage()
            } else {
                ZStack {
                    ShimmerView()
                    ProgressView()
                }
            }
        }
        .task(id: url) {
            await load()
        }
        .accessibilityLabel(title)
    }

    private func load() async {
        image = nil
        failed = false

        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 DripLab/1.0", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 15
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200,
                  let loadedImage = UIImage(data: data) else {
                failed = true
                return
            }
            image = loadedImage
        } catch {
            failed = true
        }
    }
}

struct ResultBadge: View {
    let icon: String
    let text: String

    var body: some View {
        Label(text, systemImage: icon)
            .font(.caption.weight(.semibold))
            .foregroundStyle(Color.dripAccent)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(Color.dripHighlight, in: Capsule())
            .overlay {
                Capsule().stroke(Color.dripBorder, lineWidth: 1)
            }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 320
        var lineWidth: CGFloat = 0
        var lineHeight: CGFloat = 0
        var totalHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if lineWidth > 0 && lineWidth + spacing + size.width > maxWidth {
                totalHeight += lineHeight + spacing
                lineWidth = size.width
                lineHeight = size.height
            } else {
                lineWidth += (lineWidth > 0 ? spacing : 0) + size.width
                lineHeight = max(lineHeight, size.height)
            }
        }

        totalHeight += lineHeight
        return CGSize(width: maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var origin = bounds.origin
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if origin.x > bounds.minX && origin.x + size.width > bounds.maxX {
                origin.x = bounds.minX
                origin.y += lineHeight + spacing
                lineHeight = 0
            }
            subview.place(at: origin, proposal: ProposedViewSize(size))
            origin.x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}

struct AppFooterView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("詳しく選ぶ")
                .font(.headline)
                .foregroundStyle(Color.dripInk)
            Text("下部のフッターから、web版と同じ考え方で豆一覧・淹れ方・コーヒー知識を確認できます。推薦結果は価格、容量、風味タグ、ストーリー、購入先まで表示します。")
                .font(.subheadline)
                .foregroundStyle(Color.dripMutedStrong)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .background(Color.dripPanel, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
        .padding(.bottom, 18)
    }
}

struct FooterNavigationBar: View {
    var body: some View {
        HStack(spacing: 8) {
            FooterLink(title: "豆一覧", icon: "list.bullet.rectangle", destination: BeanCatalogView())
            FooterLink(title: "淹れ方", icon: "mug", destination: BrewMethodsView())
            FooterLink(title: "知識", icon: "book.closed", destination: CoffeeKnowledgeView())
        }
        .padding(.horizontal, 14)
        .padding(.top, 0)
        .padding(.bottom, 12)
        .background(Color.dripBackground)
    }
}

struct FooterLink<Destination: View>: View {
    let title: String
    let icon: String
    let destination: Destination

    var body: some View {
        NavigationLink {
            destination
        } label: {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.body.weight(.semibold))
                Text(title)
                    .font(.caption.weight(.bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(Color.dripInk)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.dripPanel, in: RoundedRectangle(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.dripBorderStrong, lineWidth: 1)
                }
        }
        .buttonStyle(.plain)
    }
}

struct BeanCatalogView: View {
    @State private var beans = BeanCatalogLoader.load()
    @State private var query = ""
    @State private var selectedChain: ChainID?

    private var filteredBeans: [BeanCatalogItem] {
        beans.filter { bean in
            let chainMatches = selectedChain == nil || bean.chainID == selectedChain
            let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return chainMatches }
            let haystack = [
                bean.displayName,
                bean.chainID.label,
                bean.roastLabelJA,
                bean.tasteLabelJA,
                bean.origin?.joined(separator: " "),
                bean.flavorTags?.joined(separator: " "),
                bean.processing
            ]
            .compactMap { $0 }
            .joined(separator: " ")
            return chainMatches && haystack.localizedCaseInsensitiveContains(trimmed)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(
                    title: "豆一覧",
                    lead: "web版と同じ347件の豆データを同梱しています。チェーン、商品名、産地、風味タグ、精製方法で探せます。"
                )

                VStack(alignment: .leading, spacing: 12) {
                    TextField("豆名・産地・風味で検索", text: $query)
                        .foregroundStyle(Color.dripInk)
                        .tint(Color.dripAccent)
                        .padding(12)
                        .background(Color.dripSurface, in: RoundedRectangle(cornerRadius: 8))
                        .overlay {
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.dripBorder, lineWidth: 1)
                        }

                    ChainPickerView(selection: $selectedChain)

                    Text("\(filteredBeans.count)件")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(Color.dripMutedStrong)
                }
                .sectionPanel()

                ForEach(filteredBeans.prefix(80)) { bean in
                    NavigationLink {
                        BeanCatalogDetailView(bean: bean)
                    } label: {
                        BeanCatalogCard(bean: bean)
                    }
                    .buttonStyle(.plain)
                }

                if filteredBeans.count > 80 {
                    Text("表示を軽くするため先頭80件を表示しています。検索またはチェーン絞り込みで対象を絞れます。")
                        .font(.footnote)
                        .foregroundStyle(Color.dripMutedStrong)
                        .padding(.horizontal, 4)
                }

            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct BeanCatalogCard: View {
    let bean: BeanCatalogItem

    var body: some View {
        HStack(spacing: 12) {
            ProductImageFrame(url: bean.bestImageURL, title: bean.displayName, size: .compact)

            VStack(alignment: .leading, spacing: 5) {
                Text(bean.chainID.label)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.dripAccent)
                Text(bean.displayName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.dripInk)
                    .lineLimit(2)
                Text(bean.metaText)
                    .font(.caption)
                    .foregroundStyle(Color.dripMutedStrong)
                    .lineLimit(2)
                if let tags = bean.flavorTags, !tags.isEmpty {
                    Text(tags.prefix(4).joined(separator: " / "))
                        .font(.caption)
                        .foregroundStyle(Color.dripMutedStrong)
                        .lineLimit(1)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(Color.dripBorderStrong)
        }
        .padding(12)
        .background(Color.dripPanel, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
    }
}

struct BeanCatalogDetailView: View {
    let bean: BeanCatalogItem
    @State private var selectedImageIndex = 0

    private var galleryImages: [URL] {
        Array(Set(([bean.bestImageURL].compactMap { $0 } + bean.extraImages)))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ProductImageFrame(
                    url: galleryImages.indices.contains(selectedImageIndex) ? galleryImages[selectedImageIndex] : bean.bestImageURL,
                    title: bean.displayName,
                    size: .large
                )

                if galleryImages.count > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Array(galleryImages.enumerated()), id: \.offset) { index, imageURL in
                                Button {
                                    selectedImageIndex = index
                                } label: {
                                    ProductImageFrame(url: imageURL, title: bean.displayName, size: .compact)
                                        .overlay {
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(index == selectedImageIndex ? Color.dripAccent : Color.clear, lineWidth: 3)
                                        }
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("商品画像 \(index + 1)")
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(bean.chainID.label)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.dripAccent)
                    Text(bean.displayName)
                        .font(.title2.bold())
                        .foregroundStyle(Color.dripInk)
                    Text(bean.metaText)
                        .font(.subheadline)
                        .foregroundStyle(Color.dripMutedStrong)
                }

                if let tasteLabel = bean.tasteLabelJA, !tasteLabel.isEmpty {
                    InfoBlock(title: "味わい", text: tasteLabel)
                }

                TasteProfileView(acidity: bean.acidity, bodyValue: bean.body, bitterness: bean.bitterness, sweetness: bean.sweetness)

                if let tags = bean.flavorTags, !tags.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("風味タグ")
                            .font(.headline)
                            .foregroundStyle(Color.dripInk)
                        FlowLayout(spacing: 8) {
                            ForEach(tags.prefix(10), id: \.self) { tag in
                                Text(tag)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(Color.dripAccent)
                                    .padding(.horizontal, 9)
                                    .padding(.vertical, 6)
                                    .background(Color.dripHighlight, in: Capsule())
                                    .overlay {
                                        Capsule().stroke(Color.dripBorder, lineWidth: 1)
                                    }
                            }
                        }
                    }
                    .sectionPanel()
                }

                if let origin = bean.origin, !origin.isEmpty {
                    InfoBlock(title: "産地", text: origin.joined(separator: " / "))
                }
                if let processing = bean.processing, processing != "不明" {
                    InfoBlock(title: "精製", text: processing)
                }
                if let coffeeType = bean.coffeeType {
                    InfoBlock(title: "種類", text: coffeeType)
                }
                if let episode = bean.episode {
                    InfoBlock(title: "この豆のストーリー", text: episode)
                }
                if let tasteNotes = bean.tasteNotes, tasteNotes != "不明", tasteNotes != bean.episode {
                    InfoBlock(title: "味わいの特徴", text: tasteNotes)
                }

                Link(destination: bean.buyURL) {
                    Label("購入ページへ", systemImage: "safari")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .tint(.dripAccent)

                if let episodeSource = bean.episodeSource {
                    Link(destination: episodeSource) {
                        Label("公式サイトの詳細", systemImage: "arrow.up.right.square")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.bordered)
                    .tint(.dripAccent)
                }
            }
            .padding(18)
        }
        .background(Color.dripBackground)
        .navigationTitle("豆詳細")
    }
}

struct TasteProfileView: View {
    let acidity: Int?
    let bodyValue: Int?
    let bitterness: Int?
    let sweetness: Int?

    private var rows: [(String, Int?)] {
        [("酸味", acidity), ("コク", bodyValue), ("苦味", bitterness), ("甘み", sweetness)]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("味覚プロファイル")
                .font(.headline)
                .foregroundStyle(Color.dripInk)
            ForEach(rows, id: \.0) { label, value in
                HStack(spacing: 10) {
                    Text(label)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(Color.dripMutedStrong)
                        .frame(width: 42, alignment: .leading)
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.dripBorder.opacity(0.45))
                            Capsule().fill(Color.dripAccent)
                                .frame(width: proxy.size.width * CGFloat((value ?? 0)) / 100)
                        }
                    }
                    .frame(height: 8)
                    Text(value.map(String.init) ?? "-")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(Color.dripMutedStrong)
                        .frame(width: 32, alignment: .trailing)
                }
            }
        }
        .sectionPanel()
    }
}

enum BeanCatalogLoader {
    private struct CatalogEnvelope: Decodable {
        let beans: [BeanCatalogItem]
    }

    static func load() -> [BeanCatalogItem] {
        guard let url = Bundle.main.url(forResource: "beans", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let catalog = try? JSONDecoder().decode(CatalogEnvelope.self, from: data) else {
            return []
        }
        return catalog.beans.sorted {
            let chain = $0.chainID.rawValue.localizedCompare($1.chainID.rawValue)
            if chain != .orderedSame { return chain == .orderedAscending }
            return $0.displayName.localizedCompare($1.displayName) == .orderedAscending
        }
    }
}

struct BeanInfoView: View {
    var body: some View {
        ScrollView {
            BeanInfoViewContent()
            .padding(18)
        }
        .background(Color.dripBackground)
        .navigationTitle("豆一覧")
        .toolbarColorScheme(.light, for: .navigationBar)
    }
}

struct BeanInfoViewContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            InfoGuideCard(
                icon: "building.2",
                title: "対応チェーン",
                text: "スターバックス、丸山珈琲、ドトール、タリーズ、カルディ、UCC、星乃珈琲、小川珈琲、猿田彦珈琲、ブルーボトル、サザコーヒーに対応しています。"
            )
            InfoGuideCard(
                icon: "tag",
                title: "表示される商品情報",
                text: "推薦結果にはチェーン名、商品名、マッチ度、焙煎度、価格、容量、風味タグ、味わいの特徴、豆のストーリー、購入ページを表示します。"
            )
            InfoGuideCard(
                icon: "flame",
                title: "焙煎度",
                text: "浅煎りは香りと酸の輪郭が出やすく、深煎りは苦味と厚みが出やすい傾向があります。迷ったら中煎りから始めると味の差を掴みやすいです。"
            )
            InfoGuideCard(
                icon: "map",
                title: "産地",
                text: "エチオピアやケニアは華やかさ、ブラジルはナッツ感、コロンビアはバランスの良さで選ばれることが多いです。産地は味の入口として使うと便利です。"
            )
            InfoGuideCard(
                icon: "sparkles",
                title: "風味タグ",
                text: "チョコ、ベリー、シトラスなどのタグは香りの方向を表します。甘いものと合わせるならチョコ・ナッツ、軽く飲むならシトラス・フローラルが目安です。"
            )
            InfoGuideCard(
                icon: "cart",
                title: "買う前の見方",
                text: "価格だけでなく内容量、挽き豆か豆のままか、販売ページの鮮度情報を見ます。迷ったら少量から試すのが失敗しにくいです。"
            )
        }
    }
}

struct BrewMethodsView: View {
    private let methods: [MethodGuide] = [
        MethodGuide(
            icon: "drop",
            title: "ハンドドリップ（V60）",
            summary: "豆の個性をクリアに引き出す定番の抽出法。",
            details: [
                "中挽きの粉を使い、蒸らしと複数回の注湯で香りを引き出します。",
                "浅煎りは高めの湯温、深煎りは少し低めの湯温が扱いやすいです。",
                "最後の一滴まで落とし切らず、雑味を避けます。"
            ]
        ),
        MethodGuide(
            icon: "circle.grid.cross",
            title: "フレンチプレス",
            summary: "油分とコクを残し、手軽に厚みのある味にできます。",
            details: [
                "粗挽きの粉にお湯を注ぎ、4分ほど浸してから押し下げます。",
                "ペーパーフィルターを使わないため、まろやかな質感が残ります。",
                "抽出後はすぐカップへ移し、過抽出を防ぎます。"
            ]
        ),
        MethodGuide(
            icon: "bolt",
            title: "エスプレッソ",
            summary: "短時間・高圧で濃縮する、ラテにも向く抽出法。",
            details: [
                "細挽きの粉を均一に詰め、25から30秒で少量を抽出します。",
                "深煎り豆との相性がよく、濃度とビター感が出やすいです。",
                "挽き目とタンピングの安定が味を大きく左右します。"
            ]
        ),
        MethodGuide(
            icon: "flame",
            title: "サイフォン",
            summary: "熱と真空で香りを立たせる、クリアな抽出法。",
            details: [
                "下球のお湯を上げ、粉を浸してから火を止めてろ過します。",
                "温度が安定しやすく、繊細な酸味とアロマを出しやすいです。",
                "浅煎りや華やかな産地の豆で個性が見えやすくなります。"
            ]
        )
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(
                    title: "淹れ方ガイド",
                    lead: "web版の淹れ方ページと同じく、DripLabが提案する4つの抽出法の特徴と手順を確認できます。推薦結果では豆に合わせた具体的な分量・湯温・時間も表示します。"
                )
                ForEach(methods) { method in
                    NavigationLink {
                        MethodDetailView(method: method)
                    } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            RemoteImage(url: method.heroURL, title: method.title, padding: 0)
                                .frame(maxWidth: .infinity)
                                .frame(height: 150)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            InfoGuideCard(icon: method.icon, title: method.title, text: method.summary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct CoffeeKnowledgeView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(
                    title: "コーヒーを知る",
                    lead: "産地・豆の種類・精製方法・焙煎度の違いを理解すると、推薦結果の理由や豆一覧の見方がより分かりやすくなります。"
                )
                NavigationLink {
                    OriginGuideView()
                } label: {
                    KnowledgeCategoryCard(
                    title: "産地ガイド",
                    count: "25項目",
                    summary: "エチオピア、ブラジル、コロンビアなど主要産地の特徴・風味・品種を整理します。"
                    )
                }
                .buttonStyle(.plain)
                NavigationLink {
                    KnowledgeDetailView(category: .varieties)
                } label: {
                    KnowledgeCategoryCard(
                    title: "豆の種類",
                    count: "11項目",
                    summary: "アラビカ・ロブスタ、シングルオリジン・ブレンド、代表的な品種を画像と商品例で比較します。"
                    )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("knowledge-varieties")
                NavigationLink {
                    KnowledgeDetailView(category: .processing)
                } label: {
                    KnowledgeCategoryCard(
                    title: "精製方法",
                    count: "5項目",
                    summary: "ウォッシュド、ナチュラル、ハニー、セミウォッシュド、アナエロビックを味への影響で見比べます。"
                    )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("knowledge-processing")
                NavigationLink {
                    KnowledgeDetailView(category: .roast)
                } label: {
                    KnowledgeCategoryCard(
                    title: "焙煎度",
                    count: "4項目",
                    summary: "浅煎りから深煎りまで、酸味・コク・苦味・香ばしさがどう変わるかを整理します。"
                    )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("knowledge-roast")
                InfoGuideCard(
                    icon: "drop",
                    title: "お湯の温度",
                    text: "高めの温度は香りと苦味が出やすく、低めの温度はやわらかくまとまりやすくなります。浅煎りは高め、深煎りは少し低めが扱いやすいです。"
                )
                InfoGuideCard(
                    icon: "timer",
                    title: "抽出時間",
                    text: "短すぎると軽く酸っぱく、長すぎると重く渋くなりがちです。味が薄い時は少し細かく、苦い時は少し粗くするのが基本です。"
                )
                InfoGuideCard(
                    icon: "scalemass",
                    title: "粉と湯量",
                    text: "ドリップでは粉1に対して湯15から16が扱いやすい比率です。濃くしたい時は粉を増やすより、まず湯量を少し減らすと調整しやすいです。"
                )
                InfoGuideCard(
                    icon: "cup.and.saucer",
                    title: "器具の違い",
                    text: "ハンドドリップは輪郭、フレンチプレスは質感、エスプレッソは濃度、サイフォンは香りの立ち上がりが出やすい器具です。"
                )
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct GuideHeader: View {
    let title: String
    let lead: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.largeTitle.bold())
                .foregroundStyle(Color.dripInk)
            Text(lead)
                .font(.subheadline)
                .foregroundStyle(Color.dripMutedStrong)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.bottom, 4)
    }
}

struct KnowledgeCategoryCard: View {
    let title: String
    let count: String
    let summary: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.dripInk)
                Spacer()
                Text(count)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.dripAccent)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(Color.dripHighlight, in: Capsule())
            }
            Text(summary)
                .font(.subheadline)
                .foregroundStyle(Color.dripMutedStrong)
                .fixedSize(horizontal: false, vertical: true)
        }
        .sectionPanel()
    }
}

struct MethodDetailView: View {
    let method: MethodGuide

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(title: method.title, lead: method.summary)
                RemoteImage(url: method.heroURL, title: method.title, padding: 0)
                    .frame(maxWidth: .infinity)
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                ForEach(Array(method.details.enumerated()), id: \.offset) { index, detail in
                    VStack(alignment: .leading, spacing: 8) {
                        RemoteImage(url: method.stepURL(index: index), title: "\(method.title) ステップ\(index + 1)", padding: 0)
                            .frame(maxWidth: .infinity)
                            .frame(height: 150)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        Text("ステップ\(index + 1)").font(.headline).foregroundStyle(Color.dripInk)
                        Text(detail).font(.subheadline).foregroundStyle(Color.dripMutedStrong)
                    }
                    .sectionPanel()
                }
                InfoGuideCard(icon: method.icon, title: "概要", text: method.summary)
                InfoGuideCard(icon: "sparkles", title: "特徴", text: method.details.joined(separator: "\n"))
                InfoGuideCard(icon: "lightbulb", title: "こんなときに", text: method.summary)
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

enum KnowledgeCategory {
    case origins, varieties, processing, roast

    var title: String {
        switch self {
        case .origins: "産地ガイド"
        case .varieties: "豆の種類"
        case .processing: "精製方法"
        case .roast: "焙煎度"
        }
    }

    var icon: String {
        switch self {
        case .origins: "map"
        case .varieties: "leaf"
        case .processing: "drop"
        case .roast: "flame"
        }
    }
}

struct KnowledgeDetailView: View {
    let category: KnowledgeCategory

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(title: category.title, lead: category.lead)
                if category == .roast {
                    RoastScaleView()
                }
                ForEach(category.items) { item in
                    NavigationLink {
                        KnowledgeGuideDetailView(category: category, item: item)
                    } label: {
                        KnowledgeImageCard(icon: category.icon, title: item.title, text: item.summary, imageURL: item.imageURL)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("knowledge-guide-\(item.id)")
                }
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct KnowledgeGuideItem: Identifiable {
    let id: String
    let title: String
    let summary: String
    let description: String
    let characteristics: [String]
    let flavorNotes: [String]
    let suitableFor: String
    let keywords: [String]
    let imageURL: URL?
    let steps: [String]

    var stepImageURLs: [URL] {
        steps.indices.compactMap { index in
            URL(string: "https://coffee.yutok.dev/processing/\(id)-step-\(index + 1).png")
        }
    }
}

private extension KnowledgeGuideItem {
    static func processing(_ id: String, _ title: String, _ summary: String, _ description: String, _ characteristics: [String], _ flavorNotes: [String], _ suitableFor: String, _ keywords: [String], _ steps: [String]) -> KnowledgeGuideItem {
        .init(id: id, title: title, summary: summary, description: description, characteristics: characteristics, flavorNotes: flavorNotes, suitableFor: suitableFor, keywords: keywords, imageURL: URL(string: "https://coffee.yutok.dev/processing/\(id)-hero.png"), steps: steps)
    }

    static func roast(_ id: String, _ title: String, _ summary: String, _ description: String, _ characteristics: [String], _ flavorNotes: [String], _ suitableFor: String, _ keywords: [String]) -> KnowledgeGuideItem {
        .init(id: id, title: title, summary: summary, description: description, characteristics: characteristics, flavorNotes: flavorNotes, suitableFor: suitableFor, keywords: keywords, imageURL: BeanCatalogLoader.load().first(where: { $0.roastLevel == id })?.bestImageURL, steps: [])
    }
}

struct KnowledgeGuideDetailView: View {
    let category: KnowledgeCategory
    let item: KnowledgeGuideItem

    private var relatedBeans: [BeanCatalogItem] {
        BeanCatalogLoader.load().filter { bean in
            let text = [
                bean.displayName,
                bean.description,
                bean.episode,
                bean.tasteNotes,
                bean.processing,
                bean.coffeeType,
                bean.roastLevel,
                bean.roastLabelJA,
                bean.origin?.joined(separator: " ")
            ]
            .compactMap { $0 }
            .joined(separator: " ")
            .localizedCaseInsensitiveContainsAny(item.keywords)
            return text
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let imageURL = item.imageURL {
                    RemoteImage(url: imageURL, title: item.title, padding: 0)
                        .frame(maxWidth: .infinity)
                        .frame(height: 220)
                        .background(Color.dripImageBase)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                GuideHeader(title: item.title, lead: item.summary)
                InfoGuideCard(icon: "book.closed", title: "概要", text: item.description)
                KnowledgeBulletCard(title: "特徴", icon: "sparkles", items: item.characteristics)
                KnowledgeBulletCard(title: "風味の傾向", icon: "leaf", items: item.flavorNotes)

                if !item.steps.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("工程")
                            .font(.headline)
                            .foregroundStyle(Color.dripInk)
                        ForEach(Array(item.steps.enumerated()), id: \.offset) { index, step in
                            VStack(alignment: .leading, spacing: 10) {
                                if item.stepImageURLs.indices.contains(index) {
                                    RemoteImage(
                                        url: item.stepImageURLs[index],
                                        title: "\(item.title) \(step)",
                                        padding: 0
                                    )
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 150)
                                    .background(Color.dripImageBase)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                                HStack(alignment: .top, spacing: 10) {
                                    Text("\(index + 1)")
                                        .font(.caption.bold())
                                        .foregroundStyle(.white)
                                        .frame(width: 24, height: 24)
                                        .background(Color.dripAccent, in: Circle())
                                    Text(step)
                                        .font(.subheadline)
                                        .foregroundStyle(Color.dripMutedStrong)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                    .sectionPanel()
                }

                InfoGuideCard(icon: "lightbulb", title: "こんなときに", text: item.suitableFor)
                RelatedKnowledgeBeansView(category: category, item: item, beans: relatedBeans)
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct KnowledgeBulletCard: View {
    let title: String
    let icon: String
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(Color.dripInk)
            ForEach(items, id: \.self) { item in
                Label(item, systemImage: "checkmark")
                    .font(.subheadline)
                    .foregroundStyle(Color.dripMutedStrong)
            }
        }
        .sectionPanel()
    }
}

struct RelatedKnowledgeBeansView: View {
    let category: KnowledgeCategory
    let item: KnowledgeGuideItem
    let beans: [BeanCatalogItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("DripLabの商品例")
                    .font(.headline)
                    .foregroundStyle(Color.dripInk)
                Spacer()
                Text("\(beans.count)件")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.dripAccent)
            }
            Text("このガイドに近い表記の商品です。画像を押すと豆の詳細を確認できます。")
                .font(.caption)
                .foregroundStyle(Color.dripMutedStrong)

            if beans.isEmpty {
                Text("現在のカタログに一致する商品はありません。豆一覧で名称や産地を検索してください。")
                    .font(.subheadline)
                    .foregroundStyle(Color.dripMutedStrong)
            } else {
                ForEach(beans.prefix(20)) { bean in
                    NavigationLink {
                        BeanCatalogDetailView(bean: bean)
                    } label: {
                        BeanCatalogCard(bean: bean)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .sectionPanel()
    }
}

private extension String {
    func localizedCaseInsensitiveContainsAny(_ values: [String]) -> Bool {
        values.contains { localizedCaseInsensitiveContains($0) }
    }
}

extension KnowledgeCategory {
    var lead: String {
        switch self {
        case .origins: return "産地・豆の種類・精製方法・焙煎度を、味わいと商品例を結び付けて確認できます。"
        case .varieties: return "植物としての種、品種、豆の組み方は別の情報です。画像と商品例で違いを整理します。"
        case .processing: return "精製方法は果実から生豆を取り出す工程です。同じ産地でも味わいを大きく変えます。"
        case .roast: return "焙煎度は酸味・甘み・コク・苦味のバランスを変えます。浅煎りから深煎りまで比較できます。"
        }
    }

    var items: [KnowledgeGuideItem] {
        let beans = BeanCatalogLoader.load()
        let image = beans.first?.bestImageURL
        switch self {
        case .origins:
            return []
        case .varieties:
            return [
                .init(id: "arabica", title: "アラビカ種", summary: "繊細な香りと明るい酸味。スペシャルティコーヒーの中心となる種です。", description: "アラビカ種（Coffea arabica）はエチオピア原産で、高地で育つことが多いコーヒー種です。ロブスタ種よりカフェインは少なめですが、酸味・香り・産地の個性が複雑に表れます。", characteristics: ["フルーティーで繊細な香り", "高地栽培が多い", "カフェインは比較的少なめ", "スペシャルティコーヒーの中心"], flavorNotes: ["フローラル", "柑橘", "チョコレート", "ナッツ"], suitableFor: "産地や品種ごとの香りを比べたいとき", keywords: ["アラビカ", "Arabica"], imageURL: image, steps: []),
                .init(id: "robusta", title: "ロブスタ種", summary: "コクと苦味、カフェインが強く、エスプレッソやブレンドに使われます。", description: "ロブスタ種（Coffea canephora）は低地でも育ちやすく、病害や暑さに比較的強い種です。厚いボディと強い苦味があり、エスプレッソのクレマやブレンドの力強さを支えます。", characteristics: ["コクと苦味が強い", "カフェインが多い", "低地で栽培しやすい", "エスプレッソやインスタントに利用"], flavorNotes: ["ビター", "穀物", "ナッツ", "ダークチョコ"], suitableFor: "濃厚なエスプレッソや力強いミルクドリンク", keywords: ["ロブスタ", "Robusta", "コンイロン"], imageURL: image, steps: []),
                .init(id: "single-origin", title: "シングルオリジン", summary: "単一の産地・農園・ロット。テロワールと精製の個性を楽しむタイプです。", description: "シングルオリジンは単一の産地や農園、収穫ロットの豆だけで仕上げたコーヒーです。季節や収穫年による変化も含め、産地と精製方法の違いをストレートに比較できます。", characteristics: ["産地や農園の個性が明確", "テロワールを比較できる", "収穫年で味が変わる", "浅煎りから中煎りと相性が良い"], flavorNotes: ["産地の個性", "季節感", "透明感", "複雑さ"], suitableFor: "産地ごとの違いをじっくり比べたいとき", keywords: ["シングル", "single origin", "単一産地"], imageURL: image, steps: []),
                .init(id: "blend", title: "ブレンド", summary: "複数の豆を組み合わせ、安定感や狙った味わいを設計します。", description: "ブレンドは複数の産地や品種を組み合わせたコーヒーです。酸味・甘み・コクなど異なる長所を重ね、季節による変動を抑えながらロースターの狙いを表現します。", characteristics: ["複数の豆を組み合わせる", "味わいが安定しやすい", "エスプレッソや深煎りにも向く", "ロースターの設計が表れる"], flavorNotes: ["バランス", "安定感", "コク", "香ばしさ"], suitableFor: "毎日飲みやすいバランスやミルクとの相性を求めるとき", keywords: ["ブレンド", "blend"], imageURL: image, steps: []),
                .init(id: "typica", title: "ティピカ", summary: "アラビカ種の古い基礎系統。繊細でクリーンな風味が特徴です。", description: "ティピカはアラビカ種の基礎となった古い系統で、世界各地の伝統品種の親になっています。収量は高くありませんが、高標高ではフローラルで透明感のある杯質を示します。", characteristics: ["古い基礎系統", "繊細でクリーン", "収量は比較的低い", "多くの品種の親系統"], flavorNotes: ["フローラル", "シトラス", "ナッツ", "クリーン"], suitableFor: "品種の系統や繊細な香りを楽しみたいとき", keywords: ["ティピカ", "Typica"], imageURL: image, steps: []),
                .init(id: "bourbon", title: "ブルボン", summary: "甘みとコクに優れ、カトゥーラなど多くの品種の親になった系統です。", description: "ブルボンはティピカと並ぶアラビカ種の基礎系統です。甘みと厚みのある風味を持ち、レッドブルボンやイエローブルボンなどの選抜・突然変異系統があります。", characteristics: ["甘みとコクに優れる", "中南米・東アフリカで栽培", "多くの派生品種の親", "収量と病害耐性には課題がある"], flavorNotes: ["ブラウンシュガー", "キャラメル", "赤い果実", "コク"], suitableFor: "甘みのある品種の違いを知りたいとき", keywords: ["ブルボン", "Bourbon", "ボルボン"], imageURL: image, steps: []),
                .init(id: "caturra", title: "カトゥーラ", summary: "ブルボン由来の矮性品種。収量と甘みのバランスで広く栽培されます。", description: "カトゥーラはブルボン系統から生まれた矮性の突然変異品種です。密植しやすく、栽培管理と杯質のバランスから中南米で広く使われています。", characteristics: ["ブルボン由来", "樹高が低く管理しやすい", "中南米で広く栽培", "甘みとバランスを出しやすい"], flavorNotes: ["キャラメル", "柑橘", "ナッツ", "バランス"], suitableFor: "中南米らしいバランスの良い豆を選ぶとき", keywords: ["カトゥーラ", "Caturra", "カツーラ"], imageURL: image, steps: []),
                .init(id: "catuai", title: "カトゥアイ", summary: "カトゥーラとムンドノーヴォの交配品種。安定した栽培と杯質を両立します。", description: "カトゥアイはカトゥーラとムンドノーヴォを交配した品種です。赤実型と黄実型があり、収量・樹形・品質のバランスからブラジルや中南米で普及しています。", characteristics: ["交配による矮性品種", "赤実型と黄実型がある", "収量が安定しやすい", "ブラジル・中南米で普及"], flavorNotes: ["ナッツ", "チョコレート", "穏やかな酸味", "甘み"], suitableFor: "飲みやすく安定した中煎りを探すとき", keywords: ["カトゥアイ", "Catuai", "Catuaí"], imageURL: image, steps: []),
                .init(id: "geisha", title: "ゲイシャ", summary: "華やかなフローラルと柑橘。高品質ロットで注目される品種です。", description: "ゲイシャ（Gesha）はエチオピア由来の系統で、パナマなどで高い評価を受けました。高標高・適切な精製・浅めの焙煎で、ジャスミンやベルガモットのような香りが際立ちます。", characteristics: ["華やかな香り", "高標高で個性が出やすい", "ロットと精製の影響が大きい", "浅煎りで香りを楽しみやすい"], flavorNotes: ["ジャスミン", "ベルガモット", "柑橘", "紅茶"], suitableFor: "香りの華やかさや特別なロットを楽しみたいとき", keywords: ["ゲイシャ", "ゲシャ", "Geisha", "Gesha"], imageURL: image, steps: []),
                .init(id: "sl28", title: "SL28・SL34", summary: "ケニアを代表する選抜品種。明るい酸味と厚みのある果実感が特徴です。", description: "SL28とSL34はケニアで選抜された代表的な品種です。カシスやトマト、柑橘を思わせる明るい酸味と、しっかりした甘み・ボディを持つロットが多くあります。", characteristics: ["ケニアを代表する選抜品種", "明るく複雑な酸味", "高地で栽培されることが多い", "ウォッシュドと相性が良い"], flavorNotes: ["カシス", "グレープフルーツ", "トマト", "黒糖"], suitableFor: "鮮やかな酸味と果実感を楽しみたいとき", keywords: ["SL28", "SL-28", "SL34", "SL-34"], imageURL: image, steps: []),
                .init(id: "pacamara", title: "パカマラ", summary: "パーカスとマラゴジッペの交配。大粒で複雑な香りと厚みがあります。", description: "パカマラはパーカスとマラゴジッペを交配した大粒の品種です。花や果実、スパイスのような複雑さと、しっかりした質感を持つ個性的なロットが知られています。", characteristics: ["大粒の品種", "複雑な香り", "厚みのある質感", "エルサルバドルなどで栽培"], flavorNotes: ["トロピカル", "フローラル", "スパイス", "チョコレート"], suitableFor: "個性的で厚みのあるスペシャルティを探すとき", keywords: ["パカマラ", "Pacamara"], imageURL: image, steps: [])
            ]
        case .processing:
            return [
                .processing("washed", "ウォッシュド（水洗式）", "果肉を除去して発酵・水洗。クリーンで明るい酸味が特徴です。", "収穫したチェリーから果肉を取り除き、粘膜を発酵または機械で除去してから水洗・乾燥します。豆本来の産地や品種の個性が透明感を持って表れやすい方法です。", ["クリーンで透明感がある", "明るい酸味", "産地・品種の個性が明確", "最も一般的な精製方法"], ["シトラス", "フローラル", "紅茶", "すっきり"], "産地の個性や明るい酸味を楽しみたいとき", ["ウォッシュド", "washed", "水洗"], ["収穫", "脱果肉", "発酵・水洗", "乾燥"]),
                .processing("natural", "ナチュラル（自然乾燥式）", "果実ごと乾燥。果実の甘みとベリー系の風味が強調されます。", "チェリーを果実のまま天日乾燥し、乾燥後に果皮と果肉を取り除きます。果実の糖分が豆に移り、甘みと発酵感、厚いボディが生まれます。", ["ベリーやドライフルーツ", "甘みが強い", "ボディが厚い", "発酵感が出ることがある"], ["ストロベリー", "ブルーベリー", "レーズン", "ワイン"], "果実感や甘みの強い浅煎りを楽しみたいとき", ["ナチュラル", "natural", "自然乾燥"], ["収穫・選別", "果実のまま乾燥", "翻転", "脱殻"]),
                .processing("honey", "ハニー（蜜処理）", "粘膜を残して乾燥。ナチュラルとウォッシュドの中間的な甘みです。", "脱果肉後に粘膜（パルプ）を残したまま乾燥します。粘膜の量を変えたホワイト・イエロー・レッド・ブラックハニーがあり、甘みとクリーンさのバランスを作れます。", ["甘みとボディのバランス", "ナチュラルよりクリーン", "ウォッシュドより甘い", "粘膜量で風味が変わる"], ["ハチミツ", "キャラメル", "黄桃", "やわらかな酸味"], "甘みとコクを両方楽しみたいとき", ["ハニー", "honey", "蜜処理"], ["収穫", "脱果肉", "粘膜を残して乾燥", "翻転・管理", "脱殻"]),
                .processing("semi-washed", "セミウォッシュド（半水洗）", "水洗と自然乾燥の中間。深いコクとスパイス感が特徴です。", "脱果肉後に短時間発酵させて乾燥する方法や、湿った状態で脱殻するスマトラ式があります。低めの酸味と重厚なボディが出やすい精製です。", ["深いコク", "重厚なボディ", "スパイスやハーブ", "酸味は控えめ"], ["ハーブ", "スパイス", "土", "ダークチョコ"], "深いコクやスマトラらしい風味を楽しみたいとき", ["セミウォッシュド", "semi-washed", "スマトラ", "半水洗"], ["収穫", "脱果肉", "短時間発酵・湿式脱殻", "乾燥", "選別"]),
                .processing("anaerobic", "アナエロビック（嫌気性発酵）", "密閉環境で発酵。ワインのような複雑で個性的な風味です。", "酸素を遮断したタンクで発酵させ、温度や時間を細かく管理します。一般的な精製方法より発酵由来の個性が強く、ロットごとの違いも大きい実験的な方法です。", ["ワインのような複雑さ", "トロピカルな香り", "発酵感とスパイス", "ロット差が大きい"], ["パッションフルーツ", "ワイン", "スパイス", "発酵感"], "個性的で実験的な浅煎りを試したいとき", ["アナエロビック", "anaerobic", "嫌気性", "嫌気性発酵"], ["収穫", "密閉発酵", "温度・時間管理", "乾燥", "選別"])
            ]
        case .roast:
            return [
                .roast("light", "浅煎り（ライトロースト）", "豆の個性と酸味を最大限に。産地・精製の風味が前面に出ます。", "約205°C前後で焙煎を止める浅煎りは、豆の産地・品種・精製方法が最もはっきり表れる焙煎度です。明るい酸味と香りを引き出しやすい一方、抽出条件の影響も受けやすくなります。", ["明るい酸味", "フルーティーな香り", "油分が出にくい", "産地の個性が明確"], ["ベリー", "柑橘", "フローラル", "紅茶"], "産地の個性をハンドドリップで楽しみたいとき", ["light", "浅煎り", "ライト"]),
                .roast("medium", "中煎り（ミディアムロースト）", "酸味とコクのバランス。最も飲みやすい定番の焙煎度です。", "約210〜220°Cで止める中煎りは、酸味・甘み・コクのバランスが良く、幅広い豆と抽出器具に合わせやすい焙煎です。日常の一杯の基準として扱いやすいでしょう。", ["酸味とコクのバランス", "甘みが出やすい", "抽出方法の幅が広い", "飲みやすい"], ["カラメル", "ナッツ", "チョコレート", "オレンジ"], "毎日飲みやすいバランスの豆を選びたいとき", ["medium", "中煎り", "ミディアム"]),
                .roast("medium_dark", "中深煎り（ミディアムダーク）", "コクとビターが増し、ミルクとの相性も良い焙煎度です。", "約225°C前後で止める中深煎りは、酸味が穏やかになり、香ばしさ・コク・甘いビター感が増します。カフェラテやフレンチプレスにも向いています。", ["コクとビターが増す", "酸味は穏やか", "やや油がにじむ", "ミルクと相性が良い"], ["ダークチョコ", "キャラメル", "ナッツ", "スモーク"], "しっかりしたコクやラテを楽しみたいとき", ["medium_dark", "中深煎り", "ミディアムダーク"]),
                .roast("dark", "深煎り（ダークロースト）", "強いビターと香ばしさ。エスプレッソやアイスコーヒー向きです。", "約230°C以上で止める深煎りは、酸味よりも苦味・厚み・スモーキーな香ばしさが前面に出ます。産地の繊細な個性より、焙煎による力強さを楽しむ焙煎度です。", ["強いビター", "スモーキーな香ばしさ", "表面に油が出やすい", "エスプレッソ向き"], ["ビターチョコ", "ローストナッツ", "スモーク", "カカオ"], "濃厚なエスプレッソやアイスコーヒーを楽しみたいとき", ["dark", "深煎り", "ダーク"])
            ]
        }
    }
}

struct KnowledgeImageCard: View {
    let icon: String
    let title: String
    let text: String
    let imageURL: URL?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let imageURL {
                RemoteImage(url: imageURL, title: title, padding: 0)
                    .frame(maxWidth: .infinity)
                    .frame(height: 150)
                    .background(Color.dripImageBase)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(Color.dripAccent, in: RoundedRectangle(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(Color.dripInk)
                    Text(text)
                        .font(.subheadline)
                        .foregroundStyle(Color.dripMutedStrong)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(12)
        }
        .background(Color.dripPanel, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.dripBorder, lineWidth: 1)
        }
    }
}

struct RoastScaleView: View {
    private let levels = ["浅煎り", "中煎り", "中深煎り", "深煎り"]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("焙煎度の目安")
                .font(.headline)
                .foregroundStyle(Color.dripInk)
            HStack(spacing: 6) {
                ForEach(Array(levels.enumerated()), id: \.offset) { index, level in
                    VStack(spacing: 6) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.brown.opacity(0.25 + Double(index) * 0.18))
                            .frame(height: 14)
                        Text(level)
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Color.dripMutedStrong)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .sectionPanel()
    }
}

struct MethodGuide: Identifiable {
    var id: String { title }
    let icon: String
    let title: String
    let summary: String
    let details: [String]

    var assetKey: String {
        switch title {
        case "ハンドドリップ（V60）": "drip"
        case "フレンチプレス": "french-press"
        case "エスプレッソ": "espresso"
        default: "siphon"
        }
    }

    var heroURL: URL {
        URL(string: "https://coffee.yutok.dev/methods/method-\(assetKey).png")!
    }

    func stepURL(index: Int) -> URL {
        let name = assetKey == "drip" ? "drip-step-\(index + 1)-\(["setup", "bloom", "pour", "done"][index])" : "\(assetKey)-step-\(index + 1)"
        return URL(string: "https://coffee.yutok.dev/methods/\(name).png")!
    }
}

struct InfoGuideCard: View {
    let icon: String
    let title: String
    let text: String

    var bodyView: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 34, height: 34)
                .background(Color.dripAccent, in: RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.dripInk)
                Text(text)
                    .font(.subheadline)
                    .foregroundStyle(Color.dripMutedStrong)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .sectionPanel()
    }

    var body: some View {
        bodyView
    }
}

struct PlaceholderImage: View {
    var body: some View {
        ZStack {
            Color.dripImageBase
            Image(systemName: "cup.and.saucer.fill")
                .font(.title)
                .foregroundStyle(Color.dripAccent.opacity(0.65))
        }
    }
}

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var viewModel: RecommendationViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("API") {
                    TextField("Base URL", text: $viewModel.apiBaseURLDraft)
                        .foregroundStyle(Color.dripInk)
                        .tint(Color.dripAccent)
                    Button("本番URLに戻す") {
                        viewModel.resetAPIBaseURL()
                    }
                }
                Section {
                    Text("ローカルのNext.jsへ接続する場合は、iPhoneから見えるMacのLAN IPを使います。例: http://192.168.1.10:3000")
                        .font(.footnote)
                        .foregroundStyle(Color.dripMutedStrong)
                }
            }
            .navigationTitle("設定")
            .toolbarColorScheme(.light, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        viewModel.saveAPIBaseURL()
                        dismiss()
                    }
                }
            }
        }
    }
}

extension View {
    func sectionPanel() -> some View {
        self
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.dripPanel, in: RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.dripBorder, lineWidth: 1)
            }
            .shadow(color: Color.black.opacity(0.05), radius: 10, y: 4)
    }
}

extension Color {
    static let dripBackground = Color.white
    static let dripPanel = Color.white
    static let dripSurface = Color.white
    static let dripHighlight = Color(red: 0.93, green: 0.88, blue: 0.83)
    static let dripImageBase = Color(red: 0.91, green: 0.86, blue: 0.80)
    static let dripBorder = Color(red: 0.82, green: 0.77, blue: 0.72)
    static let dripBorderStrong = Color(red: 0.58, green: 0.50, blue: 0.44)
    static let dripInk = Color.black
    static let dripMuted = Color(red: 0.30, green: 0.28, blue: 0.26)
    static let dripMutedStrong = Color(red: 0.16, green: 0.14, blue: 0.12)
    static let dripAccent = Color(red: 0.25, green: 0.13, blue: 0.06)
}

private extension RecommendItem {
    var priceText: String? {
        priceJPY.map { "¥\($0.formatted(.number.grouping(.automatic)))" }
    }

    var weightText: String? {
        weightG.map { "\($0)g" }
    }

    var roastLevelLabel: String? {
        switch roastLevel {
        case "light": "浅煎り"
        case "medium": "中煎り"
        case "medium_dark": "中深煎り"
        case "dark": "深煎り"
        case .some(let value): value
        case .none: nil
        }
    }

    var productMeta: [String] {
        [priceText, weightText].compactMap { $0 }
    }

    func displayImageURL(baseURL: URL) -> URL? {
        if let imageURL, imageURL.scheme != nil {
            return imageURL
        }
        if let imageURL {
            return URL(string: imageURL.relativeString, relativeTo: baseURL)?.absoluteURL
        }
        if let fallback = imageFallbackURLs?.first(where: { $0.scheme != nil }) {
            return fallback
        }
        if let fallback = imageFallbackURL, fallback.scheme != nil {
            return fallback
        }
        return nil
    }
}

private extension BeanCatalogItem {
    var bestImageURL: URL? {
        imageCDNURL ?? imageURL
    }

    var priceText: String? {
        priceJPY.map { "¥\($0.formatted(.number.grouping(.automatic)))" }
    }

    var weightText: String? {
        weightG.map { "\($0)g" }
    }

    var roastText: String? {
        if let roastLabelJA { return roastLabelJA }
        switch roastLevel {
        case "light": return "浅煎り"
        case "medium": return "中煎り"
        case "medium_dark": return "中深煎り"
        case "dark": return "深煎り"
        case .some(let value): return value
        case .none: return nil
        }
    }

    var metaText: String {
        [roastText, priceText, weightText, processing].compactMap { $0 }.joined(separator: " / ")
    }
}
