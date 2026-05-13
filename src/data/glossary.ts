export interface GlossaryEntry {
  term: string;
  aliases?: string[];
  short: string;
  long?: string;
}

export const glossary: GlossaryEntry[] = [
  {
    term: "Autolyse",
    aliases: ["autolysis"],
    short: "Resting flour + water before adding salt/starter. Hydrates flour, develops gluten with zero effort.",
    long: "Mix only flour and water, then let it sit 30-60 minutes. The flour absorbs the water and gluten starts forming on its own. When you add the starter and salt later, the dough is already partially developed.",
  },
  {
    term: "Bulk Fermentation",
    aliases: ["bulk ferment", "bulk"],
    short: "The main rise after mixing. Dough sits in a container while yeast produces gas and flavor develops.",
    long: "Usually 3-6 hours at room temperature. You'll do stretch and folds during the first half. The dough should grow 50-75% in volume and feel airy and jiggly when it's done.",
  },
  {
    term: "Levain",
    aliases: ["leaven"],
    short: "A small batch of starter mixed with fresh flour and water, built specifically for a recipe.",
    long: "Think of it as a 'starter boost.' You take a bit of your starter, feed it, and let it peak right when you need it for the recipe. This ensures maximum yeast activity.",
  },
  {
    term: "Starter",
    aliases: ["sourdough starter", "mother"],
    short: "A live culture of wild yeast and bacteria maintained with regular feedings of flour and water.",
    long: "Your starter is alive! Feed it equal parts flour and water regularly. When it doubles in size and smells tangy-sweet, it's active and ready to leaven bread.",
  },
  {
    term: "Hydration",
    short: "The ratio of water to flour, expressed as a percentage. Higher = wetter, more open crumb.",
    long: "75% hydration means 750g water per 1000g flour. Beginners should start at 70-75%. Higher hydration (80%+) gives bigger holes but is harder to handle.",
  },
  {
    term: "Baker's Percentage",
    aliases: ["baker's math", "baker's %"],
    short: "A formula where every ingredient is expressed as a percentage of the total flour weight.",
    long: "Flour is always 100%. If you have 1000g flour and 750g water, that's 75% hydration. Salt at 2% = 20g. This makes it easy to scale any recipe up or down.",
  },
  {
    term: "Stretch and Fold",
    aliases: ["stretch & fold", "S&F"],
    short: "A gentle dough-handling technique: grab one side, stretch it up, fold it over. Rotate and repeat.",
    long: "Wet your hand, slide it under the dough, stretch one side up as far as it goes without tearing, then fold it to the center. Rotate the bowl 90° and repeat 3 more times. This builds gluten without kneading.",
  },
  {
    term: "Crumb",
    short: "The interior texture of the bread. Can be tight (small holes) or open (large, irregular holes).",
    long: "An 'open crumb' has big holes — great for sourdough. A 'tight crumb' has small, even holes — better for sandwiches. Neither is wrong; it depends on the bread.",
  },
  {
    term: "Scoring",
    aliases: ["score", "slashing"],
    short: "Cutting the dough surface before baking. Controls where the bread expands and creates the 'ear.'",
    long: "Use a razor blade or sharp knife. Cut at a shallow angle (about 30°) for an ear. The cut should be swift and confident — hesitation tears the dough.",
  },
  {
    term: "Ear",
    short: "The flap of crust that lifts during baking where you scored. A sign of good oven spring.",
  },
  {
    term: "Oven Spring",
    short: "The rapid rise in the first 10-15 minutes of baking. Steam + high heat = maximum puff.",
  },
  {
    term: "Poke Test",
    short: "Press the dough with a floured finger. If it springs back slowly and leaves a slight indent, it's ready.",
    long: "If it springs back fast — underproofed. If the indent stays and doesn't bounce back at all — overproofed. You want the middle: slow bounce back with a small remaining dent.",
  },
  {
    term: "Proofing",
    aliases: ["proof", "final proof", "second rise"],
    short: "The final rise after shaping, usually in a banneton. Can be at room temp or cold (retarded).",
    long: "Room temp proofing takes 1-3 hours. Cold proofing (retarding) in the fridge takes 8-16 hours and develops more flavor. Most home bakers retard overnight and bake in the morning.",
  },
  {
    term: "Banneton",
    aliases: ["proofing basket", "brotform"],
    short: "A basket (often rattan) that supports the dough's shape during the final proof and creates flour rings on the crust.",
  },
  {
    term: "DDT",
    aliases: ["desired dough temperature"],
    short: "The target temperature of your mixed dough, typically 25-27°C (77-80°F). Controls fermentation speed.",
    long: "Warmer dough ferments faster. To hit your DDT, adjust water temperature: if your kitchen is cold, use warmer water. Formula: Water temp = DDT × 3 − flour temp − room temp − friction.",
  },
  {
    term: "Retard",
    aliases: ["retarding", "cold retard"],
    short: "Slowing fermentation by putting dough in the fridge. Develops flavor and lets you bake on your schedule.",
  },
  {
    term: "Lamination",
    short: "Stretching dough thin on a wet surface, then folding it back up. Used to incorporate add-ins or build strength.",
  },
  {
    term: "Coil Fold",
    short: "Lift the dough from the center, letting the sides fold under from gravity. Gentler than stretch and fold.",
  },
  {
    term: "Pre-shape",
    aliases: ["preshape"],
    short: "A loose shaping before the final shape. Gives the dough structure and a 15-20 minute rest (bench rest).",
  },
  {
    term: "Bench Rest",
    short: "The 15-20 minute rest between pre-shaping and final shaping. Lets the gluten relax so you can shape tightly.",
  },
  {
    term: "Dutch Oven",
    short: "A heavy, lidded pot used for baking. Traps steam from the dough, creating a crackly crust and better oven spring.",
  },
  {
    term: "Ripe",
    aliases: ["ripe starter"],
    short: "A starter that has peaked — doubled or tripled in size, domed on top, smells sweet-tangy. Ready to use.",
    long: "A ripe starter should pass the float test: drop a spoonful in water — if it floats, it's ready. If it has already collapsed past its peak, it's overripe and may still work but will be more sour.",
  },
];

const termIndex = new Map<string, GlossaryEntry>();
for (const entry of glossary) {
  termIndex.set(entry.term.toLowerCase(), entry);
  for (const alias of entry.aliases || []) {
    termIndex.set(alias.toLowerCase(), entry);
  }
}

export function lookupTerm(term: string): GlossaryEntry | undefined {
  return termIndex.get(term.toLowerCase());
}
