// Signature mechanic: OUTFIT SETS WITH BOARD PERKS — what you wear changes how the merge board plays.
// A set is matched by template keys (so every colour variant counts). Wearing `need` pieces activates its perk.
// Perks are read by Game (js/game.js) through `perksFor(equipped)` and shown in the play HUD / wardrobe.
import { getItem } from './wardrobe.js';

// piece selector: { cat, tpl: [..] } — any equipped item of that category whose template is in the list
const SETS = [
  { id: 'chef', name: { en: 'Kitchen Crew', ar: 'طاقم المطبخ' }, emoji: '👨‍🍳', pieces: [{ cat: 'outfit', tpl: ['chef'] }, { cat: 'hat', tpl: ['chef_hat'] }, { cat: 'acc', tpl: ['coffee'] }], need: 2,
    perk: { genCharges: { food: 3 }, text: { en: '+3 charges on food trucks', ar: '+3 شحنات لعربات الطعام' } } },
  { id: 'athlete', name: { en: 'All-Star', ar: 'نجم الملعب' }, emoji: '🏀', pieces: [{ cat: 'outfit', tpl: ['football', 'basketball', 'baseball', 'tracksuit', 'cheer', 'varsity'] }, { cat: 'top', tpl: ['jersey', 'baseball_tee', 'varsity_jacket'] }, { cat: 'shoes', tpl: ['sneaker', 'hightop', 'basketball_shoes', 'chunky'] }, { cat: 'hat', tpl: ['sweatband', 'cap', 'snapback', 'football_helmet', 'baseball_helmet'] }, { cat: 'acc', tpl: ['basketball', 'football', 'medal'] }], need: 3,
    perk: { deliverEnergy: 1, text: { en: '+1 energy for every order delivered', ar: '+1 طاقة لكل طلب تُسلّمه' } } },
  { id: 'banker', name: { en: 'Wall Street', ar: 'وول ستريت' }, emoji: '💼', pieces: [{ cat: 'outfit', tpl: ['suit', 'tuxedo'] }, { cat: 'top', tpl: ['blazer', 'shirt'] }, { cat: 'acc', tpl: ['watch', 'smartwatch', 'tie', 'bowtie', 'cash'] }, { cat: 'shoes', tpl: ['formal'] }, { cat: 'glasses', tpl: ['square', 'clear_frames'] }], need: 3,
    perk: { orderCoinsMul: 1.2, text: { en: '+20% coins from orders', ar: '+20% عملات من الطلبات' } } },
  { id: 'techie', name: { en: 'Silicon Alley', ar: 'عبقري التقنية' }, emoji: '🤖', pieces: [{ cat: 'outfit', tpl: ['techwear', 'astronaut'] }, { cat: 'glasses', tpl: ['smart_glasses', 'vr_headset', 'visor'] }, { cat: 'acc', tpl: ['airpods', 'phone', 'vr', 'headphones', 'smartwatch'] }, { cat: 'hat', tpl: ['helmet_space'] }], need: 2,
    perk: { cooldownMul: 0.75, text: { en: 'generators recharge 25% faster', ar: 'المولّدات تُشحن أسرع بـ25%' } } },
  { id: 'cowboy', name: { en: 'Wild West', ar: 'الغرب الأمريكي' }, emoji: '🤠', pieces: [{ cat: 'outfit', tpl: ['western', 'cowgirl'] }, { cat: 'hat', tpl: ['cowboy', 'bandana'] }, { cat: 'shoes', tpl: ['cowboy_boots', 'boots'] }, { cat: 'top', tpl: ['flannel', 'denim_jacket'] }], need: 2,
    perk: { crateDrops: 2, text: { en: 'every crate drops 2 extra items', ar: 'كل صندوق يسقط قطعتين إضافيتين' } } },
  { id: 'street', name: { en: 'Street King', ar: 'ملك الشارع' }, emoji: '🧢', pieces: [{ cat: 'outfit', tpl: ['streetwear', 'rapper', 'skater'] }, { cat: 'top', tpl: ['hoodie', 'oversized_hoodie', 'puffer', 'windbreaker'] }, { cat: 'bottom', tpl: ['cargo', 'joggers'] }, { cat: 'shoes', tpl: ['chunky', 'skate_shoes', 'hightop', 'light_up'] }, { cat: 'hat', tpl: ['snapback', 'beanie', 'bucket', 'durag', 'trucker'] }, { cat: 'acc', tpl: ['goldchain', 'skateboard', 'crossbody', 'fannypack'] }], need: 3,
    perk: { bubbleMul: 2.5, bubbleMs: 4000, text: { en: 'bubbles appear 2.5× more and last longer', ar: 'الفقاعات تظهر 2.5× أكثر وتدوم أطول' } } },
  { id: 'hollywood', name: { en: 'Red Carpet', ar: 'السجادة الحمراء' }, emoji: '🌟', pieces: [{ cat: 'outfit', tpl: ['hollywood', 'gown', 'prom', 'tuxedo', 'royal'] }, { cat: 'glasses', tpl: ['sunglasses', 'aviator', 'star', 'heart', 'shield_sunglasses'] }, { cat: 'acc', tpl: ['necklace', 'earrings', 'goldchain'] }, { cat: 'shoes', tpl: ['heels', 'gold_sneaker', 'platform'] }, { cat: 'hat', tpl: ['crown', 'tiara'] }], need: 3,
    perk: { giftLuck: 0.12, text: { en: '+12% chance of a rarer gift', ar: '+12% فرصة لهدية أندر' } } },
  { id: 'hero', name: { en: 'Super Squad', ar: 'فرقة الأبطال' }, emoji: '🦸', pieces: [{ cat: 'outfit', tpl: ['superhero', 'ninja', 'firefighter', 'liberty', 'uncle_sam'] }, { cat: 'acc', tpl: ['cape', 'wings', 'halo'] }, { cat: 'glasses', tpl: ['eyepatch', 'visor'] }, { cat: 'shoes', tpl: ['rocket_boots', 'boots'] }], need: 2,
    perk: { startEnergy: 4, text: { en: 'start every stage with +4 energy', ar: 'ابدأ كل مرحلة بـ +4 طاقة' } } },
  { id: 'pets', name: { en: 'Pet Parade', ar: 'موكب الحيوانات' }, emoji: '🐾', pieces: [{ cat: 'acc', tpl: ['pet_cat', 'pet_dog'] }], need: 1,
    perk: { petFinder: 40000, text: { en: 'your pet digs up a free item every 40 s', ar: 'حيوانك يجد قطعة مجانية كل 40 ثانية' } } },
  { id: 'beach', name: { en: 'West Coast', ar: 'الساحل الغربي' }, emoji: '🏄', pieces: [{ cat: 'outfit', tpl: ['surfer', 'lifeguard'] }, { cat: 'top', tpl: ['hawaiian', 'tank', 'crop_top'] }, { cat: 'bottom', tpl: ['shorts'] }, { cat: 'shoes', tpl: ['sandals', 'slides'] }, { cat: 'hat', tpl: ['bucket', 'visor_cap'] }, { cat: 'glasses', tpl: ['sunglasses', 'aviator', 'ski_goggles'] }], need: 3,
    perk: { reserveRegenMul: 0.5, text: { en: 'reserve energy regenerates 2× faster', ar: 'الطاقة الاحتياطية تتجدد أسرع مرتين' } } },
];
export const ALL_SETS = SETS;

// Which pieces of a set are currently worn (counts each piece selector once).
export function setProgress(set, equipped) {
  const worn = [];
  for (const sel of set.pieces) {
    const id = equipped && equipped[sel.cat]; const it = id && getItem(id);
    if (it && sel.tpl.includes(it.tpl)) worn.push(it.id);
  }
  return { worn, count: worn.length, need: set.need, active: worn.length >= set.need };
}
export function activeSets(equipped) { return SETS.filter(s => setProgress(s, equipped).active); }
// Merge the perks of every active set into one object the engine understands.
export function perksFor(equipped) {
  const p = { genCharges: {}, cooldownMul: 1, orderCoinsMul: 1, crateDrops: 0, bubbleMul: 1, bubbleMs: 0, startEnergy: 0, deliverEnergy: 0, giftLuck: 0, petFinder: 0, reserveRegenMul: 1, sets: [] };
  for (const s of activeSets(equipped)) {
    const k = s.perk;
    if (k.genCharges) for (const [ch, n] of Object.entries(k.genCharges)) p.genCharges[ch] = (p.genCharges[ch] || 0) + n;
    if (k.cooldownMul) p.cooldownMul *= k.cooldownMul;
    if (k.orderCoinsMul) p.orderCoinsMul *= k.orderCoinsMul;
    if (k.crateDrops) p.crateDrops += k.crateDrops;
    if (k.bubbleMul) p.bubbleMul *= k.bubbleMul;
    if (k.bubbleMs) p.bubbleMs += k.bubbleMs;
    if (k.startEnergy) p.startEnergy += k.startEnergy;
    if (k.deliverEnergy) p.deliverEnergy += k.deliverEnergy;
    if (k.giftLuck) p.giftLuck += k.giftLuck;
    if (k.petFinder) p.petFinder = k.petFinder;
    if (k.reserveRegenMul) p.reserveRegenMul *= k.reserveRegenMul;
    p.sets.push(s);
  }
  return p;
}
// For the wardrobe: which sets does this item belong to?
export function setsOfItem(item) { return SETS.filter(s => s.pieces.some(sel => sel.cat === item.cat && sel.tpl.includes(item.tpl))); }
