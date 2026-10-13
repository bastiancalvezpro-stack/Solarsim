/* 
   SOLARSIM — script.js
   Visualiseur 3D trajectoires planétaires — Three.js r128

   Format JSON : { "planète-méthode": [ [[x,y,z],[vx,vy,vz],t], … ] }
   Unités : mètres (positions), m/s (vitesses), jours (temps)
 */
'use strict';

/* 
   CATALOGUE PLANÉTAIRE
 */
const PLANET_CATALOG = {
  mercury: { displayName:'Mercure', color:0xb0b0b0, mass:3.285e23, visualRadius:0.20, hex:'#b0b0b0' },
  venus:   { displayName:'Vénus',   color:0xe8cda0, mass:4.867e24, visualRadius:0.36, hex:'#e8cda0' },
  earth:   { displayName:'Terre',   color:0x4fa3e0, mass:5.972e24, visualRadius:0.38, hex:'#4fa3e0' },
  mars:    { displayName:'Mars',    color:0xc1440e, mass:6.390e23, visualRadius:0.28, hex:'#c1440e' },
  jupiter: { displayName:'Jupiter', color:0xe0a96d, mass:1.898e27, visualRadius:0.80, hex:'#e0a96d' },
  saturn:  { displayName:'Saturne', color:0xd4b483, mass:5.683e26, visualRadius:0.68, hex:'#d4b483' },
  uranus:  { displayName:'Uranus',  color:0x7de8e8, mass:8.681e25, visualRadius:0.54, hex:'#7de8e8' },
  neptune: { displayName:'Neptune', color:0x4466cc, mass:1.024e26, visualRadius:0.52, hex:'#4466cc' },
};
const FALLBACK = { displayName:null, color:0x88aacc, mass:null, visualRadius:0.35, hex:'#88aacc' };


   //ÉCHELLE EN PUISSANCE (r^EXPO)

const EXPO    = 0.45;
const SCALE_A = 30.0 / Math.pow(4.460e12, EXPO); // ≈ 3.25e-6

function toScene3(x, y, z) {
  const r = Math.sqrt(x*x + y*y + z*z);
  if (r === 0) return [0, 0, 0];
  const rScene = SCALE_A * Math.pow(r, EXPO);
  const k = rScene / r;
  return [x * k, y * k, z * k];
}


  // PARSEUR JSON → tableau PlanetData

function parseSolarData(json) {
  const planets = [];
  for (const [key, rawPts] of Object.entries(json)) {
    const dash  = key.indexOf('-');
    const id     = (dash >= 0 ? key.slice(0, dash) : key).toLowerCase();
    const method = dash >= 0 ? key.slice(dash + 1) : 'inconnu';
    const cat    = PLANET_CATALOG[id] || FALLBACK;

    const points = rawPts.map(e => ({
      x: e[0][0], y: e[0][1], z: e[0][2],
      vx:e[1][0], vy:e[1][1], vz:e[1][2],
      t: e[2],
    }));

    let perihelion = Infinity;
    for (const p of points) {
      const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
      if (d < perihelion) perihelion = d;
    }

    const missing = [];
    if (!cat.mass)            missing.push('masse');
    if (cat === FALLBACK)     missing.push('catalogue de référence');

    planets.push({
      key, id, method,
      displayName : cat.displayName || (id[0].toUpperCase() + id.slice(1)),
      color       : cat.color,
      hex         : cat.hex,
      visualRadius: cat.visualRadius,
      mass        : cat.mass,
      points,
      perihelion,
      missing,
    });
  }
  return planets;
}


  // SCENE MANAGER — Three.js

const Scene = (() => {
  let renderer, scene, camera, raycaster, mouse;
  const objs = new Map(); 

  function init() {
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x04050d, 1);

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.001, 2000);
    camera.position.set(0, 22, 52);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x223355, 1.1));
    const sunLight = new THREE.PointLight(0xfff5e0, 4, 500, 1.5);
    scene.add(sunLight);

    _addSun();
    _addStars();

    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1;
    mouse = new THREE.Vector2();

    window.addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  }

  function _addSun() {
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff8b0 })
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 32, 32),
      new THREE.MeshBasicMaterial({ color:0xffdd44, transparent:true, opacity:0.07, side:THREE.BackSide })
    ));
  }

  function _addStars() {
    const n   = 5500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 200;
      pos[i*3  ] = r * Math.sin(p) * Math.cos(t);
      pos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      pos[i*3+2] = r * Math.cos(p);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g,
      new THREE.PointsMaterial({ color:0xffffff, size:0.30, sizeAttenuation:true })
    ));
  }

  function loadPlanet(p) {
    // Si la planète (clé unique) existe déjà, on évite de la recréer en double
    if (objs.has(p.key)) return;

    const n   = p.points.length;
    const buf = new Float32Array(n * 3);

    p.points.forEach((pt, i) => {
      const [sx, sy, sz] = toScene3(pt.x, pt.y, pt.z);
      buf[i*3  ] = sx;
      buf[i*3+1] = sy;
      buf[i*3+2] = sz;
    });

    const og = new THREE.BufferGeometry();
    og.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    const orbitLine = new THREE.Line(og,
      new THREE.LineBasicMaterial({ color:p.color, opacity:0.28, transparent:true })
    );
    scene.add(orbitLine);

    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(buf.slice(), 3));
    const dots = new THREE.Points(dg,
      new THREE.PointsMaterial({ color:p.color, size:0.06, transparent:true, opacity:0, sizeAttenuation:true })
    );
    scene.add(dots);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.visualRadius, 24, 24),
      new THREE.MeshPhongMaterial({
        color: p.color, emissive: p.color,
        emissiveIntensity: 0.18, shininess: 40,
      })
    );
    const [x0, y0, z0] = toScene3(p.points[0].x, p.points[0].y, p.points[0].z);
    mesh.position.set(x0, y0, z0);
    mesh.userData.planetKey = p.key;
    scene.add(mesh);

    mesh.add(new THREE.Mesh(
      new THREE.SphereGeometry(p.visualRadius * 1.65, 24, 24),
      new THREE.MeshBasicMaterial({ color:p.color, transparent:true, opacity:0.05, side:THREE.BackSide })
    ));

    objs.set(p.key, { mesh, orbitLine, dots });
  }

  function movePlanet(key, pt) {
    const o = objs.get(key);
    if (!o) return;
    const [sx, sy, sz] = toScene3(pt.x, pt.y, pt.z);
    o.mesh.position.set(sx, sy, sz);
  }

  function highlight(key) {
    objs.forEach((o, pkey) => {
      const sel = pkey === key;
      o.mesh.material.emissiveIntensity = sel ? 0.60 : 0.18;
      o.orbitLine.material.opacity      = sel ? 0.80 : 0.28;
    });
  }
  function clearHighlight() {
    objs.forEach(o => {
      o.mesh.material.emissiveIntensity = 0.18;
      o.orbitLine.material.opacity      = 0.28;
    });
  }

  //Cache toutes les planètes sauf celle sélectionnée 
  function isolate(key) {
    objs.forEach((o, pkey) => {
      const sel = pkey === key;
      o.mesh.visible      = sel;
      o.orbitLine.visible = sel;
      o.dots.visible      = sel;
      if (sel) {
        o.mesh.material.emissiveIntensity = 0.60;
        o.orbitLine.material.opacity      = 0.85;
      }
    });
  }

  //Rétablit la visibilité de toutes les planètes
  function showAll() {
    objs.forEach(o => {
      o.mesh.visible      = true;
      o.orbitLine.visible = true;
      o.dots.visible      = true;
      o.mesh.material.emissiveIntensity = 0.18;
      o.orbitLine.material.opacity      = 0.28;
    });
  }

  function updateDotsOpacity(camDist) {
    const NEAR = 1.0, FAR = 5.0;
    const op = camDist < FAR
      ? THREE.MathUtils.clamp((FAR - camDist) / (FAR - NEAR), 0, 0.90)
      : 0;
    objs.forEach(o => { o.dots.material.opacity = op; });
  }

  function pickPlanet(ev) {
    mouse.x =  (ev.clientX / innerWidth)  * 2 - 1;
    mouse.y = -(ev.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const meshes = [...objs.values()].filter(o => o.mesh.visible).map(o => o.mesh);
    const hits   = raycaster.intersectObjects(meshes);
    return hits.length ? hits[0].object.userData.planetKey : null;
  }

  function filterByMethod(activeMethod, allPlanets) {
    objs.forEach((o, pkey) => {
      const p = allPlanets.find(x => x.key === pkey);
      if (!p) return;

      const isVisible = (activeMethod === 'all' || p.method === activeMethod);
      o.mesh.visible = isVisible;
      o.orbitLine.visible = isVisible;
      if (!isVisible) o.dots.visible = false;
    });
  }

  function clearAll() {
    objs.forEach(o => {
      scene.remove(o.mesh);
      scene.remove(o.orbitLine);
      scene.remove(o.dots);
    });
    objs.clear();
  }

  function render()     { renderer.render(scene, camera); }
  function getCamera()  { return camera; }

  // Retourne la position Three.js actuelle d'une planète 
  function getPlanetPos(key) {
    const o = objs.get(key);
    return o ? o.mesh.position.clone() : new THREE.Vector3(0, 0, 0);
  }

  return {
    init, loadPlanet, movePlanet,
    highlight, clearHighlight, isolate, showAll,
    updateDotsOpacity, pickPlanet, filterByMethod, clearAll,
    getPlanetPos, render, getCamera,
  };
})();


   //CONTRÔLES CAMÉRA

const Cam = (() => {
  let cam, el;
  let dragging = false, prev = { x:0, y:0 };

  //État courant (coordonnées sphériques autour de `target`) 
  let sph    = { r:55, theta:0.3, phi:1.1 };
  let target = new THREE.Vector3(0, 0, 0);   // point regardé

  //    Animation de zoom 

  const ZOOM_DURATION = 55;  
  let   zoomAnim = null;      // null = pas d'animation en cours

  function init(camera, domEl) {
    cam = camera; el = domEl;
    _apply();

    el.addEventListener('mousedown', e => {
      if (e.button === 0) {
        // Un clic/drag interrompt l'animation et le suivi automatique 
        if (zoomAnim) { _commitZoom(); zoomAnim = null; }
        dragging = true; prev = { x:e.clientX, y:e.clientY };
      }
    });
    el.addEventListener('mousemove', e => {
      // Si l'utilisateur drag, on arrête le suivi (contrôle manuel)
      if (dragging) followKey = null;
    });
    el.addEventListener('mousemove', e => {
      if (!dragging) return;
      sph.theta -= (e.clientX - prev.x) * 0.006;
      sph.phi    = THREE.MathUtils.clamp(sph.phi - (e.clientY - prev.y) * 0.006, 0.08, Math.PI - 0.08);
      prev = { x:e.clientX, y:e.clientY };
      _apply();
    });
    el.addEventListener('mouseup',    () => dragging = false);
    el.addEventListener('mouseleave', () => dragging = false);
    el.addEventListener('wheel', e => {
      if (zoomAnim) { _commitZoom(); zoomAnim = null; }
      sph.r = THREE.MathUtils.clamp(sph.r * (1 + e.deltaY * 0.001), 0.05, 800);
      _apply();
    }, { passive: true });
  }

  // Applique sph + target → position caméra
  function _apply() {
    const { r, theta, phi } = sph;
    cam.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(target);
  }

  // Clé de la planète suivie (null = vue libre) 
  let followKey = null;

  // Avance l'animation d'un pas (appelé dans la boucle principale)
  function tickZoom() {
    // Si on suit une planète, mettre à jour la cible chaque frame
    if (followKey && !zoomAnim) {
      const pos = Scene.getPlanetPos(followKey);
      target.copy(pos);
      _apply();
    }

    if (!zoomAnim) return;
    zoomAnim.frame++;
    const t = zoomAnim.frame / ZOOM_DURATION;
    // Easing ease-out cubique : démarre rapide, ralentit à l'arrivée 
    const e = 1 - Math.pow(1 - Math.min(t, 1), 3);

    sph.r     = zoomAnim.r0     + (zoomAnim.r1     - zoomAnim.r0)     * e;
    sph.theta = zoomAnim.th0    + (zoomAnim.th1    - zoomAnim.th0)    * e;
    sph.phi   = zoomAnim.phi0   + (zoomAnim.phi1   - zoomAnim.phi0)   * e;
    target.lerpVectors(zoomAnim.tgt0, zoomAnim.tgt1, e);

    _apply();
    // Quand l'animation finit, activer le suivi continu 
    if (zoomAnim.frame >= ZOOM_DURATION) {
      zoomAnim = null;
      // followKey est déjà positionné par zoomTo() 
    }
  }

 // Saute directement à la fin de l'animation (interruption) 
  function _commitZoom() {
    sph.r     = zoomAnim.r1;
    sph.theta = zoomAnim.th1;
    sph.phi   = zoomAnim.phi1;
    target.copy(zoomAnim.tgt1);
    _apply();
  }

  /**
   * Lance un zoom animé vers une position de scène.
   * @param {THREE.Vector3} planetPos  - position actuelle de la planète en scène
   * @param {number}        vRadius    - rayon visuel de la sphère (unités Three.js)
   */
  function zoomTo(planetPos, vRadius, key) {
    // Distance cible = 5× le rayon visuel, minimum 1.2 unités             
    // On garde theta/phi actuels pour que la caméra arrive "par le côté"  
    const rTarget = Math.max(vRadius * 5, 1.2);
    followKey = key || null;      // activer le suivi après la fin de l'anim

    zoomAnim = {
      frame : 0,
      // Départ 
      r0    : sph.r,
      th0   : sph.theta,
      phi0  : sph.phi,
      tgt0  : target.clone(),
      /* Arrivée */
      r1    : rTarget,
      th1   : sph.theta,          // même angle → approche frontale
      phi1  : sph.phi,
      tgt1  : planetPos.clone(),  // la caméra orbite autour de la planète
    };
  }

  
  // Revient à la vue globale (Soleil au centre, r=55).
   
  function zoomOut() {
    followKey = null;             // stopper le suivi avant de revenir
    zoomAnim = {
      frame : 0,
      r0    : sph.r,
      th0   : sph.theta,
      phi0  : sph.phi,
      tgt0  : target.clone(),
      r1    : 55,
      th1   : sph.theta,
      phi1  : sph.phi,
      tgt1  : new THREE.Vector3(0, 0, 0),
    };
  }

  function dist() { return sph.r; }
  return { init, dist, zoomTo, zoomOut, tickZoom };
})();


  // ANIMATION

const Anim = (() => {
  let planets = [], playing = false, speed = 30, idx = 0, maxIdx = 0;

  function load(ps) {
    planets = ps;
    maxIdx  = Math.max(...ps.map(p => p.points.length - 1));
  }

  function tick() {
    if (!playing || planets.length === 0) return;
    idx = Math.min(idx + speed, maxIdx);
    _apply();
    if (idx >= maxIdx) playing = false;
  }

  function _apply() {
    for (const p of planets) {
      Scene.movePlanet(p.key, p.points[Math.min(idx, p.points.length - 1)]);
    }
  }

  function play()       { playing = true; }
  function pause()      { playing = false; }
  function reset()      { idx = 0; playing = false; _apply(); }
  function setSpeed(s)  { speed = Math.max(1, s) | 0; }
  function currentPts() {
    return planets.map(p => ({ key:p.key, pt:p.points[Math.min(idx, p.points.length - 1)] }));
  }
  function getIdx()     { return idx; }
  function getMaxIdx()  { return maxIdx; }
  function isPlaying()  { return playing; }

  return { load, tick, play, pause, reset, setSpeed, currentPts, getIdx, getMaxIdx, isPlaying };
})();


   //FORMATAGE LABELS

function fmtDist(m) {
  const km = Math.abs(m) / 1e3;
  const sign = m < 0 ? '−' : '';
  if (km >= 1e6) return sign + (km/1e6).toFixed(3) + ' Mkm';
  return sign + km.toFixed(0) + ' km';
}
function fmtSpeed(ms) { return (ms / 1e3).toFixed(2) + ' km/s'; }
function fmtMass(kg)  { return kg ? kg.toExponential(3) + ' kg' : 'non disponible'; }


  // UI MANAGER

const UI = (() => {
  let planets = [], selectedKey = null;

  function init(ps) {
    planets = ps;
    window._planetNames = {};
    for (const p of ps) window._planetNames[p.key] = p.displayName + ` (${p.method})`;
    
    _buildMethodDropdown();
    _buildLegend();
    _bindControls();
    document.getElementById('hud-planets-value').textContent = ps.length;
  }

  function _buildMethodDropdown() {
    const select = document.getElementById('method-select');
    const currentSelection = select.value || 'all';
    
    select.innerHTML = '<option value="all">TOUTES</option>';
    
    const methods = [...new Set(planets.map(p => p.method))];
    methods.forEach(method => {
      if (method !== 'inconnu') {
        const opt = document.createElement('option');
        opt.value = method;
        opt.textContent = method.toUpperCase();
        select.appendChild(opt);
      }
    });

    // On garde la méthode sélectionnée active si elle existe encore
    if (methods.includes(currentSelection)) {
      select.value = currentSelection;
    }

    // Un seul EventListener global
    if (!select.dataset.hasListener) {
      select.addEventListener('change', (e) => {
        const selectedMethod = e.target.value;
        Scene.filterByMethod(selectedMethod, planets);
        
        document.querySelectorAll('.legend-item').forEach(el => {
          const p = planets.find(x => x.key === el.dataset.key);
          if (selectedMethod === 'all' || (p && p.method === selectedMethod)) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });

        if (selectedKey) {
          const current = planets.find(x => x.key === selectedKey);
          if (selectedMethod !== 'all' && current && current.method !== selectedMethod) {
            deselect();
          }
        }
      });
      select.dataset.hasListener = "true";
    }
  }

  function _buildLegend() {
    const leg = document.getElementById('legend');
    leg.innerHTML = '';
    
    // Récupérer le filtre actuel du select pour cacher directement les nouveaux éléments si besoin
    const activeMethod = document.getElementById('method-select').value || 'all';

    for (const p of planets) {
      const el = document.createElement('div');
      el.className  = 'legend-item';
      el.dataset.key = p.key;
      el.innerHTML  = `<div class="legend-dot" style="background:${p.hex};box-shadow:0 0 5px ${p.hex}"></div>
                       <span class="legend-name">${p.displayName.toUpperCase()} <small style="opacity:0.5; font-size:9px;">(${p.method})</small></span>`;
      el.addEventListener('click', () => selectPlanet(p.key));
      
      if (activeMethod !== 'all' && p.method !== activeMethod) {
        el.style.display = 'none';
      }
      leg.appendChild(el);
    }
  }

  function _bindControls() {
    const playBtn = document.getElementById('btn-play-pause');
    const resetBtn = document.getElementById('btn-reset');
    const closeBtn = document.getElementById('info-close');
    
    const newPlayBtn = playBtn.cloneNode(true);
    const newResetBtn = resetBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    document.getElementById('btn-play-pause').addEventListener('click', () => {
      if (Anim.isPlaying()) { Anim.pause(); _setPlay(false); }
      else                  { Anim.play();  _setPlay(true);  }
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      Anim.reset(); _setPlay(false); _updateHUD();
    });
    const sl = document.getElementById('speed-slider');
    sl.addEventListener('input', () => {
      const v = +sl.value;
      Anim.setSpeed(v);
      document.getElementById('speed-value').textContent = v + '×';
    });
    document.getElementById('info-close').addEventListener('click', deselect);
  }

  function _setPlay(on) {
    const btn = document.getElementById('btn-play-pause');
    btn.textContent = on ? '⏸' : '▶';
    btn.classList.toggle('playing', on);
  }

  function selectPlanet(key) {
    selectedKey = key;
    Scene.isolate(key);                          // cache toutes les autres planètes

    // Zoom animé : on récupère la position 3D actuelle de la planète 
    const planet = planets.find(x => x.key === key);
    if (planet) {
      const pos = Scene.getPlanetPos(key);       // THREE.Vector3 en coordonnées scène
      Cam.zoomTo(pos, planet.visualRadius, planet.key);
    }

    document.querySelectorAll('.legend-item').forEach(e =>
      e.classList.toggle('active', e.dataset.key === key)
    );
    _openPanel(key);
  }

  function deselect() {
    selectedKey = null;
    Scene.showAll();                             // rétablit toutes les planètes
    Cam.zoomOut();                               // retour vue globale animé
    document.querySelectorAll('.legend-item').forEach(e => e.classList.remove('active'));
    document.getElementById('info-panel').classList.add('info-panel--hidden');
  }

  function _openPanel(key) {
    const p  = planets.find(x => x.key === key); if (!p) return;
    const cp = Anim.currentPts().find(x => x.key === key);
    const pt = cp ? cp.pt : p.points[0];
    const v  = Math.sqrt(pt.vx**2 + pt.vy**2 + pt.vz**2);

    document.getElementById('info-dot').style.cssText = `background:${p.hex};box-shadow:0 0 8px ${p.hex}`;
    document.getElementById('info-name').textContent         = p.displayName;
    document.getElementById('info-method').textContent       = 'méthode : ' + p.method;
    document.getElementById('info-mass').textContent         = fmtMass(p.mass);
    document.getElementById('info-perihelion').textContent   = fmtDist(p.perihelion);
    document.getElementById('info-speed-val').textContent    = fmtSpeed(v);
    document.getElementById('info-px').textContent           = fmtDist(pt.x);
    document.getElementById('info-py').textContent           = fmtDist(pt.y);
    document.getElementById('info-pz').textContent           = fmtDist(pt.z);
    document.getElementById('info-time').textContent         = 'J+' + pt.t;
    document.getElementById('info-npts').textContent         = p.points.length.toLocaleString('fr-FR');

    const warn = document.getElementById('info-warn');
    if (p.missing.length > 0) {
      document.getElementById('info-warn-text').textContent = `Valeurs issues du catalogue interne.`;
      warn.style.display = '';
    } else {
      warn.style.display = 'none';
    }
    document.getElementById('info-panel').classList.remove('info-panel--hidden');
  }

  function _updateHUD() {
    const idx    = Anim.getIdx();
    const maxIdx = Anim.getMaxIdx();
    const pts    = Anim.currentPts();
    const t      = pts.length ? pts[0].pt.t : 0;

    document.getElementById('hud-time-value').textContent  = 'J+' + 0.8*t;
    document.getElementById('progress-bar').style.width    = (maxIdx > 0 ? (idx / maxIdx) * 100 : 0).toFixed(1) + '%';
    document.getElementById('progress-label').textContent  = idx.toLocaleString('fr-FR') + ' / ' + maxIdx.toLocaleString('fr-FR');
    document.getElementById('hud-zoom-value').textContent  = (55 / Cam.dist()).toFixed(2) + '×';

    if (selectedKey) _openPanel(selectedKey);
  }

  function showTooltip(name, x, y) {
    const el = document.getElementById('tooltip');
    el.textContent = name;
    el.style.display = 'block';
    el.style.left    = (x + 14) + 'px';
    el.style.top     = (y - 10) + 'px';
  }
  function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }
  function setSplashStatus(msg, pct) {
    document.getElementById('splash-status').textContent = msg;
    if (pct !== undefined) document.getElementById('splash-bar').style.width = pct + '%';
  }
  function hideSplash() {
    const s = document.getElementById('splash');
    s.classList.add('hidden');
    setTimeout(() => { s.style.display = 'none'; }, 520);
  }

  function tick() { _updateHUD(); }

  return { init, selectPlanet, deselect, showTooltip, hideTooltip, setSplashStatus, hideSplash, tick };
})();


  // GESTION CENTRALE DU STOCK DE PLANÈTES (CUMULATIVE)

let globalPlanetsStore = []; // Stocke TOUTES les trajectoires chargées au fur et à mesure

function appendData(json) {
  UI.setSplashStatus('Analyse des nouvelles trajectoires…', 30);

  let parsedPlanets;
  try { parsedPlanets = parseSolarData(json); }
  catch (e) { alert('Erreur de lecture du JSON : ' + e.message); return; }
  
  if (parsedPlanets.length === 0) { alert('Aucune donnée valide trouvée.'); return; }

  // Ajouter au magasin global en écrasant si la clé existe déjà, sinon ajouter
  parsedPlanets.forEach(newP => {
    const existingIdx = globalPlanetsStore.findIndex(x => x.key === newP.key);
    if (existingIdx > -1) {
      globalPlanetsStore[existingIdx] = newP; // Remplacer
    } else {
      globalPlanetsStore.push(newP); // Ajouter
    }
  });

  // Trier globalement par distance
  globalPlanetsStore.sort((a, b) => a.perihelion - b.perihelion);

  UI.setSplashStatus(`Génération des objets graphiques (${globalPlanetsStore.length} au total)…`, 60);
  
  // Injecter chaque planète dans le moteur 3D
  for (const p of globalPlanetsStore) {
    Scene.loadPlanet(p);
  }

  // Actualiser la timeline d'animation et l'interface utilisateur
  Anim.load(globalPlanetsStore);
  UI.init(globalPlanetsStore);

  // Appliquer le filtre actuel du menu déroulant sur les éléments fraîchement créés
  const currentMethod = document.getElementById('method-select').value || 'all';
  Scene.filterByMethod(currentMethod, globalPlanetsStore);

  UI.setSplashStatus('Prêt !', 100);
  setTimeout(() => UI.hideSplash(), 300);
}

// Chargement automatique initial (trajectoire.json si disponible)
function autoLoad() {
  UI.setSplashStatus('Vérification de trajectoire.json…', 8);
  fetch('./trajectoire.json')
    .then(r => {
      if (!r.ok) throw new Error('Aucun fichier par défaut trouvé');
      return r.json();
    })
    .then(json => appendData(json))
    .catch(err => {
      console.log(err.message);
      UI.setSplashStatus('En attente de fichiers JSON…', 0);
      const fb = document.getElementById('splash-fallback');
      if (fb) fb.style.display = '';
    });
}

// Écouteur pour charger manuellement un ou plusieurs fichiers 
document.getElementById('file-input').addEventListener('change', function (e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const splash = document.getElementById('splash');
  splash.style.display = 'flex';
  splash.classList.remove('hidden');

  let filesRead = 0;
  
  // Fonction récursive pour lire les fichiers l'un après l'autre
  function readNextFile(index) {
    if (index >= files.length) {
      return; 
    }
    
    const file = files[index];
    UI.setSplashStatus(`Lecture du fichier ${file.name}…`, Math.floor((index / files.length) * 100));

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result);
        appendData(json);
      } catch(e) {
        alert(`Erreur dans le fichier ${file.name} : ` + e.message);
      }
      
      filesRead++;
      if (filesRead === files.length) {
        document.getElementById('file-input').value = ''; // Reset
      } else {
        readNextFile(index + 1);
      }
    };
    reader.readAsText(file);
  }

  readNextFile(0);
});


   //INTERACTIONS — clic et survol

document.getElementById('canvas').addEventListener('click', e => {
  const key = Scene.pickPlanet(e);
  if (key) UI.selectPlanet(key);
  else     UI.deselect();
});

document.getElementById('canvas').addEventListener('mousemove', e => {
  const key = Scene.pickPlanet(e);
  if (key) {
    const name = window._planetNames?.[key] ?? key;
    UI.showTooltip(name, e.clientX, e.clientY);
  } else {
    UI.hideTooltip();
  }
});


   //BOUCLE PRINCIPALE

function main() {
  Scene.init();
  Cam.init(Scene.getCamera(), document.getElementById('canvas'));
  autoLoad();

  (function loop() {
    requestAnimationFrame(loop);
    Anim.tick();
    Cam.tickZoom();                    // avance l'animation de zoom si active
    Scene.updateDotsOpacity(Cam.dist());
    UI.tick();
    Scene.render();
  })();
}

main();
