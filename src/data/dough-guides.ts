export interface DoughGuide {
  keywords: string[];
  ready: string;
  notReady: string;
  overDone: string;
}

export const doughGuides: DoughGuide[] = [
  {
    keywords: ["autolyse", "autolysis"],
    ready: "Dough looks shaggy but no dry flour visible. It feels like a rough, sticky mass — that's perfect.",
    notReady: "Still see dry flour patches? Give it 5 more minutes. No kneading needed, just let water do its thing.",
    overDone: "Can't really over-autolyse. Even 2 hours is fine. The dough just gets smoother.",
  },
  {
    keywords: ["mix", "mixing", "incorporate"],
    ready: "Everything is combined into one mass. Some lumps are okay — it'll smooth out during bulk.",
    notReady: "Starter and salt should be fully mixed in. Squeeze and fold until no streaks remain.",
    overDone: "If the dough feels tight and warm, you may have overmixed. It'll still make good bread.",
  },
  {
    keywords: ["stretch and fold", "stretch & fold", "coil fold"],
    ready: "After each set, the dough should feel tighter and hold its shape better. It pulls away from the bowl sides cleanly.",
    notReady: "If the dough is super slack and spreads flat immediately, it needs more sets. Be gentle but firm.",
    overDone: "If the dough tears when you stretch, you've built too much tension. Skip the next set and let it rest.",
  },
  {
    keywords: ["bulk ferment", "bulk"],
    ready: "Dough has risen 50-75%, feels airy and jiggly when you shake the container. You'll see bubbles on the surface and sides. The edges look slightly domed.",
    notReady: "Still dense and flat? Give it more time. Cold kitchen = slower rise. Check again in 30 minutes.",
    overDone: "If it's more than doubled and the top is flat or collapsing, it's overproofed. You can still bake it — the crumb will be tighter but flavor will be great.",
  },
  {
    keywords: ["pre-shape", "preshape"],
    ready: "A loose round or oval that holds its shape on the counter. Some spreading is fine — that's what the bench rest is for.",
    notReady: "If it's a flat pancake, use a bench scraper to tuck the edges under and build tension.",
    overDone: "Too tight and the dough is fighting you? Let it rest 20 minutes, then shape gently.",
  },
  {
    keywords: ["shape", "shaping", "final shape"],
    ready: "The dough is a smooth, taut ball or batard. The surface has tension — it should spring back gently when poked.",
    notReady: "If it's floppy and won't hold shape, flour your hands, pull the edges tight, and roll it seam-side down.",
    overDone: "Too much tension = the dough tears on top. Next time, be gentler. It'll still bake fine.",
  },
  {
    keywords: ["proof", "cold proof", "retard", "final proof"],
    ready: "Poke test: press with a floured finger. If the indent slowly springs back halfway, it's ready to bake.",
    notReady: "If it springs right back = underproofed. Give it more time (30-60 min at room temp or longer in the fridge).",
    overDone: "If the indent stays and doesn't bounce back at all = overproofed. Bake immediately — the bread will be flatter but still taste great.",
  },
  {
    keywords: ["score", "scoring"],
    ready: "One swift, confident cut at a shallow angle (30°). The blade should glide, not drag. The cut opens slightly.",
    notReady: "If the blade drags and tears, the dough may be too warm or your blade isn't sharp enough.",
    overDone: "Too many or too deep cuts = the loaf won't spring properly. Start with one clean slash.",
  },
  {
    keywords: ["bake", "baking", "oven"],
    ready: "The crust is deep golden-brown (darker than you think!). Internal temp 205-210°F / 96-99°C. Tap the bottom — it sounds hollow.",
    notReady: "Pale crust? Give it 5-10 more minutes. Don't be afraid of color — that's flavor.",
    overDone: "Very dark or burnt spots? Lower oven 10°C next time, or reduce bake time by 5 min.",
  },
];

export function getGuideForStep(title: string, instructions: string): DoughGuide | null {
  const text = `${title} ${instructions}`.toLowerCase();
  for (const guide of doughGuides) {
    if (guide.keywords.some((kw) => text.includes(kw))) {
      return guide;
    }
  }
  return null;
}
