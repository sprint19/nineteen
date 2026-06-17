/* ============================================================
   SPRINT NINETEEN :: THE ARCHIVE — behavior
   ============================================================ */
(function () {
  "use strict";

  /* ---------- lightweight analytics wrapper (GA4) ---------- */
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      }
      // console.debug("[track]", name, params || {});
    } catch (e) {/* never break the page for analytics */}
  }

  /* ---------- elements ---------- */
  const boot     = document.getElementById("boot");
  const crawl    = document.getElementById("crawl");
  const archive  = document.getElementById("archive");
  const audio    = document.getElementById("midi");
  const bootMeta = document.getElementById("boot-meta");

  /* ---------- music preference ---------- */
  // default ON, unless the user opted out (stored)
  let musicAllowed = localStorage.getItem("s19_music") !== "off";

  function setMusicButtons(playing) {
    document.querySelectorAll("[data-midi-btn]").forEach(function (b) {
      b.classList.toggle("live", playing);
      const playLabel  = b.getAttribute("data-play")  || "Play the forbidden MIDI";
      const pauseLabel = b.getAttribute("data-pause") || "Silence the forbidden MIDI";
      const labelEl = b.querySelector("[data-label]") || b;
      labelEl.textContent = playing ? pauseLabel : playLabel;
    });
  }

  function playMusic() {
    if (!audio) return;
    audio.volume = 0.0;
    const p = audio.play();
    if (p && p.then) {
      p.then(function () {
        let v = 0;                          // gentle fade-in
        const id = setInterval(function () {
          v += 0.04; audio.volume = Math.min(v, 0.55);
          if (v >= 0.55) clearInterval(id);
        }, 90);
        setMusicButtons(true);
        track("play_forbidden_midi");
      }).catch(function () { setMusicButtons(false); });
    }
  }
  function pauseMusic() {
    if (!audio) return;
    audio.pause();
    setMusicButtons(false);
    track("pause_forbidden_midi");
  }
  function toggleMusic() {
    if (!audio) return;
    if (audio.paused) {
      musicAllowed = true; localStorage.setItem("s19_music", "on"); playMusic();
    } else { pauseMusic(); }
  }
  document.querySelectorAll("[data-midi-btn]").forEach(function (b) {
    b.addEventListener("click", toggleMusic);
  });

  /* "disable ceremonial music" toggle on boot */
  const musicToggle = document.getElementById("music-toggle");
  function renderMusicToggle() {
    if (!musicToggle) return;
    musicToggle.textContent = musicAllowed
      ? "♪ ceremonial music: ARMED — click to disable"
      : "✕ ceremonial music: DISABLED — click to arm";
  }
  if (musicToggle) {
    renderMusicToggle();
    musicToggle.addEventListener("click", function () {
      musicAllowed = !musicAllowed;
      localStorage.setItem("s19_music", musicAllowed ? "on" : "off");
      renderMusicToggle();
    });
  }

  /* ---------- boot typing sequence ---------- */
  const bootLines = [
    { t: "> mounting /dev/sprint19 ............ ok",                  cls: "ok"   },
    { t: "> loading sprint_19_lore.txt ........ failed successfully", cls: "warn" },
    { t: "> rehydrating 18 missing sprints .... not found",          cls: "warn" },
    { t: "> spinner status ................... still spinning",      cls: ""     },
    { t: "> banana permission ................ pending",             cls: ""     },
    { t: "> ready.",                                                 cls: "ok"   }
  ];
  function runBoot() {
    if (!bootMeta) return;
    let i = 0;
    (function next() {
      if (i >= bootLines.length) {
        const cur = document.createElement("div");
        const blink = document.createElement("span");
        blink.className = "blink";
        blink.textContent = "_";
        cur.appendChild(blink);
        bootMeta.appendChild(cur);
        return;
      }
      const line = bootLines[i++];
      const div = document.createElement("div");
      div.className = line.cls;
      bootMeta.appendChild(div);
      let j = 0;
      (function type() {
        div.textContent = line.t.slice(0, j++);
        if (j <= line.t.length) setTimeout(type, 14);
        else setTimeout(next, 230);
      })();
    })();
  }
  runBoot();

  /* ---------- rotating HUD statuses ---------- */
  const statuses = [
    "spinner has accepted its fate",
    "banana permission pending",
    "scope goblin detected",
    "deploying nothing important",
    "cache phantom feeling smug",
    "modal hydra regrowing heads",
    "deadline wolf howling (it is friday somewhere)",
    "legacy mole surfacing unexpectedly"
  ];
  const hudStatus = document.getElementById("hud-status");
  let sIdx = 0;
  if (hudStatus) {
    setInterval(function () {
      sIdx = (sIdx + 1) % statuses.length;
      hudStatus.textContent = statuses[sIdx];
    }, 2600);
  }

  /* ---------- phase transitions ---------- */
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  /* ---------- crawl engine (auto / manual / zoom / speed) ---------- */
  const crawlText  = document.querySelector(".crawl-text");
  const modeBtn    = document.getElementById("cc-mode");
  const speedInput = document.getElementById("cc-speed");
  const speedVal   = document.getElementById("cc-speed-val");
  const speedGroup = document.getElementById("cc-speed-group");

  const TILT = 26;          // degrees of perspective tilt
  const BASE_SPEED = 75;    // px/sec at 1.0x
  const cr = { active:false, mode:"auto", pos:0, start:0, end:0,
               zoom:1, speedMul:1, raf:0, last:0, restAtEnd:false };

  function crawlApply() {
    if (!crawlText) return;
    // tilt lives on .crawl-stage; the text only scrolls (translateY) and zooms
    crawlText.style.transform =
      "translateX(-50%) translateY(" + cr.pos + "px) scale(" + cr.zoom + ")";
  }
  function crawlMeasure() {
    const H = window.innerHeight;
    const Th = (crawlText ? crawlText.offsetHeight : H) * cr.zoom;
    cr.start = H * 0.98;
    // restAtEnd: settle with the footer resting near the viewport floor;
    // otherwise keep going until the content has scrolled fully off the top
    cr.end = cr.restAtEnd ? (H * 0.85) - Th : -(Th + H * 0.1);
  }
  function crawlClamp() {
    cr.pos = Math.min(cr.start + 200, Math.max(cr.end - 120, cr.pos));
  }
  function updateModeBtn() {
    if (modeBtn) modeBtn.textContent = cr.mode === "auto" ? "▶ AUTO" : "✋ MANUAL";
    if (speedGroup) speedGroup.classList.toggle("dim", cr.mode !== "auto");
  }
  function setMode(m) { cr.mode = m; if (m === "auto") cr.last = 0; updateModeBtn(); }
  function toggleMode() { setMode(cr.mode === "auto" ? "manual" : "auto"); }

  function crawlFrame(ts) {
    if (!cr.active) return;
    if (!cr.last) cr.last = ts;
    const dt = Math.min(0.05, (ts - cr.last) / 1000); cr.last = ts;
    if (cr.mode === "auto") {
      cr.pos -= BASE_SPEED * cr.speedMul * dt;
      if (cr.pos <= cr.end) {
        if (cr.restAtEnd) { cr.pos = cr.end; crawlApply(); setMode("manual"); }
        else { enterArchive(); return; }
      } else {
        crawlApply();
      }
    }
    cr.raf = requestAnimationFrame(crawlFrame);
  }
  function startCrawl() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cr.active = true; cr.zoom = 1; cr.speedMul = 1; cr.last = 0;
    cr.mode = reduce ? "manual" : "auto";
    crawlMeasure(); cr.pos = cr.start; crawlApply(); updateModeBtn();
    if (speedInput) speedInput.value = "1";
    if (speedVal) speedVal.textContent = "1.0×";
    cancelAnimationFrame(cr.raf);
    cr.raf = requestAnimationFrame(crawlFrame);
  }
  function stopCrawl() { cr.active = false; cancelAnimationFrame(cr.raf); }

  function zoomBy(d) {
    cr.zoom = Math.min(2.2, Math.max(0.5, Math.round((cr.zoom + d) * 100) / 100));
    crawlMeasure(); crawlClamp(); crawlApply();
  }
  function crawlFit() {
    if (!crawlText) return;
    const tw = crawlText.offsetWidth;         // unscaled column width
    if (!tw) return;
    const availW = window.innerWidth * 0.92;   // fit to screen WIDTH only
    const z = availW / tw;
    cr.zoom = Math.min(2.2, Math.max(0.3, Math.round(z * 100) / 100));
    crawlMeasure(); crawlClamp(); crawlApply();
  }
  function manualScroll(delta) {
    setMode("manual");
    cr.pos -= delta; crawlClamp(); crawlApply();
  }

  /* ---- swappable crawl content (intro vs. a single chapter) ---- */
  const introNodes = crawlText
    ? Array.from(crawlText.children).map(function (n) { return n.cloneNode(true); })
    : [];
  let crawlReturnId = null;   // archive anchor to land on when the crawl ends

  function cloneNoId(node) {
    const c = node.cloneNode(true);          // strip ids so the crawl copy
    if (c.removeAttribute) c.removeAttribute("id");   // never duplicates archive ids
    if (c.querySelectorAll) {
      c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
    }
    return c;
  }
  function setCrawlIntro() {
    if (!crawlText) return;
    crawlText.replaceChildren();
    introNodes.forEach(function (n) { crawlText.appendChild(n.cloneNode(true)); });
  }
  function setCrawlFull() {
    // the entire document — preface, chapters I–XIX, exit door and footer —
    // as one continuous crawl
    if (!crawlText) return;
    const body = document.querySelector(".archive-body");
    if (!body) { setCrawlIntro(); return; }
    crawlText.replaceChildren();
    Array.from(body.children).forEach(function (node) {
      crawlText.appendChild(cloneNoId(node));
    });
  }
  function setCrawlChapter(h2) {
    if (!crawlText) return;
    crawlText.replaceChildren();
    const title = document.createElement("div");
    title.className = "crawl-title";
    const ep = document.createElement("span");
    ep.className = "ep";
    ep.textContent = "Chapter " + (h2.getAttribute("data-num") || "");
    const big = document.createElement("span");
    big.className = "big";
    const nameClone = h2.cloneNode(true);
    const num = nameClone.querySelector(".num");
    if (num) num.remove();
    big.textContent = nameClone.textContent.trim();
    title.appendChild(ep);
    title.appendChild(big);
    crawlText.appendChild(title);
    let node = h2.nextElementSibling;
    while (node && !node.matches("h2.chapter") && node.id !== "exit" &&
           node.tagName !== "FOOTER") {
      if (node.matches("p, ul, h3")) crawlText.appendChild(cloneNoId(node));
      node = node.nextElementSibling;
    }
  }
  function getCurrentChapter() {
    let cur = null;
    chapters.forEach(function (c) {
      if (c.getBoundingClientRect().top < 140) cur = c;
    });
    return cur || chapters[0];
  }

  function lockBody() {
    document.body.classList.add("locked");
    document.body.style.height = "100vh";
    document.body.style.overflowY = "hidden";
  }
  function unlockBody() {
    document.body.classList.remove("locked");
    document.body.style.height = "auto";
    document.body.style.overflowY = "auto";
  }

  function beginScroll() {
    track("begin_scroll");
    if (musicAllowed) playMusic();          // user gesture → playback allowed
    setCrawlFull();                          // full document, continuous crawl
    cr.restAtEnd = true;                     // settle on the footer at the end
    crawlReturnId = null;
    hide(boot);
    show(crawl);
    window.scrollTo(0, 0);
    // let layout settle (fonts + height) before measuring
    requestAnimationFrame(function () { requestAnimationFrame(startCrawl); });
  }
  function replayChapterAsCrawl() {
    const ch = getCurrentChapter();
    if (!ch) return;
    cr.restAtEnd = false;                    // single chapter → return to the archive
    if (ch.classList.contains("doc-head")) { setCrawlIntro(); crawlReturnId = "doc-top"; }
    else { setCrawlChapter(ch); crawlReturnId = ch.id; }
    track("replay_crawl", { chapter: ch.getAttribute("data-num") || "00" });
    hide(archive);
    lockBody();
    show(crawl);
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { requestAnimationFrame(startCrawl); });
  }
  function enterArchive() {
    stopCrawl();
    hide(crawl);
    show(archive);
    unlockBody();
    const target = crawlReturnId ? document.getElementById(crawlReturnId) : null;
    crawlReturnId = null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    track("archive_opened");
  }

  const toCrawlBtn = document.getElementById("to-crawl");
  if (toCrawlBtn) toCrawlBtn.addEventListener("click", replayChapterAsCrawl);

  const beginBtn = document.getElementById("begin-btn");
  const skipBtn  = document.getElementById("skip-btn");
  if (beginBtn) beginBtn.addEventListener("click", beginScroll);
  if (skipBtn)  skipBtn.addEventListener("click", enterArchive);

  /* crawl control wiring */
  if (modeBtn) modeBtn.addEventListener("click", toggleMode);
  if (speedInput) speedInput.addEventListener("input", function () {
    cr.speedMul = parseFloat(speedInput.value) || 1;
    if (speedVal) speedVal.textContent = cr.speedMul.toFixed(1) + "×";
    setMode("auto");
  });
  const zIn  = document.getElementById("cc-zoom-in");
  const zOut = document.getElementById("cc-zoom-out");
  const zFit = document.getElementById("cc-fit");
  if (zIn)  zIn.addEventListener("click",  function () { zoomBy(0.15); });
  if (zOut) zOut.addEventListener("click", function () { zoomBy(-0.15); });
  if (zFit) zFit.addEventListener("click", crawlFit);

  if (crawl) crawl.addEventListener("wheel", function (e) {
    if (!cr.active) return;
    e.preventDefault();
    manualScroll(e.deltaY * 0.6);
  }, { passive: false });

  window.addEventListener("keydown", function (e) {
    if (!cr.active) return;
    switch (e.key) {
      case "ArrowDown": case "PageDown": case "j":
        e.preventDefault(); manualScroll(e.key === "PageDown" ? 260 : 48); break;
      case "ArrowUp": case "PageUp": case "k":
        e.preventDefault(); manualScroll(e.key === "PageUp" ? -260 : -48); break;
      case " ": case "Spacebar":
        e.preventDefault(); toggleMode(); break;
      case "+": case "=":
        e.preventDefault(); zoomBy(0.15); break;
      case "-": case "_":
        e.preventDefault(); zoomBy(-0.15); break;
      case "f": case "F":
        crawlFit(); break;
      case "Escape":
        enterArchive(); break;
    }
  });

  window.addEventListener("resize", function () {
    if (cr.active) { crawlMeasure(); crawlClamp(); crawlApply(); }
  });

  /* escape links */
  document.querySelectorAll("[data-escape]").forEach(function (a) {
    a.addEventListener("click", function () { track("escape_to_sprint19_click"); });
  });

  /* ---------- scroll progress + nonsense + chapter tracking ---------- */
  const fill     = document.getElementById("progress-fill");
  const pctEl    = document.getElementById("progress-pct");
  const nonsense = document.getElementById("nonsense-label");
  const navLinks = Array.from(document.querySelectorAll(".chapter-nav a"));
  const chapters = Array.from(document.querySelectorAll("h2.chapter, .doc-head"));

  const depthHit = { 25:false, 50:false, 75:false, 100:false, done:false };
  let lastChapter = "";

  function nonsenseFor(pct) {
    if (pct < 5)  return "you have not yet committed";
    if (pct < 20) return "warning: user has consumed " + pct + "% of nonsense";
    if (pct < 40) return "the spinner is watching you scroll";
    if (pct < 55) return "you may be too deep now";
    if (pct < 70) return "scope goblin is taking notes";
    if (pct < 85) return "this is more reading than the actual product docs";
    if (pct < 99) return "almost free. banana permission still pending";
    return "archive consumed. you survived.";
  }

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0;
    if (fill)  fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
    if (nonsense) nonsense.textContent = nonsenseFor(pct);

    [25, 50, 75, 100].forEach(function (d) {
      if (!depthHit[d] && pct >= d) { depthHit[d] = true; track("scroll_" + d); }
    });
    if (pct >= 100 && !depthHit.done) { depthHit.done = true; track("archive_completed"); }

    let activeId = "", activeRoman = "";
    chapters.forEach(function (c) {
      const r = c.getBoundingClientRect();
      if (r.top < 140) {
        activeId = c.id || activeId;
        const n = c.getAttribute("data-num");
        if (n) activeRoman = n;
      }
    });
    if (activeId) {
      navLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + activeId);
      });
    }
    if (activeRoman && activeRoman !== lastChapter) {
      lastChapter = activeRoman;
      track("chapter_reached", { chapter: activeRoman });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  setMusicButtons(false);
})();
