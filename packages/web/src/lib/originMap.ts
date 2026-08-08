export type OriginRegion = "アフリカ" | "中南米" | "アジア・大洋州";

export interface OriginMapMarker {
  slug: string;
  name_ja: string;
  summary: string;
  lat: number;
  lon: number;
  region: OriginRegion;
}

export interface OriginMapPosition {
  slug: string;
  lat: number;
  lon: number;
  region: OriginRegion;
}

export const ORIGIN_REGIONS: OriginRegion[] = ["アフリカ", "中南米", "アジア・大洋州"];

export const ORIGIN_REGION_COLORS: Record<OriginRegion, string> = {
  アフリカ: "#8d6e63",
  中南米: "#558b2f",
  "アジア・大洋州": "#a1887f",
};

/** Equirectangular projection for the 1000×500 viewBox map */
export function latLonToXY(
  lat: number,
  lon: number,
  width = 1000,
  height = 500,
): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}

export const ORIGIN_MAP_POSITIONS: OriginMapPosition[] = [
  // アフリカ
  { slug: "ethiopia", lat: 9.1, lon: 40.5, region: "アフリカ" },
  { slug: "kenya", lat: -0.02, lon: 37.9, region: "アフリカ" },
  { slug: "tanzania", lat: -6.4, lon: 34.9, region: "アフリカ" },
  { slug: "rwanda", lat: -1.94, lon: 29.87, region: "アフリカ" },
  { slug: "uganda", lat: 1.4, lon: 32.3, region: "アフリカ" },
  { slug: "burundi", lat: -3.4, lon: 29.9, region: "アフリカ" },
  { slug: "zambia", lat: -13.1, lon: 27.8, region: "アフリカ" },
  // 中南米
  { slug: "brazil", lat: -14.2, lon: -51.9, region: "中南米" },
  { slug: "colombia", lat: 4.57, lon: -74.3, region: "中南米" },
  { slug: "guatemala", lat: 15.8, lon: -90.2, region: "中南米" },
  { slug: "costa-rica", lat: 9.7, lon: -83.9, region: "中南米" },
  { slug: "panama", lat: 8.5, lon: -80.8, region: "中南米" },
  { slug: "honduras", lat: 15.2, lon: -86.2, region: "中南米" },
  { slug: "peru", lat: -9.2, lon: -75.0, region: "中南米" },
  { slug: "mexico", lat: 23.6, lon: -102.5, region: "中南米" },
  { slug: "el-salvador", lat: 13.7, lon: -88.9, region: "中南米" },
  { slug: "jamaica", lat: 18.1, lon: -77.3, region: "中南米" },
  { slug: "nicaragua", lat: 12.9, lon: -85.2, region: "中南米" },
  { slug: "bolivia", lat: -16.3, lon: -63.6, region: "中南米" },
  // アジア・大洋州
  { slug: "indonesia", lat: -2.5, lon: 118.0, region: "アジア・大洋州" },
  { slug: "vietnam", lat: 14.0, lon: 108.0, region: "アジア・大洋州" },
  { slug: "yemen", lat: 15.5, lon: 48.5, region: "アジア・大洋州" },
  { slug: "usa", lat: 19.9, lon: -155.5, region: "アジア・大洋州" },
  { slug: "japan", lat: 35.7, lon: 138.0, region: "アジア・大洋州" },
  { slug: "papua-new-guinea", lat: -6.0, lon: 147.0, region: "アジア・大洋州" },
];
