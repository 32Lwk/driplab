import type { EquipmentId } from "@driplab/recommender";

export interface MethodStep {
  title: string;
  description: string;
}

export interface MethodGuide {
  id: EquipmentId;
  name_ja: string;
  summary: string;
  description: string;
  characteristics: string[];
  steps: MethodStep[];
  tips: string[];
  suitable_for: string;
}

export const METHOD_GUIDES: MethodGuide[] = [
  {
    id: "drip",
    name_ja: "ハンドドリップ（V60）",
    summary: "豆の個性を最もクリアに引き出す、定番の抽出法",
    description:
      "フィルターにセットした粉にお湯を注ぎ、重力で抽出する方法です。注ぎ方や湯温を調整することで、同じ豆でも味わいを大きく変えられます。DripLab ではスターバックス公式のハンドドリップ比（2杯分・20g/360ml）をベースに、焙煎度と気分に合わせて湯温・挽き目を調整したレシピを提案します。",
    characteristics: [
      "クリアな味わいと香り",
      "焙煎度ごとに湯温・挽き目を調整",
      "3回注ぎ（蒸らし＋2回）が基本",
    ],
    steps: [
      { title: "セット", description: "中挽きの粉をフィルターに入れ、ドリッパーとサーバーを温める" },
      { title: "蒸らし", description: "粉全体が湿るお湯量を注ぎ、30秒ほど待ってガスを抜く" },
      { title: "注ぎ", description: "中心から外へ円を描くように、2〜3回に分けてお湯を注ぐ" },
      { title: "完成", description: "最後の一滴手前でドリッパーを外し、クリアな一杯を楽しむ" },
    ],
    tips: [
      "器具を事前にお湯で温めると温度が安定します",
      "蒸らしは粉全体が湿る程度のお湯量で30秒以内",
      "最後の一滴まで落とし切らず、雑味を避ける",
    ],
    suitable_for: "酸味やフルーティーな香りを楽しみたいとき、日常の一杯に",
  },
  {
    id: "french_press",
    name_ja: "フレンチプレス",
    summary: "コクと油分を残す、手軽な浸出法",
    description:
      "粗挽きの粉をお湯に浸して抽出し、金属フィルターでプランジーする方法です。ペーパーフィルターを使わないため、コーヒー油分が残り、まろやかでボディのある一杯になります。4分間の静置が基本で、手順がシンプルな分、挽き目と水温の管理が重要です。",
    characteristics: [
      "まろやかでコクのある味わい",
      "粗挽き・4分浸出が基本",
      "器具がシンプルで手入れも容易",
    ],
    steps: [
      { title: "粉とお湯", description: "粗挽きの粉に適温のお湯を注ぎ、軽くかき混ぜて均一に湿らせる" },
      { title: "4分静置", description: "フタをして4分間、粉をお湯に浸して成分を抽出する" },
      { title: "プランジー", description: "金属フィルターをゆっくり押し下ろし、粉を液から分離する" },
      { title: "完成", description: "すぐにカップへ移し替え、コクのある一杯を楽しむ" },
    ],
    tips: [
      "粉を均一に湿らせるよう、注ぎ終わりに軽くかき混ぜる",
      "プランジャーはゆっくり押し下ろす",
      "抽出後はすぐに移し替え、過抽出を防ぐ",
    ],
    suitable_for: "しっかりしたコクや甘みを求めるとき、朝の一杯に",
  },
  {
    id: "espresso",
    name_ja: "エスプレッソ",
    summary: "短時間・高圧で濃縮する抽出法",
    description:
      "細挽きの粉を高圧のお湯で短時間（25〜30秒）抽出する方法です。少量ながら濃厚で、クレマ（泡）が特徴的です。深煎り豆との相性が良く、ラテやカプチーノのベースにもなります。エスプレッソマシンとグラインダーの精度が仕上がりに大きく影響します。",
    characteristics: [
      "25〜30秒で36ml前後を抽出",
      "細挽き・高圧が基本",
      "深煎り豆でコクとビターが際立つ",
    ],
    steps: [
      { title: "粉詰め", description: "細挽きの粉をポートフィルターに均一に入れ、タンピングで平らに押さえる" },
      { title: "セット", description: "グループヘッドに装着し、抽出カップを置いて準備する" },
      { title: "抽出", description: "25〜30秒かけて高圧のお湯を通し、36ml前後の濃縮液を得る" },
      { title: "完成", description: "クレマが立った状態ですぐに飲み、濃厚な一杯を楽しむ" },
    ],
    tips: [
      "タンピングは均一な圧力で、粉のムラをなくす",
      "最初の数滴（プレインフュージョン）で流速を確認",
      "抽出直後にすぐ飲むのがおすすめ",
    ],
    suitable_for: "短時間で濃い一杯が欲しいとき、ミルクドリンクのベースに",
  },
  {
    id: "siphon",
    name_ja: "サイフォン",
    summary: "真空と熱で引き出す、香り高い抽出法",
    description:
      "下球のお湯を加熱して上球に上げ、粉を浸してから火を止めると真空で下球に戻る仕組みです。一定の温度管理のもと抽出されるため、繊細な酸味とアロマが際立ちます。見た目の演出も楽しめる、コーヒー好き向けの抽出法です。",
    characteristics: [
      "クリアな酸味とアロマ",
      "中挽き・約90秒の抽出",
      "温度管理が仕上がりの鍵",
    ],
    steps: [
      { title: "加熱", description: "下球のお湯を加熱し、上球へお湯が上がるのを待つ" },
      { title: "浸出", description: "上球に粉を入れ、45秒ほどかき混ぜながら抽出する" },
      { title: "火を止める", description: "火を止めると真空で下球に戻り、粉床がフィルターされる" },
      { title: "完成", description: "クリアな酸味とアロマが際立つ一杯を楽しむ" },
    ],
    tips: [
      "かき混ぜは45秒程度、粉床を均一に",
      "火を止めたら無理に急がず、自然に戻るのを待つ",
      "浅煎り豆ほど個性が際立ちやすい",
    ],
    suitable_for: "香りや酸味を丁寧に楽しみたいとき、特別な一杯に",
  },
];

export function getMethodGuide(id: string): MethodGuide | undefined {
  return METHOD_GUIDES.find((m) => m.id === id);
}
