// Recurring NYC customers: real faces (the avatar rig at portrait size), a voice, and friendship levels.
// Deliveries raise friendship; every level pays a thank-you gift and unlocks "friend orders" with better tips.
// v5 (F6a): every regular has a voice POOL — 6 kinds (hi · thanks · hard · tip · lowEnergy · win), 2 lines each,
// EN+AR, one voice trait per character; `{hero}` and `{item}` placeholders. `line()` keeps its old signature,
// `lineFor(npc, kind, { hero, item })` picks a random line of the pool.
import { renderAvatar } from './avatar.js';
import { state, save } from './store.js';
import { getLang } from './i18n.js';

const L = (en, ar) => ({ en, ar });
export const NPCS = [
  // Mia — hungry drama
  { name: 'Mia', color: '#f472b6', gender: 'girl', skin: 1, look: { hair: 'hair_bob_black', top: 'top_crop_top_malibu', hat: null, glasses: null }, voice: {
    hi: [L("Hey {hero}! I'm starving.", 'هاي {hero}! أنا جوعانة.'), L('{hero}, feed me before I faint!', '{hero}، طعميني قبل ما أغمى!')],
    thanks: [L('You rock! 💖', 'أنت أسطورة! 💖'), L('{item}! You saved my life.', '{item}! أنقذت حياتي.')],
    hard: [L('Big order, {hero}. I skipped breakfast for this.', 'طلب كبير يا {hero}. فطوري فاتني عشانه.'), L('I need the whole {item} feast. No pressure.', 'أبغى وليمة {item} كاملة. بدون ضغط.')],
    tip: [L('Keep the change, neighbor.', 'خلّ الباقي لك يا جار.'), L('Extra for the fastest hands in NYC.', 'زيادة لأسرع يدين في نيويورك.')],
    lowEnergy: [L("You look tired, {hero}. Sit, I'll wait.", 'شكلك تعبان يا {hero}. اقعد، أنا أنتظر.'), L('Two taps left? Dramatic. I love it.', 'نقرتين باقي؟ دراما. أحبها.')],
    win: [L('Full and happy. Tomorrow, same drama?', 'شبعانة وسعيدة. بكرة نفس الدراما؟'), L('{hero}, you fed the whole block!', '{hero}، طعّمت الحي كله!')],
  } },
  // Jay — blunt hype
  { name: 'Jay', color: '#60a5fa', gender: 'boy', skin: 3, look: { hair: 'hair_curly_black', top: 'top_hoodie_red', hat: 'hat_snapback_ny' }, voice: {
    hi: [L('Yo {hero}, hook me up.', 'يو {hero}، جهّز لي طلبي.'), L("Let's go, {hero}. No slow hands today.", 'يلا يا {hero}. ما فيه بطء اليوم.')],
    thanks: [L('Respect. 🤝', 'احترام. 🤝'), L("{item}. Clean. That's it.", '{item}. نظيف. خلاص.')],
    hard: [L("Big one. Don't choke, {hero}.", 'طلب ثقيل. لا تنهار يا {hero}.'), L('I want {item}. The real one, not the cheap one.', 'أبغى {item}. الأصلي، مو الرخيص.')],
    tip: [L('That was fast, bro.', 'سريع يا وحش.'), L('Speed pays. Take it.', 'السرعة تدفع. خذها.')],
    lowEnergy: [L("Two taps? Make 'em count.", 'نقرتين؟ خلّهم يسوون.'), L('Low energy, {hero}. Big merges only.', 'طاقة قليلة يا {hero}. دمجات كبيرة بس.')],
    win: [L('Told you. {hero} runs this block.', 'قلت لك. {hero} يمشّي الحي.'), L('W. Another one tomorrow.', 'فوز. واحد ثاني بكرة.')],
  } },
  // Luis — warm Spanglish
  { name: 'Luis', color: '#f59e0b', gender: 'boy', skin: 2, look: { hair: 'hair_short_black', top: 'top_flannel_lumberjack', hat: 'hat_trucker_usa' }, voice: {
    hi: [L('¡Oye {hero}! One for the road.', 'أويه {hero}! واحد للطريق.'), L("Mi amigo {hero}, the truck's waiting.", 'صديقي {hero}، الشاحنة تنتظر.')],
    thanks: [L('Gracias, amigo.', 'غراسياس يا صديقي.'), L('{item}, perfecto. Mi familia eats tonight.', '{item}، بيرفكتو. عائلتي تتعشى الليلة.')],
    hard: [L('Big fiesta tonight, {hero}. I need {item}.', 'فييستا كبيرة الليلة يا {hero}. أحتاج {item}.'), L('Ay, this one is grande. Take your time, hermano.', 'آي، هذا كبير. خذ راحتك يا أخوي.')],
    tip: [L('Tell your mom I said hi.', 'سلّم على الوالدة.'), L('Un poco extra, for the hustle.', 'شوية زيادة، عشان الكدّ.')],
    lowEnergy: [L('Tranquilo, {hero}. Breathe, then merge.', 'ترانكيلو يا {hero}. تنفّس، بعدين ادمج.'), L('Low on gas? Mi abuela says: rest, then go.', 'بنزينك خلص؟ جدتي تقول: ارتاح، بعدين انطلق.')],
    win: [L('¡Eso! The whole block is proud, {hero}.', 'إيسو! الحي كله فخور يا {hero}.'), L('Another day, another win. ¡Vamos!', 'يوم ثاني، فوز ثاني. فاموس!')],
  } },
  // Ava — corporate
  { name: 'Ava', color: '#a78bfa', gender: 'girl', skin: 0, look: { hair: 'hair_long_blonde', top: 'top_blazer_navy', glasses: 'glasses_clear_frames_crystal' }, voice: {
    hi: [L('Morning {hero}. Busy day ahead.', 'صباح الخير {hero}. يوم مزدحم.'), L("{hero}, I have a 9:15. Let's be efficient.", '{hero}، عندي اجتماع 9:15. خلّنا نكون فعّالين.')],
    thanks: [L('Efficient. I like it.', 'سريع ومرتّب. أعجبني.'), L('{item}, delivered on schedule. Noted.', '{item}، سُلّم في موعده. مسجّل.')],
    hard: [L('Priority request: {item}. The board is watching.', 'طلب ذو أولوية: {item}. مجلس الإدارة يراقب.'), L("This one is a stretch goal, {hero}. Deliver and we'll talk promotion.", 'هذا هدف طموح يا {hero}. سلّمه ونتكلم عن الترقية.')],
    tip: [L('Put it on my card.', 'احسبها على بطاقتي.'), L('Expense it. Company money.', 'سجّلها مصروفات. فلوس الشركة.')],
    lowEnergy: [L('Resources are thin, {hero}. Prioritize.', 'الموارد قليلة يا {hero}. رتّب أولوياتك.'), L('Two taps left. Make a decision, not a wish.', 'نقرتين باقي. اتخذ قرارًا، مو أمنية.')],
    win: [L('Quarter closed. Excellent work, {hero}.', 'الربع أُغلق. عمل ممتاز يا {hero}.'), L("Targets met. I'll mention you upstairs.", 'الأهداف تحققت. بذكرك فوق.')],
  } },
  // Noah — coach-speak
  { name: 'Noah', color: '#34d399', gender: 'boy', skin: 1, look: { hair: 'hair_spiky_brown', top: 'top_jersey_green', hat: 'hat_sweatband_white' }, voice: {
    hi: [L('Coach says I need carbs, {hero}.', 'المدرب يقول أحتاج كربوهيدرات يا {hero}.'), L("Game day, {hero}. Let's warm up.", 'يوم المباراة يا {hero}. خلّنا نسخّن.')],
    thanks: [L('Fuel for the game! ⚡', 'طاقة للمباراة! ⚡'), L("{item}! That's a highlight play.", '{item}! هذي لقطة الأسبوع.')],
    hard: [L('Championship order, {hero}: {item}. Leave it all on the board.', 'طلب البطولة يا {hero}: {item}. اعطِ كل شي على اللوحة.'), L('Big play. Eyes up, hands fast.', 'لعبة كبيرة. عيونك فوق، يدينك سريعة.')],
    tip: [L('Courtside seats next time.', 'المرة الجاية مقاعد أمامية.'), L('Bonus for the MVP.', 'مكافأة لأفضل لاعب.')],
    lowEnergy: [L('Fourth quarter, {hero}. Dig deep.', 'الشوط الأخير يا {hero}. اصمد.'), L('Low tank? Champions finish anyway.', 'الخزان فاضي؟ الأبطال يكمّلون.')],
    win: [L('Buzzer beater! {hero} wins it.', 'تسديدة اللحظة الأخيرة! {hero} يفوز.'), L("That's a W for the team. Hit the showers.", 'فوز للفريق. روح استحم.')],
  } },
  // Zoe — influencer
  { name: 'Zoe', color: '#fb7185', gender: 'girl', skin: 2, look: { hair: 'hair_wavy_pink', top: 'top_tee_logo_star', glasses: 'glasses_heart_pink' }, voice: {
    hi: [L('OMG {hero}, content time!', 'يا سلام {hero}، وقت المحتوى!'), L('Hi besties! {hero} is cooking today.', 'هاي يا حلوين! {hero} يطبخ اليوم.')],
    thanks: [L('Posting this. 📸', 'بنشرها الحين. 📸'), L('{item} is SO aesthetic. Viral.', '{item} جمالية بزيادة. فايرال.')],
    hard: [L('Collab order, {hero}: {item}. My followers are watching.', 'طلب تعاون يا {hero}: {item}. متابعيني يشوفون.'), L("Main character moment. Don't fumble it.", 'لحظة البطل الرئيسي. لا تضيّعها.')],
    tip: [L('Tag me, superstar.', 'منشنّي يا نجم.'), L('Extra for the link in bio.', 'زيادة عشان الرابط في البايو.')],
    lowEnergy: [L('Low battery vibes, {hero}. Stay iconic.', 'بطارية ضعيفة يا {hero}. خلّك أيقونة.'), L("Two taps? That's a cliffhanger. Part 2 soon.", 'نقرتين؟ هذي نهاية مشوّقة. الجزء الثاني قريب.')],
    win: [L('Slay, {hero}. This is going on the story.', 'أبدعت يا {hero}. بتروح على الستوري.'), L('Comments are blowing up. Legend.', 'التعليقات انفجرت. أسطورة.')],
  } },
  // Omar — polite "the usual"
  { name: 'Omar', color: '#38bdf8', gender: 'boy', skin: 2, look: { hair: 'hair_side_black', top: 'top_polo_white', glasses: 'glasses_square_black' }, voice: {
    hi: [L('Salam {hero}. The usual?', 'سلام {hero}. نفس الطلب؟'), L('Good to see you, {hero}. Same as always, please.', 'منوّر يا {hero}. نفس الطلب لو سمحت.')],
    thanks: [L('Yalla, perfect.', 'يلا، ممتاز.'), L('{item}, just like always. Shukran.', '{item}، مثل كل مرة. شكرًا.')],
    hard: [L('A special one today, {hero}: {item}. For the family.', 'طلب خاص اليوم يا {hero}: {item}. للعائلة.'), L('Bigger than the usual. I trust you.', 'أكبر من المعتاد. أثق فيك.')],
    tip: [L('For the hustle.', 'عشان الكدّ.'), L('A little extra, habibi.', 'شوية زيادة يا حبيبي.')],
    lowEnergy: [L('Take your time, {hero}. The usual can wait.', 'خذ راحتك يا {hero}. الطلب المعتاد يستنى.'), L('No rush. Tea first, merges after.', 'بدون عجلة. شاي أول، والدمج بعدين.')],
    win: [L('Mabrook, {hero}. See you tomorrow, same time.', 'مبروك يا {hero}. أشوفك بكرة نفس الوقت.'), L('Well done. The usual, tomorrow?', 'أحسنت. نفس الطلب بكرة؟')],
  } },
  // Lily — sweet
  { name: 'Lily', color: '#fbbf24', gender: 'girl', skin: 1, look: { hair: 'hair_braids_brown', top: 'top_sweater_cream', hat: 'hat_beanie_pink' }, voice: {
    hi: [L('Hi {hero}! Something sweet?', 'هاي {hero}! شي حلو؟'), L('Hello hello! {hero}, I brought a smile.', 'هلا هلا! {hero}، جبت لك ابتسامة.')],
    thanks: [L('Yay! 🌼', 'يااي! 🌼'), L("{item}! You're the sweetest.", '{item}! أنت الأحلى.')],
    hard: [L("A big sweet order, {hero}: {item}. It's for a birthday!", 'طلب حلو وكبير يا {hero}: {item}. عشان عيد ميلاد!'), L("Pretty please? It's a lot, but you're amazing.", 'لو سمحت؟ كثير، بس أنت رائع.')],
    tip: [L('You made my day.', 'سعدت يومي.'), L('A little thank-you cookie money.', 'شوية فلوس كوكيز عشان الشكر.')],
    lowEnergy: [L("Almost empty, {hero}? You've got this. 🌼", 'قربت تخلص يا {hero}؟ تقدر. 🌼'), L('Take a breath. Flowers grow slowly too.', 'خذ نفس. الورد كمان ينمو بهدوء.')],
    win: [L('You did it! Happy dance!', 'سويتها! رقصة فرح!'), L('{hero}, the block is smiling today.', '{hero}، الحي كله يبتسم اليوم.')],
  } },
  // Max — fast-talker
  { name: 'Max', color: '#4ade80', gender: 'boy', skin: 0, look: { hair: 'hair_pompadour_blonde', top: 'top_denim_jacket_classic', glasses: 'glasses_aviator_gold' }, voice: {
    hi: [L("{hero}! Let's make it quick.", '{hero}! خلّها سريعة.'), L("Tick tock, {hero}. Order's in, go go go.", 'تك توك يا {hero}. الطلب دخل، يلا يلا.')],
    thanks: [L('Smooth.', 'سلس.'), L('{item}, done, next. Love it.', '{item}، خلص، التالي. حبيته.')],
    hard: [L('Big ticket: {item}. No time to blink.', 'طلب ثقيل: {item}. ما فيه وقت للرمش.'), L('Double trouble, {hero}. Fast hands win.', 'طلب مزدوج يا {hero}. اليدين السريعة تفوز.')],
    tip: [L('Keep rising, star.', 'كمّل صعود يا بطل.'), L("Extra. Don't spend it all at once. Or do.", 'زيادة. لا تصرفها دفعة وحدة. أو اصرفها.')],
    lowEnergy: [L('Running on fumes? Quick merges, {hero}.', 'تمشي على الاحتياطي؟ دمجات سريعة يا {hero}.'), L('Two taps. Think fast, tap faster.', 'نقرتين. فكّر بسرعة، اضغط أسرع.')],
    win: [L("Done already? {hero}, you're a machine.", 'خلصت بهالسرعة؟ {hero}، أنت آلة.'), L('Fastest on the block. Next!', 'الأسرع في الحي. التالي!')],
  } },
  // Nina — fashion critic
  { name: 'Nina', color: '#c084fc', gender: 'girl', skin: 3, look: { hair: 'hair_bun_black', top: 'top_turtleneck_black', acc: 'acc_earrings_hoop' }, voice: {
    hi: [L('Darling {hero}, impress me.', 'عزيزي {hero}، أبهرني.'), L("{hero}. That outfit… we'll discuss. Order first.", '{hero}. هاللبس… نتكلم عنه. الطلب أول.')],
    thanks: [L('Chic. Truly.', 'أنيق. بجد.'), L('{item}. Finally, taste.', '{item}. أخيرًا، ذوق.')],
    hard: [L('Couture order: {item}. Anything less is off-season.', 'طلب فاخر: {item}. أي شي أقل خارج الموسم.'), L('I expect perfection, {hero}. I always do.', 'أتوقع الكمال يا {hero}. دائمًا.')],
    tip: [L('My stylist will hear about you.', 'مصمّمي بيسمع عنك.'), L('A bonus. Buy something with a collar.', 'مكافأة. اشترِ شي له ياقة.')],
    lowEnergy: [L('Tired, {hero}? Exhaustion is not a look.', 'تعبان يا {hero}؟ الإرهاق مو ستايل.'), L('Two taps. Make them elegant.', 'نقرتين. خلّهم أنيقين.')],
    win: [L("Runway-ready. I'm almost impressed.", 'جاهز للمنصة. تقريبًا انبهرت.'), L('{hero}, that was… fashion.', '{hero}، هذي كانت… موضة.')],
  } },
  // Leo — one-word fuel
  { name: 'Leo', color: '#fb923c', gender: 'boy', skin: 4, look: { hair: 'hair_buzz_black', top: 'top_windbreaker_neon', hat: 'hat_cap_black' }, voice: {
    hi: [L('Sup {hero}. Fuel me up.', 'كيفك {hero}. عبّيني.'), L('{hero}. Order. Go.', '{hero}. الطلب. يلا.')],
    thanks: [L('Clean. 🔥', 'نظيف. 🔥'), L('{item}. Fire.', '{item}. نار.')],
    hard: [L('Big. {item}. Now.', 'كبير. {item}. الحين.'), L('Heavy order, {hero}. Lift.', 'طلب ثقيل يا {hero}. ارفع.')],
    tip: [L('Run it back tomorrow.', 'نعيدها بكرة.'), L('Bonus. Earned.', 'مكافأة. تستاهلها.')],
    lowEnergy: [L('Low. Breathe.', 'قليل. تنفّس.'), L('Two. Make. Count.', 'نقرتين. خلّهم. يسوون.')],
    win: [L('W.', 'فوز.'), L('{hero}. Beast.', '{hero}. وحش.')],
  } },
  // Sofia — runner metaphors
  { name: 'Sofia', color: '#2dd4bf', gender: 'girl', skin: 2, look: { hair: 'hair_ponytail_brown', top: 'top_tshirt_sky', hat: 'hat_visor_cap_white' }, voice: {
    hi: [L('Hola {hero}! Post-run snack?', 'هولا {hero}! وجبة بعد الجري؟'), L('Mile 10 of 12, {hero}. Need a refuel.', 'الميل 10 من 12 يا {hero}. أحتاج تزوّد.')],
    thanks: [L('Perfecto!', 'بيرفكتو!'), L('{item}! Personal best, thanks to you.', '{item}! رقمي الشخصي، بفضلك.')],
    hard: [L('Marathon order, {hero}: {item}. Pace yourself.', 'طلب ماراثون يا {hero}: {item}. نظّم سرعتك.'), L('Long distance today. Steady merges win.', 'مسافة طويلة اليوم. الدمج الثابت يفوز.')],
    tip: [L('Race you to Beverly Hills.', 'أسابقك لبيفرلي هيلز.'), L('A little extra for the final sprint.', 'شوية زيادة عشان السباق الأخير.')],
    lowEnergy: [L('Hitting the wall, {hero}? Push through it.', 'وصلت الحاجز يا {hero}؟ اخترقه.'), L('Last mile. Short steps, keep moving.', 'الميل الأخير. خطوات قصيرة، كمّل.')],
    win: [L('Finish line! {hero}, new record.', 'خط النهاية! {hero}، رقم جديد.'), L('Cooldown jog, then tomorrow we go again.', 'جري خفيف، وبكرة نعيدها.')],
  } },
];
export const VOICE_KINDS = ['hi', 'thanks', 'hard', 'tip', 'lowEnergy', 'win'];
export const npcByName = name => NPCS.find(n => n.name === name) || NPCS[0];
// F6c cast per home, indexed by home tier (store.tierFor): Sidewalk · Brooklyn · Manhattan · Suburbs · Beverly Hills.
// levels.js draws 80 % of a stage's orders from the tier's cast and 20 % drop-ins from earlier casts, so the first
// friendship level lands by stage 6–7 instead of being spread over 12 names.
const ALL12 = NPCS.map(n => n.name);
export const CAST = [['Luis', 'Mia', 'Jay', 'Lily'], ['Omar', 'Noah', 'Zoe', 'Sofia'], ['Ava', 'Nina', 'Max', 'Leo'], ALL12, ALL12];

// Daily Hustle hosts (F4): weekday → host + chain preference list (resolved against CHAIN_UNLOCK in levels.js)
// + 2 host lines (brief + win). Indexed by Date#getDay(): 0 = Sunday.
export const HOSTS = [
  { day: 0, name: 'Lily', chains: ['food', 'home'], title: L('Sweet Sunday', 'أحد حلو'), lines: { brief: L("My orders today are all treats. Let's make the block smile!", 'طلباتي اليوم كلها حلويات. خلّنا نخلي الحي يبتسم!'), win: L('Sweetest Sunday ever. Thank you, {hero}!', 'أحلى أحد. شكرًا يا {hero}!') } },
  { day: 1, name: 'Omar', chains: ['home', 'food'], title: L('The Usual Monday', 'اثنين المعتاد'), lines: { brief: L('New week, same orders, same trust. The usual, {hero}.', 'أسبوع جديد، نفس الطلبات، نفس الثقة. الطلب المعتاد يا {hero}.'), win: L('Monday handled. Mabrook, {hero}.', 'الاثنين انضبط. مبروك يا {hero}.') } },
  { day: 2, name: 'Ava', chains: ['tech', 'money'], title: L('Tech Tuesday', 'ثلاثاء التقنية'), lines: { brief: L('Quarterly push: every order is mine today. Hit the targets.', 'ضغطة الربع: كل الطلبات لي اليوم. حقّق الأهداف.'), win: L('Targets met ahead of schedule. Noted, {hero}.', 'الأهداف تحققت قبل الموعد. مسجّل يا {hero}.') } },
  { day: 3, name: 'Noah', chains: ['money', 'food'], title: L('Game Day Wednesday', 'أربعاء المباراة'), lines: { brief: L('Mid-week scrimmage, {hero}. My orders are the playbook.', 'تدريب منتصف الأسبوع يا {hero}. طلباتي هي خطة اللعب.'), win: L('Clean sheet. Coach would be proud, {hero}.', 'شباك نظيفة. المدرب بيفخر فيك يا {hero}.') } },
  { day: 4, name: 'Jay', chains: ['money', 'fashion'], title: L('Cash Thursday', 'خميس الكاش'), lines: { brief: L('Payday vibes. Every order pays me, every delivery pays you.', 'أجواء الراتب. كل طلب لي، وكل تسليم لك.'), win: L('Big day. {hero} got paid.', 'يوم كبير. {hero} انضبط.') } },
  { day: 5, name: 'Mia', chains: ['fashion', 'food'], title: L('Thrift Friday', 'جمعة الثريفت'), lines: { brief: L("Thrift Friday! Fashion first, snacks second. I'm starving either way.", 'جمعة الثريفت! الموضة أول، والسناك ثاني. جوعانة بالحالتين.'), win: L('Best thrift haul ever. You feed AND dress me, {hero}!', 'أحلى غنائم ثريفت. تطعمني وتلبّسني يا {hero}!') } },
  { day: 6, name: 'Luis', chains: ['food'], title: L('Lunch Rush', 'زحمة الغداء'), lines: { brief: L('Lunch rush, hermano! The truck line is around the block.', 'زحمة الغداء يا أخوي! طابور الشاحنة لف الحي.'), win: L('Rush survived. ¡Eso, {hero}!', 'الزحمة انتهت. إيسو يا {hero}!') } },
];
export const hostFor = (d = new Date()) => HOSTS[d.getDay()] || HOSTS[0];

// Portrait: head crop of the rig wearing the NPC's look (falls back gracefully if an item id does not exist).
const cache = new Map();
export function portrait(npc) {
  if (cache.has(npc.name)) return cache.get(npc.name);
  const eq = { hair: npc.look.hair || null, top: npc.look.top || null, hat: npc.look.hat || null, glasses: npc.look.glasses || null, acc: npc.look.acc || null, bottom: null, shoes: null, outfit: null };
  const svg = renderAvatar({ gender: npc.gender, skin: npc.skin, equipped: eq, mood: 2 }, { anim: false }).replace('viewBox="0 0 320 520"', 'viewBox="60 20 200 230"');
  cache.set(npc.name, svg); return svg;
}

// ---------- voices ----------
const FALLBACK_HERO = { en: 'friend', ar: 'صديقي' };
const FALLBACK_ITEM = { en: 'that', ar: 'الطلب' };
const fill = (s, lang, hero, item) => {
  const h = hero === undefined || hero === null || hero === '' ? FALLBACK_HERO[lang] : String(hero);
  const it = item === undefined || item === null ? FALLBACK_ITEM[lang] : (typeof item === 'object' ? (item[lang] || item.en || item.ar) : String(item));
  return s.replace(/\{hero\}/g, h).replace(/\{item\}/g, it);
};
// Random line of the pool for `kind` (falls back to 'hi'); returns { en, ar } with placeholders filled.
export function lineFor(npc, kind, opts = {}) {
  const voice = (npc && npc.voice) || NPCS[0].voice;
  const pool = voice[kind] || voice.hi;
  const v = Array.isArray(pool) ? pool[Math.floor(Math.random() * pool.length)] : pool;
  return { en: fill(v.en, 'en', opts.hero, opts.item), ar: fill(v.ar, 'ar', opts.hero, opts.item) };
}
// Legacy signature (play.js / hub.js): same result, hero only.
export function line(npc, kind, hero, item) { return lineFor(npc, kind, { hero, item }); }
// Current-language string helper for the pop / bubble.
export const say = (npc, kind, opts = {}) => lineFor(npc, kind, opts)[getLang()] || lineFor(npc, kind, opts).en;

// ---------- friendship ----------
export const FRIEND_STEP = 5;                                   // deliveries per level
export const FRIEND_REWARD = [0, 120, 250, 400, 600, 900];      // coins per level reached
export function friends() { if (!state.friends) state.friends = {}; return state.friends; }
export function friendLevel(name) { return Math.floor((friends()[name] || 0) / FRIEND_STEP); }
export function friendProgress(name) { return (friends()[name] || 0) % FRIEND_STEP; }
// returns { level, leveledUp, reward } after one delivery
export function recordDelivery(name) {
  const f = friends(); const before = friendLevel(name); f[name] = (f[name] || 0) + 1; save();
  const level = friendLevel(name); const leveledUp = level > before;
  return { level, leveledUp, reward: leveledUp ? (FRIEND_REWARD[Math.min(level, FRIEND_REWARD.length - 1)]) : 0 };
}
export const bestFriends = () => NPCS.map(n => ({ npc: n, level: friendLevel(n.name), deliveries: friends()[n.name] || 0 })).sort((a, b) => b.deliveries - a.deliveries);

// ---------- portraitOf (v5 Rival Row): head crop of ANY rig state, not only NPCs ----------
// look = equipped-shaped object ({ hair, top, outfit, hat, glasses, acc, ... }); bottom/shoes are ignored by the crop.
// Cached by `key` when given (rivals pass id+weekKey), otherwise by the look itself. Bounded cache.
const portraitCache = new Map();
export function portraitOf({ gender = 'boy', skin = 1, look = {}, key = null, mood = 2 } = {}) {
  const eq = { hair: look.hair || null, top: look.top || null, outfit: look.outfit || null, hat: look.hat || null, glasses: look.glasses || null, acc: look.acc || null, bottom: null, shoes: null, bg: null };
  const k = key || `${gender}|${skin}|${mood}|${eq.hair}|${eq.top}|${eq.outfit}|${eq.hat}|${eq.glasses}|${eq.acc}`;
  if (portraitCache.has(k)) return portraitCache.get(k);
  const svg = renderAvatar({ gender, skin, equipped: eq, mood }, { anim: false }).replace('viewBox="0 0 320 520"', 'viewBox="60 20 200 230"');
  if (portraitCache.size > 64) portraitCache.delete(portraitCache.keys().next().value);
  portraitCache.set(k, svg);
  return svg;
}
