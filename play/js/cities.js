// World Tour (1.0.1): 1,000 stages after the mansion. Stage 31 on, the hero tours 20 cities of 50 stages each
// (stages 31-1030); every city adds its own board rule and the energy budget tightens step by step (TIGHT below,
// measured with tools/balance_bot.js). Past stage 1030 the World Champion encore replays the last five cities
// (js/levels.js getLevel).
// Pure data + helpers: js/levels.js reads the knobs, js/tour.js owns the energy gate and the UI.
export const TOUR_START = 31, CITY_LEN = 50;
export const ENTRY_COST = 5;                 // reserve energy to start (or retry) a tour stage; stages 1-30 stay free

// Board rules (levels.js generate): fog +n edge tiles, locked +n, clutter +fraction, junk +n sell fodder, walls =
// a WALLS shape, crowd = 4 orders, twin = medium orders ask for two, lean = generators hold 7 charges (12 s
// cooldown), spark = energy drop rate multiplier, bubbles = bubble chance. `ease` nudges a city's budget after
// the bot (heavy rule mixes get a little back so every city lands in the same pass band).
export const WALLS = {
  pillars: [[2, 1], [2, 5], [5, 1], [5, 5]],
  corners: [[0, 0], [0, 6], [7, 0], [7, 6]],
  center: [[3, 3], [4, 3]],
};
const N = (en, ar) => ({ en, ar });
export const CITIES = [
  { id: 'vegas', name: N('Las Vegas', 'لاس فيغاس'), rule: N('Lucky bubbles, and more locked items', 'فقاعات الحظ، وعناصر مقفلة أكثر'), mods: { bubbles: 0.22, locked: 1 } },
  { id: 'miami', name: N('Miami', 'ميامي'), rule: N('Beach fog hides the edges', 'ضباب الشاطئ يغطي الأطراف'), mods: { fog: 3 }, ease: 0.03 },
  { id: 'rio', name: N('Rio de Janeiro', 'ريو دي جانيرو'), rule: N('Carnival crowd: four orders on most stages', 'زحمة الكرنفال: أربع طلبات في أغلب المراحل'), mods: { crowd: true }, ease: -0.03 },
  { id: 'london', name: N('London', 'لندن'), rule: N('Rainy streets: fewer energy sparks', 'شوارع ممطرة: شرارات طاقة أقل'), mods: { spark: 0.5, fog: 1 }, ease: -0.03 },
  { id: 'paris', name: N('Paris', 'باريس'), rule: N('Runway pillars block four cells', 'أعمدة المنصة تسد أربع خانات'), mods: { walls: 'pillars' } },
  { id: 'milan', name: N('Milan', 'ميلانو'), rule: N('Fashion week: doubles on every medium order', 'أسبوع الموضة: كل طلب متوسط يطلب قطعتين'), mods: { twin: true, locked: 1 }, ease: -0.03 },
  { id: 'rome', name: N('Rome', 'روما'), rule: N('Ancient ruins wall off the corners', 'آثار قديمة تسد الزوايا'), mods: { walls: 'corners', fog: 2 } },
  { id: 'istanbul', name: N('Istanbul', 'إسطنبول'), rule: N('Grand Bazaar: a crowded board, sell to make room', 'البازار الكبير: لوحة مزدحمة، بِع لتفضي مكانًا'), mods: { clutter: 0.12, junk: 2 }, ease: -0.05 },
  { id: 'cairo', name: N('Cairo', 'القاهرة'), rule: N('Desert heat: generators hold fewer charges', 'حر الصحراء: المولدات تحمل شحنات أقل'), mods: { lean: true, fog: 1 }, ease: -0.045 },
  { id: 'dubai', name: N('Dubai', 'دبي'), rule: N('Sky-high orders and more locked items', 'طلبات عالية وعناصر مقفلة أكثر'), mods: { crowd: true, locked: 2 }, ease: -0.05 },
  { id: 'mumbai', name: N('Mumbai', 'مومباي'), rule: N('Monsoon: fog, bubbles and fewer sparks', 'موسم الأمطار: ضباب وفقاعات وشرارات أقل'), mods: { fog: 3, bubbles: 0.2, spark: 0.7 }, ease: -0.035 },
  { id: 'bangkok', name: N('Bangkok', 'بانكوك'), rule: N('Night market: clutter and double orders', 'سوق الليل: زحمة وطلبات مضاعفة'), mods: { clutter: 0.1, twin: true }, ease: 0.03 },
  { id: 'singapore', name: N('Singapore', 'سنغافورة'), rule: N('Garden walls in the middle, lean generators', 'جدران الحديقة بالوسط ومولدات بشحنات أقل'), mods: { walls: 'center', lean: true }, ease: 0.01 },
  { id: 'seoul', name: N('Seoul', 'سيول'), rule: N('K-style rush: extra orders, doubles on medium', 'زحمة سيول: طلبات أكثر والمتوسط قطعتين'), mods: { crowd: true, twin: true } },
  { id: 'tokyo', name: N('Tokyo', 'طوكيو'), rule: N('Rush hour: lean generators, few sparks', 'ساعة الذروة: مولدات بشحنات أقل وشرارات قليلة'), mods: { lean: true, spark: 0.6, locked: 1 }, ease: -0.01 },
  { id: 'sydney', name: N('Sydney', 'سيدني'), rule: N('Harbour fog and walled corners', 'ضباب الميناء وزوايا مسدودة'), mods: { walls: 'corners', fog: 3, locked: 1 }, ease: -0.045 },
  { id: 'capetown', name: N('Cape Town', 'كيب تاون'), rule: N('Mountain clutter and lean generators', 'زحمة الجبل ومولدات بشحنات أقل'), mods: { clutter: 0.12, junk: 2, lean: true }, ease: -0.015 },
  { id: 'monaco', name: N('Monaco', 'موناكو'), rule: N('Grand Prix: extra orders, doubles, few sparks', 'الجائزة الكبرى: طلبات أكثر ومضاعفة وشرارات قليلة'), mods: { crowd: true, twin: true, spark: 0.6 }, ease: 0.025 },
  { id: 'newyork', name: N('New York', 'نيويورك'), rule: N('Back home: fog, locks, crowds and pillars', 'العودة للبيت: ضباب وأقفال وزحمة وأعمدة'), mods: { walls: 'pillars', fog: 2, locked: 2, crowd: true }, ease: -0.085 },
  { id: 'riyadh', name: N('Riyadh', 'الرياض'), rule: N('Grand finale: every rule at once', 'النهائي الكبير: كل القوانين مع بعض'), mods: { walls: 'center', fog: 2, locked: 2, crowd: true, twin: true, lean: true, spark: 0.6 }, ease: -0.085 },
];
export const TOUR_END = TOUR_START + CITY_LEN * CITIES.length - 1;   // 1030
// per-stage designer bonus (energy) for tour layouts the human-like bot won under 50 % of the time, raised until it
// wins at least 2 runs in 3 (King's rule, as STAGE_BONUS in levels.js: never cut, only add). tools/balance_bot.js
// tourBonus() rebuilds it after any change to the generator or to the knobs above.
export const TOUR_BONUS = { 246: 2, 341: 5, 491: 4, 763: 2, 779: 3, 813: 7, 818: 4, 854: 4, 873: 7, 971: 6, 977: 4, 982: 4, 983: 3, 987: 6, 994: 5, 998: 3, 1002: 3, 1006: 8, 1009: 5, 1021: 6 };
export const CITY_REWARD = { gems: 10, coins: 1000 };                // paid once per city, on its 50th stage

// energy budget multiplier on the classic formula: 0.65 at stage 31 down to 0.47 from stage ~730 on. The classic
// stages are loose (the bot wins them all using ~40 % of the budget, a 70 %-random human-like bot too); at these
// values the human-like bot (tools/balance_bot.js, waste 0.7, no rescues) wins ~95 % early and ~85 % late.
const TIGHT = { start: 0.65, end: 0.47, over: 700 };
export const tightFor = n => TIGHT.start - (TIGHT.start - TIGHT.end) * Math.min(1, Math.max(0, n - TOUR_START) / TIGHT.over);

// null before the tour; otherwise { idx, city, step (1-50), finale, champion, ramp 0..1, tight }
export function tourFor(n) {
  if (!(n >= TOUR_START)) return null;
  const champion = n > TOUR_END;
  const idx = champion ? CITIES.length - 1 : Math.floor((n - TOUR_START) / CITY_LEN);
  const step = champion ? n - TOUR_END : (n - TOUR_START) % CITY_LEN + 1;
  const city = CITIES[idx];
  const ramp = Math.min(1, (n - TOUR_START) / (TOUR_END - TOUR_START));
  return { n, idx, city, step, finale: !champion && step === CITY_LEN, champion, ramp, tight: tightFor(n) + (city.ease || 0), mods: city.mods };
}
export const entryCost = n => (n >= TOUR_START ? ENTRY_COST : 0);
// cities finished once `stage` is the next stage to play
export const citiesDone = stage => Math.max(0, Math.min(CITIES.length, Math.floor(((stage || 1) - TOUR_START) / CITY_LEN)));
