/**
 * Retour vers la vitrine (corpo) depuis le portfolio (creative).
 *  - masque la marque « SCORY » du portfolio ;
 *  - affiche « scory.dev » avec « CREATIVE » posé en coup de tampon (graffiti glitché)
 *    et la phrase « Développeur freelance… » dessous ;
 *  - au clic : tunnel dimensionnel (anneaux « CORPO ») + flash → navigation vers « / ».
 * Module autonome : injecte sa police, son CSS et son DOM.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const font = document.createElement('link');
font.rel = 'stylesheet';
font.href = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap';
document.head.appendChild(font);

const css = /* css */ `
.floating-brand{display:none!important;}

.rp-brand{position:fixed;top:18px;left:22px;z-index:99999;display:flex;flex-direction:column;gap:0;
  background:none;border:none;cursor:pointer;padding:8px 10px;text-align:left;line-height:1;
  font-family:'DM Sans',system-ui,sans-serif;}
.rp-mark{position:relative;display:inline-block;padding:6px 2px;}
.rp-dev{font-size:22px;font-weight:700;letter-spacing:-.01em;color:#ececee;}
.rp-dot{color:#c9a962;}
.rp-creative{position:absolute;left:46%;top:48%;transform:translate(-50%,-50%) rotate(-12deg);
  font-family:'Permanent Marker',cursive;font-size:28px;line-height:1;color:#fff;letter-spacing:1px;
  white-space:nowrap;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.5);}
.rp-creative::before,.rp-creative::after{content:attr(data-text);position:absolute;left:0;top:0;width:100%;overflow:hidden;}
.rp-creative::before{color:#c9a962;animation:rp-g1 2.2s infinite linear;clip-path:inset(0 0 58% 0);}
.rp-creative::after{color:#9ec8ff;animation:rp-g2 2.6s infinite linear;clip-path:inset(58% 0 0 0);}
.rp-brand:hover .rp-creative{filter:drop-shadow(0 0 9px rgba(201,169,98,.6));}
.rp-sub{display:block;margin-top:12px;max-width:248px;font-size:10.5px;line-height:1.45;color:#b9b6c8;
  font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.02em;}
@keyframes rp-g1{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,0)}}
@keyframes rp-g2{0%,100%{transform:translate(0,0)}25%{transform:translate(2px,-1px)}50%{transform:translate(-2px,1px)}75%{transform:translate(1px,1px)}}

.rp-portal{position:fixed;inset:0;z-index:99998;pointer-events:none;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(circle at 8% 8%,#241544 0%,#0a0618 45%,#050308 72%);clip-path:circle(0% at 8% 8%);}
.rp-portal.expand{transition:clip-path .7s cubic-bezier(.22,1,.36,1);clip-path:circle(150% at 8% 8%);pointer-events:all;}
.rp-warp{position:relative;width:min(80vmin,660px);height:min(80vmin,660px);opacity:0;transition:opacity .45s ease;}
.rp-portal.loading .rp-warp{opacity:1;}
.rp-swirl{position:absolute;inset:0;border-radius:50%;filter:blur(7px);animation:rp-spin 1.8s linear infinite;
  background:conic-gradient(from 0deg,transparent 0%,rgba(201,169,98,.28) 12%,transparent 30%,rgba(158,200,255,.34) 52%,transparent 70%,rgba(124,92,242,.3) 88%,transparent 100%);}
.rp-textring{position:absolute;inset:0;margin:auto;width:100%;height:100%;opacity:0;transform:scale(1.3);overflow:visible;
  animation:rp-absorb 1.6s cubic-bezier(.55,0,.85,.45) infinite;filter:drop-shadow(0 0 2.5px rgba(201,169,98,.6));}
.rp-textring.glacier{filter:drop-shadow(0 0 2.5px rgba(158,200,255,.55));}
.rp-textring text{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;fill:#e7cd92;}
.rp-textring.glacier text{fill:#bedcff;}
.rp-core{position:absolute;inset:0;margin:auto;width:14px;height:14px;border-radius:50%;background:#fff;
  box-shadow:0 0 30px 7px rgba(201,169,98,.8),0 0 80px 20px rgba(158,200,255,.5);animation:rp-pulse 1.2s ease-in-out infinite;}
.rp-flash{position:absolute;inset:0;margin:auto;width:16px;height:16px;border-radius:50%;opacity:0;transform:scale(0);
  background:radial-gradient(circle,#fff 0%,#c9a962 35%,#9ec8ff 65%,transparent 75%);}
.rp-portal.loading .rp-flash{animation:rp-flash 1.55s ease-in forwards;}
@keyframes rp-absorb{0%{transform:scale(1.3) rotate(0);opacity:0}18%{opacity:1}100%{transform:scale(0) rotate(150deg);opacity:0}}
@keyframes rp-spin{to{transform:rotate(360deg)}}
@keyframes rp-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.6)}}
@keyframes rp-flash{0%{transform:scale(0);opacity:0}72%{transform:scale(.4);opacity:0}86%{opacity:.9}100%{transform:scale(120);opacity:1}}
@media (prefers-reduced-motion:reduce){.rp-creative::before,.rp-creative::after,.rp-swirl,.rp-textring,.rp-core,.rp-flash{animation:none}}
@media (max-width:760px){ .rp-creative,.rp-sub{display:none} .rp-brand{padding:6px 8px} .rp-mark{padding:0} .rp-dev{font-size:18px} }
`;
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// Marque cliquable : scory.dev + tampon CREATIVE + phrase.
const brand = document.createElement('button');
brand.className = 'rp-brand';
brand.type = 'button';
brand.setAttribute('aria-label', 'Revenir au site · scory.dev');
brand.innerHTML =
  '<span class="rp-mark">' +
    '<span class="rp-dev">scory<span class="rp-dot">.dev</span></span>' +
    '<span class="rp-creative" data-text="CREATIVE">CREATIVE</span>' +
  '</span>' +
  '<span class="rp-sub">Développeur freelance · sites sur mesure &amp; expériences immersives</span>';
document.body.appendChild(brand);

// Tunnel dimensionnel « CORPO ».
const CORPO = 'CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO CORPO ';
const portal = document.createElement('div');
portal.className = 'rp-portal';
portal.setAttribute('aria-hidden', 'true');
let rings = '<span class="rp-swirl"></span>';
for (let i = 0; i < 8; i++) {
  const glacier = i % 2 ? ' glacier' : '';
  const delay = (i * 0.2).toFixed(2);
  rings +=
    `<svg class="rp-textring${glacier}" style="animation-delay:${delay}s" viewBox="0 0 200 200" aria-hidden="true">` +
    `<defs><path id="rpwp${i}" fill="none" d="M8,100 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"/></defs>` +
    `<text><textPath href="#rpwp${i}">${CORPO}</textPath></text></svg>`;
}
rings += '<span class="rp-core"></span>';
portal.innerHTML = `<div class="rp-warp">${rings}</div><span class="rp-flash"></span>`;
document.body.appendChild(portal);

brand.addEventListener('click', () => {
  if (reduced) { window.location.href = '/'; return; }
  portal.classList.add('expand');
  window.setTimeout(() => portal.classList.add('loading'), 480);
  window.setTimeout(() => { window.location.href = '/'; }, 2000);
});
