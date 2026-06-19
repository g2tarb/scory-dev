/**
 * Habille le chatbot du portfolio en TV cathodique (CRT) ultra-futuriste.
 *  - bezel plastique, écran bombé, lueur phosphore,
 *  - scanlines + barre de balayage qui défile,
 *  - grésillement / static animé, flicker,
 *  - LED de power + label « SCORY-TV ».
 * Module autonome : injecte son CSS et quelques éléments décoratifs.
 */

const NOISE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23n)'/></svg>";

const css = /* css */ `
#chatbot-section .chatbot-container{
  position: relative !important; isolation: isolate; overflow: hidden !important;
  border: 16px solid #14111c !important; border-radius: 28px !important;
  background: radial-gradient(125% 125% at 50% 38%, #0b181d 0%, #060c10 62%, #03060a 100%) !important;
  box-shadow:
    0 0 0 2px #000,
    0 0 70px rgba(110,200,255,0.20),
    0 26px 70px rgba(0,0,0,0.65),
    inset 0 0 70px rgba(0,60,90,0.45),
    inset 0 0 140px rgba(0,0,0,0.75) !important;
}
/* phosphore : léger glow sur le texte */
#chatbot-section .chatbot-messages, #chatbot-section .chatbot-pills,
#chatbot-section .chatbot-name, #chatbot-section .chatbot-footer{
  text-shadow: 0 0 5px rgba(120,205,255,0.45);
}
/* scanlines + barre de balayage qui descend + flicker */
#chatbot-section .chatbot-container::before{
  content:''; position:absolute; inset:0; z-index:6; pointer-events:none;
  background:
    linear-gradient(rgba(150,225,255,0.07), rgba(150,225,255,0) 40%) 0 0 / 100% 240px no-repeat,
    repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.30) 3px, rgba(0,0,0,0) 4px);
  animation: crt-roll 7s linear infinite, crt-flicker 0.13s steps(2) infinite;
}
/* grésillement / static */
#chatbot-section .chatbot-container::after{
  content:''; position:absolute; inset:-20%; z-index:5; pointer-events:none;
  background: url("${NOISE}"); background-size: 180px 180px;
  opacity: 0.07; mix-blend-mode: screen;
  animation: crt-static 0.22s steps(4) infinite;
}
@keyframes crt-roll { 0%{ background-position: 0 -240px, 0 0; } 100%{ background-position: 0 110%, 0 8px; } }
@keyframes crt-flicker { 0%{ opacity:.92; } 50%{ opacity:1; } 100%{ opacity:.94; } }
@keyframes crt-static { 0%{ transform:translate(0,0); } 25%{ transform:translate(-3%,2%); } 50%{ transform:translate(2%,-2%); } 75%{ transform:translate(-2%,-1%); } 100%{ transform:translate(2%,2%); } }

/* power-on : léger battement de luminosité de l'écran */
#chatbot-section .chatbot-container{ animation: crt-breathe 4s ease-in-out infinite; }
@keyframes crt-breathe { 0%,100%{ filter: brightness(1); } 50%{ filter: brightness(1.06); } }

/* LED + label sur le bezel */
.crt-led{ position:absolute; right:18px; bottom:-11px; width:8px; height:8px; border-radius:50%;
  background:#ff5a4d; box-shadow:0 0 8px 2px rgba(255,90,77,0.8); z-index:7; animation: crt-led 2.4s ease-in-out infinite; }
@keyframes crt-led { 0%,100%{ opacity:.5; } 50%{ opacity:1; } }
.crt-label{ position:absolute; left:18px; bottom:-13px; z-index:7;
  font-family:'JetBrains Mono',ui-monospace,monospace; font-size:9px; letter-spacing:2px;
  color:rgba(120,205,255,0.65); text-transform:uppercase; }

@media (prefers-reduced-motion: reduce){
  #chatbot-section .chatbot-container,
  #chatbot-section .chatbot-container::before,
  #chatbot-section .chatbot-container::after,
  .crt-led{ animation: none !important; }
}
`;

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// Éléments décoratifs (LED + label) une fois le DOM prêt.
function decorate() {
  const c = document.querySelector('#chatbot-section .chatbot-container');
  if (!c || c.querySelector('.crt-led')) return;
  const led = document.createElement('span');
  led.className = 'crt-led';
  led.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'crt-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = 'SCORY-TV · CH 01';
  c.append(led, label);
}
if (document.readyState !== 'loading') decorate();
else document.addEventListener('DOMContentLoaded', decorate);
