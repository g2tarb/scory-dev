/**
 * SCORY — audio.js
 * Ambient 100 % synthétisé (Web Audio) — original, libre de droits, 0 octet.
 * Accord doux (Cmaj9) + filtre lowpass animé par un LFO. Toggle, slider, visualiseur.
 * Module autonome — zéro dépendance, zéro fichier audio.
 */

const BARS = 12;
const CHORD = [130.81, 164.81, 196.0, 246.94, 293.66]; // C3 E3 G3 B3 D4 (Cmaj9)

export function initAudio() {
  const soundToggle = document.getElementById("sound-toggle");
  if (!soundToggle) return;

  let audioCtx = null;
  let master = null;
  let analyser = null;
  let soundOn = false;
  let vizRaf = 0;

  const iconOff = soundToggle.querySelector(".sound-icon--off");
  const iconOn = soundToggle.querySelector(".sound-icon--on");

  const vizContainer = document.createElement("div");
  vizContainer.className = "sound-viz";
  for (let i = 0; i < BARS; i++) {
    const bar = document.createElement("span");
    bar.className = "sound-viz__bar";
    bar.style.setProperty("--i", i);
    vizContainer.appendChild(bar);
  }
  soundToggle.appendChild(vizContainer);
  const barEls = vizContainer.querySelectorAll(".sound-viz__bar");

  const volSlider = document.createElement("input");
  volSlider.type = "range";
  volSlider.min = "0";
  volSlider.max = "100";
  volSlider.value = "30";
  volSlider.className = "sound-volume";
  volSlider.setAttribute("aria-label", "Volume");
  soundToggle.parentElement.appendChild(volSlider);
  volSlider.style.display = "none";

  // Construit le graphe ambient une seule fois (après un geste utilisateur).
  function createAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    master = audioCtx.createGain();
    master.gain.value = 0;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 760;
    filter.Q.value = 6;

    // Mouvement : LFO lent sur la fréquence de coupure.
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Nappe : oscillateurs détunés, aigus plus discrets.
    CHORD.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 2) * 5;
      const g = audioCtx.createGain();
      g.gain.value = 0.18 / (1 + i * 0.35);
      o.connect(g);
      g.connect(filter);
      o.start();
    });

    filter.connect(master);
    master.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  const setVol = (v) => master && master.gain.setTargetAtTime(v, audioCtx.currentTime, 0.4);

  function vizLoop() {
    if (!soundOn) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    for (let i = 0; i < BARS; i++) {
      const val = data[Math.floor((i * data.length) / BARS)] / 255;
      barEls[i].style.transform = `rotate(${i * 30}deg) scaleY(${0.3 + val * 1.3})`;
      barEls[i].style.opacity = 0.3 + val * 0.7;
    }
    vizRaf = requestAnimationFrame(vizLoop);
  }

  soundToggle.addEventListener("click", () => {
    createAudio();
    soundOn = !soundOn;
    if (soundOn) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      setVol(volSlider.value / 100);
      volSlider.style.display = "block";
      vizLoop();
    } else {
      setVol(0);
      cancelAnimationFrame(vizRaf);
      window.setTimeout(() => { if (!soundOn && audioCtx) audioCtx.suspend(); }, 600);
      volSlider.style.display = "none";
      barEls.forEach((b, i) => {
        b.style.transform = `rotate(${i * 30}deg) scaleY(0.3)`;
        b.style.opacity = "0";
      });
    }
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    iconOff.style.display = soundOn ? "none" : "block";
    iconOn.style.display = soundOn ? "block" : "none";
  });

  volSlider.addEventListener("input", () => { if (soundOn) setVol(volSlider.value / 100); });
}
