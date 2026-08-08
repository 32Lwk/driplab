import type { BrewRecipe } from "@driplab/recommender";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}分`;
}

export function RecipeDetails({
  recipe,
  title,
}: {
  recipe: BrewRecipe;
  title?: string;
}) {
  return (
    <div className="recipe-box">
      <h4>{title ?? `${recipe.method_ja} のレシピ`}</h4>
      <dl className="recipe-grid">
        <dt>挽き目</dt>
        <dd>{recipe.grind_ja}</dd>
        <dt>コーヒー量</dt>
        <dd>{recipe.coffee_g}g</dd>
        {recipe.water_ml != null && (
          <>
            <dt>お湯</dt>
            <dd>{recipe.water_ml}ml</dd>
          </>
        )}
        {recipe.bloom_ml != null && (
          <>
            <dt>蒸らし</dt>
            <dd>
              {recipe.bloom_ml}ml / {recipe.bloom_sec ?? 25}秒
            </dd>
          </>
        )}
        {recipe.yield_ml != null && (
          <>
            <dt>抽出量</dt>
            <dd>{recipe.yield_ml}ml</dd>
          </>
        )}
        <dt>水温</dt>
        <dd>{recipe.water_temp_c}℃</dd>
        <dt>時間</dt>
        <dd>{formatTime(recipe.time_sec)}</dd>
      </dl>
      {recipe.steps && recipe.steps.length > 0 && (
        <ol className="recipe-steps">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {recipe.notes && <p className="recipe-notes">{recipe.notes}</p>}
      {recipe.reference_url && (
        <a
          href={recipe.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          className="recipe-reference"
        >
          参考資料 →
        </a>
      )}
    </div>
  );
}
