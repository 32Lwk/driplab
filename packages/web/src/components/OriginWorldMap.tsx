"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  ORIGIN_REGIONS,
  ORIGIN_REGION_COLORS,
  latLonToXY,
  type OriginMapMarker,
  type OriginRegion,
} from "@/lib/originMap";

/** Equirectangular 2:1 — matches world-map-land.svg viewBox */
const MAP_WIDTH = 720;
const MAP_HEIGHT = 360;
const WORLD_MAP_SRC = "/learn/world-map-land.svg";

const COFFEE_BELT_N = latLonToXY(23.5, 0, MAP_WIDTH, MAP_HEIGHT).y;
const COFFEE_BELT_S = latLonToXY(-23.5, 0, MAP_WIDTH, MAP_HEIGHT).y;

interface OriginWorldMapProps {
  markers: OriginMapMarker[];
}

export function OriginWorldMap({ markers: markerData }: OriginWorldMapProps) {
  const [activeRegion, setActiveRegion] = useState<OriginRegion | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const markers = useMemo(
    () =>
      markerData.map((marker) => ({
        ...marker,
        ...latLonToXY(marker.lat, marker.lon, MAP_WIDTH, MAP_HEIGHT),
      })),
    [markerData],
  );

  const hovered = markers.find((m) => m.slug === hoveredSlug);

  return (
    <section className="origin-map-section section-card" aria-label="コーヒー産地マップ">
      <div className="origin-map-header">
        <p className="section-title">世界のコーヒー産地マップ</p>
        <p className="origin-map-lead">
          マーカーをクリックすると各産地の詳細ページへ移動します。色は地域帯を表します。
        </p>
      </div>

      <div className="origin-map-legend" role="group" aria-label="地域フィルター">
        <button
          type="button"
          className={`origin-map-legend-btn${activeRegion === null ? " active" : ""}`}
          onClick={() => setActiveRegion(null)}
        >
          すべて
        </button>
        {ORIGIN_REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            className={`origin-map-legend-btn${activeRegion === region ? " active" : ""}`}
            style={{ "--region-color": ORIGIN_REGION_COLORS[region] } as CSSProperties}
            onClick={() => setActiveRegion(activeRegion === region ? null : region)}
          >
            <span className="origin-map-legend-dot" aria-hidden />
            {region}
          </button>
        ))}
      </div>

      <div className="origin-map-wrap">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="origin-map-svg"
          role="img"
          aria-label="世界地図。コーヒー主要産地の位置を示しています"
        >
          <image
            href={WORLD_MAP_SRC}
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            preserveAspectRatio="none"
            className="origin-map-illustration"
          />

          <rect
            x={0}
            y={COFFEE_BELT_N}
            width={MAP_WIDTH}
            height={COFFEE_BELT_S - COFFEE_BELT_N}
            fill="rgba(141,110,99,0.1)"
            pointerEvents="none"
          />
          <line
            x1={0}
            y1={COFFEE_BELT_N}
            x2={MAP_WIDTH}
            y2={COFFEE_BELT_N}
            stroke="rgba(93,64,55,0.35)"
            strokeWidth="1"
            strokeDasharray="6 4"
            pointerEvents="none"
          />
          <line
            x1={0}
            y1={COFFEE_BELT_S}
            x2={MAP_WIDTH}
            y2={COFFEE_BELT_S}
            stroke="rgba(93,64,55,0.35)"
            strokeWidth="1"
            strokeDasharray="6 4"
            pointerEvents="none"
          />
          <text
            x={MAP_WIDTH - 10}
            y={COFFEE_BELT_N - 6}
            textAnchor="end"
            className="origin-map-belt-label"
          >
            コーヒーベルト（北緯23.5°〜南緯23.5°）
          </text>

          {markers.map((marker) => {
            const dimmed = activeRegion !== null && activeRegion !== marker.region;
            const isHovered = hoveredSlug === marker.slug;
            const color = ORIGIN_REGION_COLORS[marker.region];
            const href = `/learn/origins/${marker.slug}`;

            return (
              <a
                key={marker.slug}
                href={href}
                className={`origin-map-marker${dimmed ? " dimmed" : ""}${isHovered ? " hovered" : ""}`}
                aria-label={`${marker.name_ja}の産地ガイド`}
                onMouseEnter={() => setHoveredSlug(marker.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                onFocus={() => setHoveredSlug(marker.slug)}
                onBlur={() => setHoveredSlug(null)}
              >
                <g transform={`translate(${marker.x}, ${marker.y})`}>
                  <circle r={isHovered ? 11 : 8} fill={color} opacity={0.22} />
                  <circle r={isHovered ? 5.5 : 4.5} fill={color} stroke="#fffdf9" strokeWidth={1.5} />
                </g>
              </a>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="origin-map-tooltip"
            style={
              {
                "--tooltip-x": `${(hovered.x / MAP_WIDTH) * 100}%`,
                "--tooltip-y": `${(hovered.y / MAP_HEIGHT) * 100}%`,
              } as CSSProperties
            }
          >
            <span
              className="origin-map-tooltip-region"
              style={{ color: ORIGIN_REGION_COLORS[hovered.region] }}
            >
              {hovered.region}
            </span>
            <strong>{hovered.name_ja}</strong>
            <p>{hovered.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
