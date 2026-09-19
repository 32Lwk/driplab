import Foundation

enum RecommendMode: String, CaseIterable, Identifiable, Codable {
    case mood
    case pairing

    var id: String { rawValue }

    var label: String {
        switch self {
        case .mood: "気分"
        case .pairing: "食事"
        }
    }
}

enum ChainID: String, CaseIterable, Identifiable, Codable {
    case starbucks
    case maruyama
    case doutor
    case tullys
    case kaldi
    case ucc
    case hoshino
    case ogawa
    case sarutahiko
    case bluebottle
    case saza

    var id: String { rawValue }

    var label: String {
        switch self {
        case .starbucks: "スターバックス"
        case .maruyama: "丸山珈琲"
        case .doutor: "ドトール"
        case .tullys: "タリーズ"
        case .kaldi: "カルディ"
        case .ucc: "UCC"
        case .hoshino: "星乃珈琲"
        case .ogawa: "小川珈琲"
        case .sarutahiko: "猿田彦珈琲"
        case .bluebottle: "ブルーボトル"
        case .saza: "サザコーヒー"
        }
    }
}

enum ReadjustDirection: String, CaseIterable, Identifiable, Codable {
    case moreAcidity = "more_acidity"
    case lessBitterness = "less_bitterness"
    case stronger
    case lighter

    var id: String { rawValue }

    var label: String {
        switch self {
        case .moreAcidity: "酸味を足す"
        case .lessBitterness: "苦味を抑える"
        case .stronger: "濃いめ"
        case .lighter: "軽め"
        }
    }
}

struct MoodProfile: Codable, Equatable {
    var alertness: Int = 50
    var acidityPref: Int = 50
    var bodyPref: Int = 50
    var sweetnessPref: Int = 50

    enum CodingKeys: String, CodingKey {
        case alertness
        case acidityPref = "acidity_pref"
        case bodyPref = "body_pref"
        case sweetnessPref = "sweetness_pref"
    }
}

struct RecommendRequest: Codable {
    let mood: MoodProfile
    let chains: [ChainID]?
}

struct PairingRequest: Codable {
    let foodPresetID: String?
    let foodText: String?
    let chains: [ChainID]?

    enum CodingKeys: String, CodingKey {
        case foodPresetID = "food_preset_id"
        case foodText = "food_text"
        case chains
    }
}

struct ReadjustRequest: Codable {
    let mode: String
    let direction: ReadjustDirection
    let fixedBeanID: String?
    let mood: MoodProfile?
    let foodPresetID: String?
    let foodText: String?
    let chains: [ChainID]?

    enum CodingKeys: String, CodingKey {
        case mode
        case direction
        case fixedBeanID = "fixed_bean_id"
        case mood
        case foodPresetID = "food_preset_id"
        case foodText = "food_text"
        case chains
    }
}

struct RecommendResponse: Codable {
    let primary: RecommendItem
    let alternatives: [RecommendItem]
    let otherRecipes: [BrewRecipe]?

    enum CodingKeys: String, CodingKey {
        case primary
        case alternatives
        case otherRecipes = "other_recipes"
    }
}

struct PairingResponse: Codable {
    let primary: RecommendItem
    let alternatives: [RecommendItem]
    let otherRecipes: [BrewRecipe]?
    let foodPresetID: String?
    let foodLabel: String

    enum CodingKeys: String, CodingKey {
        case primary
        case alternatives
        case otherRecipes = "other_recipes"
        case foodPresetID = "food_preset_id"
        case foodLabel = "food_label"
    }
}

struct ReadjustResponse: Codable {
    let result: RecommendResponse
}

struct ReadjustPairingResponse: Codable {
    let result: PairingResponse
}

struct RecommendItem: Codable, Identifiable {
    var id: String { beanID }

    let beanID: String
    let chainID: ChainID
    let chainNameJA: String
    let productName: String
    let description: String?
    let roastLevel: String?
    let roastLabelJA: String?
    let flavorTags: [String]?
    let priceJPY: Int?
    let weightG: Int?
    let buyURL: URL
    let imageURL: URL?
    let imageFallbackURL: URL?
    let imageFallbackURLs: [URL]?
    let matchScore: Double
    let beanScore: Double?
    let equipmentScore: Double?
    let recommendedEquipment: String
    let episode: String?
    let episodeSource: URL?
    let tasteNotes: String?
    let processing: String?
    let recipe: BrewRecipe
    let reason: String
    let reasonParts: ReasonParts?
    let pairingReason: String?
    let foodLabel: String?

    enum CodingKeys: String, CodingKey {
        case beanID = "bean_id"
        case chainID = "chain_id"
        case chainNameJA = "chain_name_ja"
        case productName = "product_name"
        case description
        case roastLevel = "roast_level"
        case roastLabelJA = "roast_label_ja"
        case flavorTags = "flavor_tags"
        case priceJPY = "price_jpy"
        case weightG = "weight_g"
        case buyURL = "buy_url"
        case imageURL = "image_url"
        case imageFallbackURL = "image_fallback_url"
        case imageFallbackURLs = "image_fallback_urls"
        case matchScore = "match_score"
        case beanScore = "bean_score"
        case equipmentScore = "equipment_score"
        case recommendedEquipment = "recommended_equipment"
        case episode
        case episodeSource = "episode_source"
        case tasteNotes = "taste_notes"
        case processing
        case recipe
        case reason
        case reasonParts = "reason_parts"
        case pairingReason = "pairing_reason"
        case foodLabel = "food_label"
    }
}

struct ReasonParts: Codable {
    let moodSummary: String?
    let foodSummary: String?
    let beanFit: String?
    let brewFit: String?

    enum CodingKeys: String, CodingKey {
        case moodSummary = "mood_summary"
        case foodSummary = "food_summary"
        case beanFit = "bean_fit"
        case brewFit = "brew_fit"
    }
}

struct BrewRecipe: Codable, Identifiable {
    var id: String { "\(method)-\(coffeeG)-\(waterML ?? yieldML ?? 0)-\(timeSec)" }

    let method: String
    let methodJA: String
    let grind: String
    let grindJA: String
    let coffeeG: Int
    let waterML: Int?
    let yieldML: Int?
    let waterTempC: Int
    let timeSec: Int
    let bloomML: Int?
    let bloomSec: Int?
    let steps: [String]?
    let notes: String?
    let referenceURL: URL?
    let suitabilityNote: String?

    enum CodingKeys: String, CodingKey {
        case method
        case methodJA = "method_ja"
        case grind
        case grindJA = "grind_ja"
        case coffeeG = "coffee_g"
        case waterML = "water_ml"
        case yieldML = "yield_ml"
        case waterTempC = "water_temp_c"
        case timeSec = "time_sec"
        case bloomML = "bloom_ml"
        case bloomSec = "bloom_sec"
        case steps
        case notes
        case referenceURL = "reference_url"
        case suitabilityNote = "suitability_note"
    }
}

struct BeanCatalogItem: Decodable, Identifiable {
    let id: String
    let chainID: ChainID
    let displayName: String
    let description: String?
    let roastLevel: String?
    let roastLabelJA: String?
    let tasteLabelJA: String?
    let origin: [String]?
    let originCountries: [String]?
    let extraImages: [URL]
    let flavorTags: [String]?
    let acidity: Int?
    let body: Int?
    let bitterness: Int?
    let sweetness: Int?
    let priceJPY: Int?
    let weightG: Int?
    let buyURL: URL
    let imageURL: URL?
    let imageCDNURL: URL?
    let episode: String?
    let episodeSource: URL?
    let tasteNotes: String?
    let processing: String?
    let coffeeType: String?

    enum CodingKeys: String, CodingKey {
        case id
        case productID = "product_id"
        case chainID = "chain_id"
        case name
        case displayName = "display_name"
        case ogDescription = "og_description"
        case description
        case roastLevel = "roast_level"
        case roastLabelJA = "roast_label_ja"
        case tasteLabelJA = "taste_label_ja"
        case origin
        case originCountries = "origin_countries"
        case flavorTags = "flavor_tags"
        case acidity
        case body
        case bitterness
        case sweetness
        case priceJPY = "price_jpy"
        case weightG = "weight_g"
        case buyURL = "buy_url"
        case imageURL = "image_url"
        case imageCDNURL = "image_cdn_url"
        case extraImages = "extra_images"
        case episode
        case episodeSource = "episode_source"
        case tasteNotes = "taste_notes"
        case processing
        case coffeeType = "coffee_type"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let productID = Self.decodeInt(from: container, forKey: .productID)
        id = try container.decodeIfPresent(String.self, forKey: .id) ?? productID.map(String.init) ?? UUID().uuidString
        chainID = try container.decode(ChainID.self, forKey: .chainID)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
            ?? container.decodeIfPresent(String.self, forKey: .name)
            ?? "名称未設定"
        description = try container.decodeIfPresent(String.self, forKey: .description)
            ?? container.decodeIfPresent(String.self, forKey: .ogDescription)
        roastLevel = try container.decodeIfPresent(String.self, forKey: .roastLevel)
        roastLabelJA = try container.decodeIfPresent(String.self, forKey: .roastLabelJA)
        tasteLabelJA = try container.decodeIfPresent(String.self, forKey: .tasteLabelJA)
        let directOrigins = Self.decodeStringArray(from: container, forKey: .origin) ?? []
        let countryOrigins = Self.decodeStringArray(from: container, forKey: .originCountries) ?? []
        originCountries = countryOrigins.isEmpty ? nil : countryOrigins
        let blendOnly = directOrigins.count == 1 && directOrigins[0].trimmingCharacters(in: .whitespacesAndNewlines) == "ブレンド"
        if !directOrigins.isEmpty && !blendOnly {
            origin = directOrigins
        } else if !countryOrigins.isEmpty {
            origin = countryOrigins
        } else {
            origin = Self.inferOrigins(from: displayName, description: description)
        }
        flavorTags = try container.decodeIfPresent([String].self, forKey: .flavorTags)
        acidity = try container.decodeIfPresent(Int.self, forKey: .acidity)
        body = try container.decodeIfPresent(Int.self, forKey: .body)
        bitterness = try container.decodeIfPresent(Int.self, forKey: .bitterness)
        sweetness = try container.decodeIfPresent(Int.self, forKey: .sweetness)
        priceJPY = Self.decodeInt(from: container, forKey: .priceJPY)
        weightG = Self.decodeInt(from: container, forKey: .weightG)
        buyURL = Self.decodeURL(from: container, forKey: .buyURL) ?? URL(string: "https://coffee.yutok.dev")!
        imageURL = Self.decodeURL(from: container, forKey: .imageURL)
        imageCDNURL = Self.decodeURL(from: container, forKey: .imageCDNURL)
        extraImages = Self.decodeURLs(from: container, forKey: .extraImages)
        episode = try container.decodeIfPresent(String.self, forKey: .episode)
        episodeSource = Self.decodeURL(from: container, forKey: .episodeSource)
        tasteNotes = try container.decodeIfPresent(String.self, forKey: .tasteNotes)
        processing = try container.decodeIfPresent(String.self, forKey: .processing)
        coffeeType = try container.decodeIfPresent(String.self, forKey: .coffeeType)
    }

    private static func decodeURL(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) -> URL? {
        guard let value = try? container.decodeIfPresent(String.self, forKey: key),
              !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return nil
        }
        if let url = URL(string: value) {
            return url
        }
        return value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed).flatMap(URL.init(string:))
    }

    private static func decodeStringArray(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) -> [String]? {
        if let values = try? container.decodeIfPresent([String].self, forKey: key) {
            return values
        }
        if let value = try? container.decodeIfPresent(String.self, forKey: key),
           !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return [value]
        }
        return nil
    }

    private static func decodeInt(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) -> Int? {
        if let value = try? container.decodeIfPresent(Int.self, forKey: key) {
            return value
        }
          guard let value = try? container.decodeIfPresent(String.self, forKey: key),
              let number = Int(value.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            return nil
        }
        return number
    }

    private static func inferOrigins(from name: String, description: String?) -> [String]? {
        let source = name + " " + (description ?? "")
        if source.contains("カフェインを94％カットしたコロンビア産") { return ["コロンビア"] }
        if source.contains("ハワイコナ") { return ["アメリカ（ハワイ）"] }
        if source.contains("ブルーマウンテン") { return ["ジャマイカ"] }
        if source.contains("キリマンジャロ") { return ["タンザニア"] }
        if source.contains("マンデリン") { return ["インドネシア"] }
        if source.contains("グアテマラ") { return ["グアテマラ"] }
        if source.contains("ケニア") { return ["ケニア"] }
        return nil
    }

    private static func decodeURLs(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) -> [URL] {
        guard let values = try? container.decodeIfPresent([String].self, forKey: key) else { return [] }
        return values.compactMap { URL(string: $0) }
    }
}

enum RecommendationResult {
    case mood(RecommendResponse)
    case pairing(PairingResponse)

    var primary: RecommendItem {
        switch self {
        case .mood(let response): response.primary
        case .pairing(let response): response.primary
        }
    }

    var alternatives: [RecommendItem] {
        switch self {
        case .mood(let response): response.alternatives
        case .pairing(let response): response.alternatives
        }
    }

    var otherRecipes: [BrewRecipe] {
        switch self {
        case .mood(let response): response.otherRecipes ?? []
        case .pairing(let response): response.otherRecipes ?? []
        }
    }
}
