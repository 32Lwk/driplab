"use client";

interface FoodFreeInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function FoodFreeInput({ value, onChange }: FoodFreeInputProps) {
  return (
    <div className="food-free-input">
      <label htmlFor="food-text" className="input-label">
        自由入力（任意）
      </label>
      <input
        id="food-text"
        type="text"
        className="text-input"
        placeholder="例: チョコケーキ、カレーライス"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
      />
      <p className="input-hint">
        プリセット以外の食事も入力できます。近いカテゴリでマッチングします。
      </p>
    </div>
  );
}
