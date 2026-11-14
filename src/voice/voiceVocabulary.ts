import type { ShopType } from '../types';

/**
 * Bakery names are deliberately specific phrases, not generic words like
 * "cake" or "bread". Gemini's transcription model accepts custom vocabulary
 * hints and supports up to 1,000 terms; we keep the request focused and bounded.
 */
export const BAKERY_VOICE_VOCABULARY = [
  'Chocolate Bomboloni',
  'Bomboloni',
  'Bombolone',
  'Nutella Bomboloni',
  'Vanilla Custard Bomboloni',
  'Pistachio Bomboloni',
  'Raspberry Bomboloni',
  'San Sebastian Cheesecake',
  'San Sebastián Cheesecake',
  'San Sebastian',
  'Basque Cheesecake',
  'Burnt Basque Cheesecake',
  'New York Cheesecake',
  'Japanese Cotton Cheesecake',
  'Lotus Biscoff Cheesecake',
  'Biscoff Cheesecake',
  'Blueberry Cheesecake',
  'Strawberry Cheesecake',
  'Raspberry Cheesecake',
  'Oreo Cheesecake',
  'Mango Cheesecake',
  'Tiramisu',
  'Classic Tiramisu',
  'Pistachio Tiramisu',
  'Lotus Biscoff Tiramisu',
  'Opera Cake',
  'Black Forest Gateau',
  'German Chocolate Cake',
  'Red Velvet Cake',
  'Chocolate Truffle Cake',
  'Dutch Chocolate Cake',
  'Flourless Chocolate Cake',
  'Tres Leches Cake',
  'Carrot Walnut Cake',
  'Lemon Drizzle Cake',
  'Victoria Sponge',
  'Japanese Strawberry Shortcake',
  'Mango Mousse Cake',
  'Rasmalai Cake',
  'Gulab Jamun Cheesecake',
  'Biscoff Cake',
  'Pistachio Kunafa Cake',
  'Chocolate Fudge Brownie',
  'Walnut Brownie',
  'Brookie',
  'Blondie',
  'Brownie Cheesecake',
  'Chocolate Lava Cake',
  'Molten Chocolate Cake',
  'Chocolate Fondant',
  'Pain au Chocolat',
  'Butter Croissant',
  'Almond Croissant',
  'Pistachio Croissant',
  'Kouign-Amann',
  'Cruffin',
  'Cronut',
  'Danish Pastry',
  'Pain aux Raisins',
  'Cinnamon Roll',
  'Sticky Pecan Bun',
  'Brioche',
  'Chocolate Babka',
  'Canelé',
  'Madeleine',
  'Financier',
  'Éclair',
  'Chocolate Éclair',
  'Choux au Craquelin',
  'Paris-Brest',
  'Profiteroles',
  'Mille-Feuille',
  'Napoleon Pastry',
  'Saint-Honoré',
  'Tarte Tatin',
  'Lemon Tart',
  'Key Lime Tart',
  'Fruit Tart',
  'Pistachio Tart',
  'Macaron',
  'Pistachio Macaron',
  'Raspberry Macaron',
  'Chocolate Macaron',
  'Cannoli',
  'Sfogliatella',
  'Maritozzo',
  'Rum Baba',
  'Panna Cotta',
  'Crème Brûlée',
  'Creme Caramel',
  'Churros',
  'Alfajores',
  'Biscotti',
  'Amaretti',
  'Palmier',
  'Palmier Pastry',
  'Sourdough Loaf',
  'Focaccia',
  'Ciabatta',
  'Pretzel',
  'Bagel',
  'Focaccia Sandwich',
  'Quiche Lorraine',
  'Spinach Feta Quiche',
  'Vol-au-vent',
  'Sausage Roll',
  'Paneer Puff',
  'Veg Puff',
  'Chicken Puff',
  'Mushroom Puff',
  'Pesto Pinwheel',
  'Cheese Twist',
  'Garlic Knot',
  'Khari Biscuit',
  'Shrewsbury Biscuit',
  'Nankhatai',
  'Jeera Biscuit',
  'Osmania Biscuit',
  'Maska Bun',
  'Brun Maska',
  'Mawa Cake',
  'Plum Cake',
  'Tea Cake',
  'Fruit Cake',
  'Christmas Plum Cake',
  'Dilkush',
  'Coconut Macaroon',
  'Choco Chip Cookie',
  'Double Chocolate Cookie',
  'Red Velvet Cookie',
  'Brooklyn Blackout Cookie',
  'Sable Cookie',
  'Sourdough Cookie',
  'Eggless Chocolate Truffle',
  'Eggless Dutch Chocolate Cake',
  'Eggless Red Velvet Cake',
  'Eggless Brownie',
] as const;

function normalizeTerm(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Puts names already used by this shop first, ranked by frequency and recency,
 * then fills the remaining slots with category-specific starter vocabulary.
 */
export function buildVoiceVocabulary(
  shopType: ShopType | null | undefined,
  savedProductNames: string[] = [],
  maxTerms = 150,
): string[] {
  const limit = Math.max(1, Math.min(150, Math.trunc(maxTerms) || 150));
  const productStats = new Map<string, { name: string; count: number; latestIndex: number }>();

  savedProductNames.forEach((rawName, index) => {
    if (typeof rawName !== 'string') return;
    const name = rawName.trim().replace(/\s+/gu, ' ').slice(0, 80);
    const key = normalizeTerm(name);
    if (key.length < 2) return;

    const existing = productStats.get(key);
    if (existing) {
      existing.count += 1;
      existing.latestIndex = Math.min(existing.latestIndex, index);
    } else {
      productStats.set(key, { name, count: 1, latestIndex: index });
    }
  });

  const savedProducts = [...productStats.values()]
    .sort((a, b) => b.count - a.count || a.latestIndex - b.latestIndex)
    .map(item => item.name);

  const categoryVocabulary = shopType === 'bakery'
    ? BAKERY_VOICE_VOCABULARY
    : [];

  const result: string[] = [];
  const seen = new Set<string>();
  for (const term of [...savedProducts, ...categoryVocabulary]) {
    const key = normalizeTerm(term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(term);
    if (result.length >= limit) break;
  }

  return result;
}
