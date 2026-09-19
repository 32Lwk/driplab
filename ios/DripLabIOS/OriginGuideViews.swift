import SwiftUI

struct OriginGuideItem: Identifiable {
    let id: String
    let name: String
    let region: String
    let summary: String
    let notes: [String]
    let latitude: Double
    let longitude: Double

    var flagURL: URL? {
        URL(string: "https://coffee.yutok.dev/learn/flags/\(id).png")
    }
}

private let originGuides: [OriginGuideItem] = [
    .init(id: "ethiopia", name: "エチオピア", region: "アフリカ", summary: "華やかなフローラル、柑橘、紅茶のような香り。", notes: ["明るい酸味", "ベリー・柑橘", "ナチュラルとウォッシュド"], latitude: 9.145, longitude: 40.489),
    .init(id: "kenya", name: "ケニア", region: "アフリカ", summary: "カシスやベリーを思わせる鮮やかな酸味。", notes: ["ジューシーな酸味", "ベリー", "高い透明感"], latitude: 0.023, longitude: 37.906),
    .init(id: "brazil", name: "ブラジル", region: "中南米", summary: "ナッツ、チョコレート、穏やかな酸味のバランス型。", notes: ["ナッツ・チョコ", "まろやかなコク", "ブレンドの土台"], latitude: -14.235, longitude: -51.925),
    .init(id: "colombia", name: "コロンビア", region: "中南米", summary: "明るい酸味と甘みのバランスがよく、地域差も豊か。", notes: ["バランス", "キャラメルの甘み", "幅広い焙煎"], latitude: 4.571, longitude: -74.297),
    .init(id: "guatemala", name: "グアテマラ", region: "中南米", summary: "チョコレートのコクと柑橘系の酸味が共存。", notes: ["チョコ・スパイス", "しっかりしたコク", "火山性土壌"], latitude: 15.784, longitude: -90.230),
    .init(id: "costa-rica", name: "コスタリカ", region: "中南米", summary: "クリーンで甘く、ハニー精製でも知られる産地。", notes: ["ハチミツの甘み", "クリーン", "明るい酸味"], latitude: 9.748, longitude: -83.753),
    .init(id: "indonesia", name: "インドネシア", region: "アジア・大洋州", summary: "深いコク、ハーブ、スパイス感のある個性的な味わい。", notes: ["重厚なボディ", "ハーブ・スパイス", "スマトラ式"], latitude: -0.789, longitude: 113.921),
    .init(id: "panama", name: "パナマ", region: "中南米", summary: "ゲイシャなど華やかな品種と高い標高で知られる産地。", notes: ["ジャスミン", "トロピカル", "繊細な甘み"], latitude: 8.538, longitude: -80.782),
    .init(id: "tanzania", name: "タンザニア", region: "アフリカ", summary: "キリマンジャロを代表とする、柑橘系の明るい酸味。", notes: ["シトラス", "すっきりした後口", "高地栽培"], latitude: -6.4, longitude: 34.9),
    .init(id: "rwanda", name: "ルワンダ", region: "アフリカ", summary: "紅茶や赤い果実を思わせる、透明感のある甘い酸味。", notes: ["赤い果実", "紅茶", "クリーン"], latitude: -1.94, longitude: 29.87),
    .init(id: "uganda", name: "ウガンダ", region: "アフリカ", summary: "果実の甘みとしっかりしたボディを楽しめる産地。", notes: ["ベリー", "チョコレート", "コク"], latitude: 1.4, longitude: 32.3),
    .init(id: "burundi", name: "ブルンジ", region: "アフリカ", summary: "柑橘やベリーの香りと、明るく複雑な酸味。", notes: ["柑橘", "ベリー", "華やか"], latitude: -3.4, longitude: 29.9),
    .init(id: "zambia", name: "ザンビア", region: "アフリカ", summary: "フローラルな香りと穏やかな果実味を持つ産地。", notes: ["フローラル", "果実味", "やわらかな酸味"], latitude: -13.1, longitude: 27.8),
    .init(id: "honduras", name: "ホンジュラス", region: "中南米", summary: "チョコレートやキャラメルの甘みと、穏やかな酸味。", notes: ["キャラメル", "チョコ", "バランス"], latitude: 15.2, longitude: -86.2),
    .init(id: "peru", name: "ペルー", region: "中南米", summary: "やわらかな酸味とナッツの甘みを持つ山岳産地。", notes: ["ナッツ", "ブラウンシュガー", "穏やか"], latitude: -9.2, longitude: -75.0),
    .init(id: "mexico", name: "メキシコ", region: "中南米", summary: "チョコレートやナッツの甘み、軽やかな酸味。", notes: ["チョコ", "ナッツ", "軽やか"], latitude: 23.6, longitude: -102.5),
    .init(id: "el-salvador", name: "エルサルバドル", region: "中南米", summary: "ハチミツのような甘みと、丸みのある味わい。", notes: ["ハチミツ", "キャラメル", "まろやか"], latitude: 13.7, longitude: -88.9),
    .init(id: "jamaica", name: "ジャマイカ", region: "中南米", summary: "ブルーマウンテンで知られる、調和の取れた上品な味わい。", notes: ["バランス", "ナッツ", "なめらか"], latitude: 18.1, longitude: -77.3),
    .init(id: "nicaragua", name: "ニカラグア", region: "中南米", summary: "カカオやキャラメルの甘みと、穏やかな酸味。", notes: ["カカオ", "キャラメル", "丸いコク"], latitude: 12.9, longitude: -85.2),
    .init(id: "bolivia", name: "ボリビア", region: "中南米", summary: "高地らしい透明感と、柑橘・チョコの風味。", notes: ["柑橘", "チョコ", "高地"], latitude: -16.3, longitude: -63.6),
    .init(id: "vietnam", name: "ベトナム", region: "アジア・大洋州", summary: "ロブスタを中心に、力強い苦味と厚いコク。", notes: ["ロースト感", "濃いコク", "ロブスタ"], latitude: 14.0, longitude: 108.0),
    .init(id: "yemen", name: "イエメン", region: "アジア・大洋州", summary: "ワインやドライフルーツを思わせる複雑な風味。", notes: ["ワイン感", "ドライフルーツ", "個性的"], latitude: 15.5, longitude: 48.5),
    .init(id: "usa", name: "アメリカ（ハワイ）", region: "アジア・大洋州", summary: "ハワイ・コナで知られる、穏やかで上品な酸味。", notes: ["ナッツ", "やわらかな酸味", "クリーン"], latitude: 19.9, longitude: -155.5),
    .init(id: "japan", name: "日本", region: "アジア・大洋州", summary: "沖縄や小笠原などで試みられる、希少な国産コーヒー。", notes: ["希少", "やさしい甘み", "国産"], latitude: 35.7, longitude: 138.0),
    .init(id: "papua-new-guinea", name: "パプアニューギニア", region: "アジア・大洋州", summary: "フルーティーな酸味と、チョコレートのようなコク。", notes: ["果実味", "チョコ", "高地"], latitude: -6.0, longitude: 147.0)
]

struct OriginGuideView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                GuideHeader(title: "産地ガイド", lead: "Web版と同じく、地図から産地を探し、国旗・風味・DripLabで取り扱う豆を確認できます。")
                OriginMapView()
                ForEach(Dictionary(grouping: originGuides, by: \.region).keys.sorted(), id: \.self) { region in
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text(region).font(.title3.bold()).foregroundStyle(Color.dripInk)
                            Spacer()
                            Text("\(originGuides.filter { $0.region == region }.count)産地")
                                .font(.caption.bold()).foregroundStyle(Color.dripAccent)
                        }
                        ForEach(originGuides.filter { $0.region == region }) { origin in
                            NavigationLink {
                                OriginDetailView(origin: origin)
                            } label: {
                                OriginGuideCard(origin: origin)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(18)
        }
        .background(Color.dripBackground)
    }
}

struct OriginMapView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var activeRegion: String?
    @State private var markerPulse = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("世界のコーヒー産地マップ")
                .font(.headline)
                .foregroundStyle(Color.dripInk)
            Text("マーカーをタップすると各産地の詳細へ移動します。")
                .font(.subheadline)
                .foregroundStyle(Color.dripMutedStrong)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    OriginRegionChip(title: "すべて", selected: activeRegion == nil) {
                        withAnimation(.snappy) { activeRegion = nil }
                    }
                    ForEach(Array(Set(originGuides.map(\.region))).sorted(), id: \.self) { region in
                        OriginRegionChip(title: region, selected: activeRegion == region) {
                            withAnimation(.snappy) {
                                activeRegion = activeRegion == region ? nil : region
                            }
                        }
                    }
                }
            }
            GeometryReader { proxy in
                ZStack(alignment: .topLeading) {
                    Image("OriginMap")
                        .resizable()
                        .scaledToFill()
                        .frame(width: proxy.size.width, height: proxy.size.height)

                    Rectangle()
                        .fill(Color.dripAccent.opacity(0.08))
                        .frame(height: proxy.size.height * 0.26)
                        .offset(y: proxy.size.height * 0.37)

                    ForEach(originGuides) { origin in
                        NavigationLink {
                            OriginDetailView(origin: origin)
                        } label: {
                            Circle()
                                .fill(Color.dripAccent)
                                .frame(width: 13, height: 13)
                                .overlay(Circle().stroke(Color.white, lineWidth: 2))
                                .scaleEffect(markerPulse && (activeRegion == nil || activeRegion == origin.region) ? 1.15 : 1)
                                .shadow(color: Color.dripAccent.opacity(0.35), radius: markerPulse ? 6 : 2)
                                .opacity(activeRegion == nil || activeRegion == origin.region ? 1 : 0.18)
                        }
                        .buttonStyle(.plain)
                        .position(mapPoint(origin, in: proxy.size))
                        .accessibilityLabel("\(origin.name)の産地ガイド")
                    }

                    Text("コーヒーベルト")
                        .font(.caption2.bold())
                        .foregroundStyle(Color.dripAccent)
                        .padding(6)
                        .background(Color.white.opacity(0.9), in: Capsule())
                        .position(x: proxy.size.width * 0.78, y: proxy.size.height * 0.38)
                }
            }
            .aspectRatio(2, contentMode: .fit)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    markerPulse = true
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .sectionPanel()
    }

    private func mapPoint(_ origin: OriginGuideItem, in size: CGSize) -> CGPoint {
        CGPoint(
            x: (origin.longitude + 180) / 360 * size.width,
            y: (90 - origin.latitude) / 180 * size.height
        )
    }
}

private struct OriginRegionChip: View {
    let title: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            DripHaptics.selection()
            action()
        } label: {
            Text(title)
        }
            .font(.caption.weight(.semibold))
            .foregroundStyle(selected ? .white : Color.dripInk)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(selected ? Color.dripAccent : Color.white, in: Capsule())
            .overlay { Capsule().stroke(Color.dripBorder, lineWidth: selected ? 0 : 1) }
            .buttonStyle(DripPressableButtonStyle())
    }
}

struct OriginGuideCard: View {
    let origin: OriginGuideItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            RemoteImage(url: origin.flagURL ?? URL(string: "https://coffee.yutok.dev")!, title: "\(origin.name)の国旗", padding: 0)
                .frame(width: 84, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 6))
            VStack(alignment: .leading, spacing: 5) {
                Text(origin.name).font(.headline).foregroundStyle(Color.dripInk)
                Text(origin.summary).font(.subheadline).foregroundStyle(Color.dripMutedStrong).lineLimit(2)
                Text(origin.notes.joined(separator: " · ")).font(.caption).foregroundStyle(Color.dripAccent).lineLimit(1)
            }
        }
        .sectionPanel()
    }
}

struct OriginDetailView: View {
    let origin: OriginGuideItem
    private var beans: [BeanCatalogItem] {
        let tokens = [origin.name, origin.id, origin.name.replacingOccurrences(of: "コロンビア", with: "Colombia")]
        return BeanCatalogLoader.load().filter { bean in
            let text = ([bean.displayName] + (bean.origin ?? []) + (bean.flavorTags ?? [])).joined(separator: " ")
            return tokens.contains { text.localizedCaseInsensitiveContains($0) }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    RemoteImage(url: origin.flagURL ?? URL(string: "https://coffee.yutok.dev")!, title: "\(origin.name)の国旗", padding: 0)
                        .frame(width: 96, height: 64)
                    VStack(alignment: .leading) {
                        Text(origin.region).font(.caption.bold()).foregroundStyle(Color.dripAccent)
                        Text(origin.name).font(.title.bold()).foregroundStyle(Color.dripInk)
                    }
                }
                .sectionPanel()
                InfoGuideCard(icon: "map", title: "特徴", text: origin.summary)
                InfoGuideCard(icon: "sparkles", title: "風味の目安", text: origin.notes.joined(separator: "\n"))
                VStack(alignment: .leading, spacing: 10) {
                    Text("DripLabで取り扱う\(origin.name)産の豆").font(.headline).foregroundStyle(Color.dripInk)
                    Text("\(beans.count)件").font(.caption.bold()).foregroundStyle(Color.dripAccent)
                    if beans.isEmpty {
                        Text("現在のカタログでは産地表記を確認できる商品がありません。")
                            .font(.subheadline).foregroundStyle(Color.dripMutedStrong)
                    } else {
                        ForEach(beans.prefix(30)) { bean in
                            NavigationLink { BeanCatalogDetailView(bean: bean) } label: { BeanCatalogCard(bean: bean) }
                                .buttonStyle(.plain)
                        }
                    }
                }
                .sectionPanel()
            }
            .padding(18)
        }
        .background(Color.dripBackground)
        .navigationTitle(origin.name)
    }
}
