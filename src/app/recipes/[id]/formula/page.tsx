"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { getRecipeById } from "@/data/recipes";
import Link from "next/link";

export default function FormulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--ink-mute)" }}>Recipe not found</p>
      </div>
    );
  }

  const ingredientGroups: { key: string; label: string; items: { name: string; weight: string }[] }[] = [];

  if (recipe.ingredients.levain && recipe.ingredients.levain.length > 0) {
    ingredientGroups.push({ key: "levain", label: "Levain", items: recipe.ingredients.levain });
  }
  ingredientGroups.push({ key: "main", label: "Main Dough", items: recipe.ingredients.main });
  if (recipe.ingredients.additions && recipe.ingredients.additions.length > 0) {
    ingredientGroups.push({ key: "additions", label: "Additions", items: recipe.ingredients.additions });
  }
  if (recipe.ingredients.filling && recipe.ingredients.filling.length > 0) {
    ingredientGroups.push({ key: "filling", label: "Filling", items: recipe.ingredients.filling });
  }
  if (recipe.ingredients.topping && recipe.ingredients.topping.length > 0) {
    ingredientGroups.push({ key: "topping", label: "Topping", items: recipe.ingredients.topping });
  }

  const metaParts = [
    recipe.totalTime,
    recipe.hydration,
    recipe.yield,
    recipe.difficulty,
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .formula-page { max-width: 100% !important; color: black !important; }
          .formula-page * { color: black !important; }
          .formula-rule { border-color: #ccc !important; }
          @page { margin: 2cm; }
        }
        .formula-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .formula-row-name {
          flex-shrink: 0;
        }
        .formula-row-dots {
          flex: 1;
          border-bottom: 1px dotted var(--ink-faint);
          min-width: 20px;
          margin-bottom: 3px;
        }
        .formula-row-weight {
          flex-shrink: 0;
          font-family: monospace;
          font-size: 14px;
        }
        @media print {
          .formula-row-dots {
            border-color: #999 !important;
          }
        }
      `}</style>

      <div
        className="formula-page"
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "40px 24px 60px",
          position: "relative",
        }}
      >
        {/* Toolbar */}
        <div
          className="no-print"
          style={{
            position: "absolute",
            top: 40,
            right: 24,
            display: "flex",
            gap: 16,
            fontSize: 13,
          }}
        >
          <button
            type="button"
            onClick={() => router.push(`/recipes/${id}`)}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-mute)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              padding: 0,
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-mute)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              padding: 0,
            }}
          >
            Print
          </button>
        </div>

        {/* Title */}
        <h1
          className="display"
          style={{
            fontSize: 36,
            margin: 0,
            lineHeight: 1.1,
            paddingRight: 100,
          }}
        >
          {recipe.title}
        </h1>

        {/* Subtitle */}
        {recipe.subtitle && (
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-mute)",
              margin: "8px 0 0",
            }}
          >
            {recipe.subtitle}
          </p>
        )}

        {/* Rule */}
        <hr
          className="formula-rule"
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "20px 0",
          }}
        />

        {/* Metadata */}
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "var(--ink-soft)",
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {metaParts.join(" · ")}
        </p>

        {/* Rule */}
        <hr
          className="formula-rule"
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "20px 0",
          }}
        />

        {/* Ingredient Groups */}
        {ingredientGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: 24 }}>
            <h3
              className="label"
              style={{ margin: "0 0 10px" }}
            >
              {group.label}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {group.items.map((ing, i) => (
                <div key={i} className="formula-row">
                  <span
                    className="formula-row-name"
                    style={{ fontSize: 14, color: "var(--ink-soft)" }}
                  >
                    {ing.name}
                  </span>
                  <span className="formula-row-dots" />
                  <span className="formula-row-weight">
                    {ing.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Rule */}
        <hr
          className="formula-rule"
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "20px 0 28px",
          }}
        />

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {recipe.steps.map((step) => (
            <div key={step.step}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span
                  className="display"
                  style={{
                    fontSize: 24,
                    color: "var(--ink-faint)",
                    lineHeight: 1,
                  }}
                >
                  {step.step}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {step.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  lineHeight: 1.6,
                  margin: "4px 0 0",
                }}
              >
                {step.instructions}
              </p>
              {step.duration && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    margin: "6px 0 0",
                  }}
                >
                  {step.duration}
                  {step.temperature ? ` · ${step.temperature}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        {recipe.tips.length > 0 && (
          <>
            <hr
              className="formula-rule"
              style={{
                border: "none",
                borderTop: "1px solid var(--border)",
                margin: "28px 0 24px",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recipe.tips.map((tip, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {tip}
                </p>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-faint)",
            textAlign: "center",
            marginTop: 48,
          }}
        >
          Proof &mdash; sourdough journal
        </p>
      </div>
    </>
  );
}
