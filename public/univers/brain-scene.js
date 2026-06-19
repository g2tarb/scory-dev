/**
 * SCORY — brain-scene.js
 * Scene Three.js cerveau interactif avec easter egg ExplodingBrain.
 * Pattern coherent avec three-water.js : classe autonome, resize, dispose,
 * gestion webglcontextlost.
 *
 * Usage :
 *   import { BrainScene } from "./brain-scene.js";
 *   const brain = new BrainScene(document.getElementById("brain-host"));
 *   // plus tard : brain.dispose();
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const CONFIG = {
  MINI_COUNT: 14,
  MINI_SCALE_RANGE: [0.12, 0.22],
  EXPLOSION_VELOCITY: [0.8, 2.0],
  ANGULAR_SPEED: 8.0,
  SCATTER_DURATION: 2.8,
  REFORM_DURATION: 1.6,
  ROTATION_THRESHOLD: 4.5,
  GLITCH_JITTER: 0.04,
  GLITCH_INTERVAL: [0.04, 0.18],
  COOLDOWN: 0.5,
  DAMPING_LIN: 0.985,
  DAMPING_ANG: 0.99,
  COLORS: [
    new THREE.Color(0x00cc33),
    new THREE.Color(0xffe600),
    new THREE.Color(0x9919ff),
    new THREE.Color(0xff99cc),
  ],
};

/**
 * Easter egg : explosion en mini-cerveaux quand l'utilisateur tourne le
 * cerveau trop vite, glitch chaotique, puis reform.
 */
class ExplodingBrain {
  constructor(scene, gltf) {
    this.scene = scene;
    this.fullBrain = gltf.scene;
    this.animations = gltf.animations;

    this.state = "IDLE";
    this.stateTime = 0;
    this.cooldown = 0;
    this.miniBrains = [];

    this.mixer = new THREE.AnimationMixer(this.fullBrain);
    this.animations.forEach((clip) => {
      this.mixer.clipAction(clip).setLoop(THREE.LoopRepeat).play();
    });
  }

  feedRotationVelocity(rotVelRadPerSec) {
    if (this.cooldown > 0) return;
    if (this.state !== "IDLE") return;
    if (rotVelRadPerSec > CONFIG.ROTATION_THRESHOLD) {
      this.triggerExplosion();
    }
  }

  triggerExplosion() {
    this.state = "EXPLODING";
    this.stateTime = 0;
    this.fullBrain.visible = false;

    const spawnPos = new THREE.Vector3();
    this.fullBrain.getWorldPosition(spawnPos);

    for (let i = 0; i < CONFIG.MINI_COUNT; i++) {
      const mini = this.fullBrain.clone(true);
      mini.traverse((n) => {
        if (n.isMesh && n.material) n.material = n.material.clone();
      });

      mini.position.copy(spawnPos);
      mini.rotation.set(0, 0, 0);
      const scale = THREE.MathUtils.randFloat(...CONFIG.MINI_SCALE_RANGE);
      mini.scale.setScalar(scale);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      );
      const speed = THREE.MathUtils.randFloat(...CONFIG.EXPLOSION_VELOCITY);
      const velocity = dir.multiplyScalar(speed);

      const angularVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * CONFIG.ANGULAR_SPEED,
        (Math.random() - 0.5) * 2 * CONFIG.ANGULAR_SPEED,
        (Math.random() - 0.5) * 2 * CONFIG.ANGULAR_SPEED,
      );

      this.scene.add(mini);
      this.miniBrains.push({
        wrapper: mini,
        velocity,
        angularVelocity,
        initialScale: scale,
        glitchTimer: Math.random() * 0.1,
        colorTimer: Math.random() * 0.05,
        targetPosition: spawnPos.clone(),
      });
    }
  }

  update(delta) {
    this.stateTime += delta;
    this.cooldown = Math.max(0, this.cooldown - delta);

    if (this.fullBrain.visible) this.mixer.update(delta);

    if (this.state === "EXPLODING" || this.state === "SCATTERED") {
      this.updateMinis(delta);

      if (this.state === "EXPLODING" && this.stateTime > 0.3) {
        this.state = "SCATTERED";
      }
      if (this.state === "SCATTERED" && this.stateTime > CONFIG.SCATTER_DURATION) {
        this.state = "REFORMING";
        this.stateTime = 0;
      }
    }

    if (this.state === "REFORMING") {
      const t = Math.min(this.stateTime / CONFIG.REFORM_DURATION, 1.0);
      const ease = 1 - Math.pow(1 - t, 3);

      this.miniBrains.forEach((mini) => {
        mini.wrapper.position.lerp(mini.targetPosition, 0.12);
        mini.wrapper.scale.setScalar(mini.initialScale * (1 - ease));
        mini.angularVelocity.multiplyScalar(0.92);
        mini.wrapper.rotation.x += mini.angularVelocity.x * delta;
        mini.wrapper.rotation.y += mini.angularVelocity.y * delta;
        mini.wrapper.rotation.z += mini.angularVelocity.z * delta;
      });

      if (t >= 1.0) this.finishReform();
    }
  }

  updateMinis(delta) {
    this.miniBrains.forEach((mini) => {
      mini.wrapper.position.addScaledVector(mini.velocity, delta);
      mini.wrapper.rotation.x += mini.angularVelocity.x * delta;
      mini.wrapper.rotation.y += mini.angularVelocity.y * delta;
      mini.wrapper.rotation.z += mini.angularVelocity.z * delta;
      mini.velocity.multiplyScalar(CONFIG.DAMPING_LIN);
      mini.angularVelocity.multiplyScalar(CONFIG.DAMPING_ANG);

      mini.glitchTimer -= delta;
      if (mini.glitchTimer <= 0) {
        mini.wrapper.position.x += (Math.random() - 0.5) * CONFIG.GLITCH_JITTER;
        mini.wrapper.position.y += (Math.random() - 0.5) * CONFIG.GLITCH_JITTER;
        mini.wrapper.position.z += (Math.random() - 0.5) * CONFIG.GLITCH_JITTER;
        const sj = mini.initialScale * (0.85 + Math.random() * 0.3);
        mini.wrapper.scale.setScalar(sj);
        mini.glitchTimer = THREE.MathUtils.randFloat(...CONFIG.GLITCH_INTERVAL);
      }

      mini.colorTimer -= delta;
      if (mini.colorTimer <= 0) {
        const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
        mini.wrapper.traverse((n) => {
          if (n.isMesh && n.material?.color) n.material.color.copy(color);
        });
        mini.colorTimer = 0.04 + Math.random() * 0.1;
      }
    });
  }

  finishReform() {
    this.miniBrains.forEach((mini) => {
      this.scene.remove(mini.wrapper);
      mini.wrapper.traverse((n) => {
        if (n.isMesh && n.material) n.material.dispose();
      });
    });
    this.miniBrains = [];
    this.fullBrain.visible = true;
    this.state = "IDLE";
    this.stateTime = 0;
    this.cooldown = CONFIG.COOLDOWN;
  }

  dispose() {
    this.miniBrains.forEach((mini) => {
      this.scene.remove(mini.wrapper);
      mini.wrapper.traverse((n) => {
        if (n.isMesh && n.material) n.material.dispose();
      });
    });
    this.miniBrains = [];
    this.mixer.stopAllAction();
  }
}

/**
 * BrainScene — scene Three.js complete, prete a monter dans un container DOM.
 */
export class BrainScene {
  /**
   * @param {HTMLElement} container
   * @param {{ glbUrl?: string; onReady?: (api: { brain: ExplodingBrain }) => void }} [opts]
   */
  constructor(container, opts = {}) {
    this.container = container;
    this.glbUrl = opts.glbUrl ?? "./brain.glb";
    this.onReady = opts.onReady;

    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("brain-canvas");
    this.canvas.style.cssText = "display:block;width:100%;height:100%;";
    this.container.appendChild(this.canvas);

    this._clock = new THREE.Clock();
    this._raf = 0;
    this._running = true;
    this.brain = null;

    this._buildScene();
    this._setupControls();
    this._loadModel();
    this.resize();

    window.addEventListener("resize", this._onResize);
    this.canvas.addEventListener("webglcontextlost", this._onContextLost);
    this.canvas.addEventListener("webglcontextrestored", this._onContextRestored);

    this._tick();
  }

  _buildScene() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x07060a, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();

    const aspect = this.container.clientWidth / Math.max(this.container.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.001, 50);
    this.camera.position.set(0, 0, 0.6);
    this.camera.lookAt(0, 0, 0);

    /* Environment map neutre : rendu PBR fidele a Blender, active clearcoat + sheen */
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    /* Ambient legere pour combler les zones d'ombre */
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambient);

    /* Key light blanche neutre — donne du relief sans repeindre le matiere */
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(2, 3, 2);
    this.scene.add(key);
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 0.25;
    this.controls.maxDistance = 1.5;
    this.controls.rotateSpeed = 0.9;

    this._lastCamQuat = new THREE.Quaternion().copy(this.camera.quaternion);
    this._lastChangeTime = performance.now();

    this._onControlsChange = () => {
      const now = performance.now();
      const dt = (now - this._lastChangeTime) / 1000;
      if (dt < 0.001) return;
      const currentQuat = new THREE.Quaternion().copy(this.camera.quaternion);
      const angleDelta = currentQuat.angleTo(this._lastCamQuat);
      const angularVelocity = angleDelta / dt;
      if (this.brain) this.brain.feedRotationVelocity(angularVelocity);
      this._lastCamQuat.copy(currentQuat);
      this._lastChangeTime = now;
    };
    this.controls.addEventListener("change", this._onControlsChange);
  }

  _loadModel() {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      this.glbUrl,
      (gltf) => {
        this.scene.add(gltf.scene);
        this._frameModel(gltf.scene);
        this.brain = new ExplodingBrain(this.scene, gltf);
        this.onReady?.({ brain: this.brain });
      },
      undefined,
      (err) => console.error("[SCORY] Echec chargement brain.glb", err),
    );
  }

  /** Recentre OrbitControls sur le centre reel du bbox et ajuste la distance camera. */
  _frameModel(root) {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    this.controls.target.copy(center);

    const fov = (this.camera.fov * Math.PI) / 180;
    const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.8;
    this.camera.position.set(center.x, center.y + maxDim * 0.15, center.z + dist);
    this.camera.near = Math.max(maxDim / 200, 0.001);
    this.camera.far = dist * 50;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(center);

    this.controls.minDistance = maxDim * 0.7;
    this.controls.maxDistance = maxDim * 6;
    this.controls.update();

    /* Reset le tracker de rotation : evite un faux trigger d'explosion au load */
    this._lastCamQuat.copy(this.camera.quaternion);
    this._lastChangeTime = performance.now();
  }

  _onResize = () => this.resize();

  resize() {
    const w = this.container.clientWidth;
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _onContextLost = (e) => {
    e.preventDefault();
    this._running = false;
    cancelAnimationFrame(this._raf);
    console.warn("[SCORY] WebGL context lost on BrainScene");
    setTimeout(() => {
      try {
        this.renderer.forceContextRestore();
      } catch {}
    }, 2000);
  };

  _onContextRestored = () => {
    console.info("[SCORY] WebGL context restored on BrainScene");
    this._running = true;
    this._tick();
  };

  _tick = () => {
    if (!this._running) return;
    const delta = Math.min(this._clock.getDelta(), 0.1);
    this.controls.update();
    if (this.brain) this.brain.update(delta);
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._tick);
  };

  dispose() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    this.canvas.removeEventListener("webglcontextlost", this._onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this._onContextRestored);
    this.controls.removeEventListener("change", this._onControlsChange);
    this.controls.dispose();
    this.brain?.dispose();
    this.scene.traverse((n) => {
      if (n.isMesh) {
        n.geometry?.dispose();
        if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
        else n.material?.dispose();
      }
    });
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
