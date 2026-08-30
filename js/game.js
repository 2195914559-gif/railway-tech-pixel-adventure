(function () {
  "use strict";

  const DATA = window.GAME_DATA;
  const WORLD = DATA.world;
  const qs = new URLSearchParams(location.search);
  const debugWalls = qs.get("walls") === "1";

  const $ = (selector) => document.querySelector(selector);
  const els = {
    app: $("#app"),
    boot: $("#boot-screen"),
    cover: $("#cover-screen"),
    intro: $("#intro-screen"),
    game: $("#game-screen"),
    canvas: $("#game-canvas"),
    stage: $("#game-stage"),
    start: $("#start-button"),
    startChoice: $("#start-choice-overlay"),
    startChoiceSummary: $("#start-choice-summary"),
    continueGame: $("#continue-game-button"),
    restartGame: $("#restart-game-button"),
    startChoiceClose: $("#start-choice-close"),
    coverArchive: $("#cover-archive-button"),
    exit: $("#exit-button"),
    saveStatus: $("#save-status"),
    coverAudio: $("#cover-audio-button"),
    introVideo: $("#intro-video"),
    introTime: $("#intro-time"),
    introError: $("#intro-error"),
    skipIntro: $("#skip-intro-button"),
    introErrorSkip: $("#intro-error-skip"),
    chapterNumber: $("#chapter-number"),
    chapterTitle: $("#chapter-title"),
    missionText: $("#mission-text"),
    taskPips: $("#task-pips"),
    missionCard: $("#mission-card-toggle"),
    interactHint: $("#interact-hint"),
    interactLabel: $("#interact-label"),
    chapterCard: $("#chapter-card"),
    chapterCardNumber: $("#chapter-card-number"),
    chapterCardTitle: $("#chapter-card-title"),
    chapterCardObjective: $("#chapter-card-objective"),
    audio: $("#audio-button"),
    archive: $("#archive-button"),
    pause: $("#pause-button"),
    dialogOverlay: $("#dialog-overlay"),
    dialogSpeaker: $("#dialog-speaker"),
    dialogTopic: $("#dialog-topic"),
    dialogText: $("#dialog-text"),
    dialogChoices: $("#dialog-choices"),
    dialogNext: $("#dialog-next"),
    dialogClose: $("#dialog-close"),
    archiveOverlay: $("#archive-overlay"),
    archiveClose: $("#archive-close"),
    archiveList: $("#archive-list"),
    archiveEmpty: $("#archive-empty"),
    imageViewerOverlay: $("#image-viewer-overlay"),
    imageViewerClose: $("#image-viewer-close"),
    imageViewerImage: $("#image-viewer-image"),
    imageViewerCaption: $("#image-viewer-caption"),
    badgeRow: $("#badge-row"),
    pauseOverlay: $("#pause-overlay"),
    resume: $("#resume-button"),
    pauseArchive: $("#pause-archive-button"),
    returnMenu: $("#return-menu-button"),
    endingOverlay: $("#ending-overlay"),
    endingPanel: $(".ending-panel"),
    endingSpeaker: $("#ending-speaker"),
    endingText: $("#ending-text"),
    endingNext: $("#ending-next"),
    toast: $("#toast"),
    bgm: $("#bgm-player"),
    voice: $("#voice-player"),
    touchInteract: $("#touch-interact")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const images = { backgrounds: new Map(), sprite: new Image(), npcAtlas: new Image(), portal: new Image() };
  const NPC_SPRITES = {
    "mobility-passenger": [0, 0],
    "id-passenger": [1, 0],
    "elderly-passenger": [2, 0],
    "station-staff": [0, 1],
    "navigation-robot": [1, 1],
    "train-driver": [2, 1],
    "mechanic": [0, 2],
    "rail-worker": [1, 2],
    "inspection-rover": [2, 2]
  };
  const keys = new Set();
  const archiveCatalog = new Map();

  DATA.chapters.forEach((chapter) => {
    chapter.interactions.forEach((item) => {
      if (item.archive) archiveCatalog.set(item.archive.id, item.archive);
    });
  });
  Object.values(DATA.chapterArchives).forEach((item) => archiveCatalog.set(item.id, item));

  function defaultProgress() {
    return {
      version: 1,
      chapterIndex: 0,
      player: null,
      completed: {},
      seen: {},
      archives: ["archive-tieshiyi-ip"],
      badges: [],
      quizOrders: {},
      seenIntro: false,
      finished: false,
      spawnSignature: null,
      updatedAt: null
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(DATA.saveKey);
      if (!raw) return defaultProgress();
      const progress = Object.assign(defaultProgress(), JSON.parse(raw));
      // 让旧存档也能在开局档案中看到铁世一 IP 资料。
      if (!Array.isArray(progress.archives)) progress.archives = [];
      if (!progress.archives.includes("archive-tieshiyi-ip")) progress.archives.unshift("archive-tieshiyi-ip");
      return progress;
    } catch (error) {
      console.warn("存档读取失败，已建立新存档。", error);
      return defaultProgress();
    }
  }

  const state = {
    screen: "boot",
    chapterIndex: 0,
    player: { x: 800, y: 790, direction: "up", moving: false, animationTime: 0 },
    collisions: {},
    spawnSignature: "",
    progress: loadProgress(),
    nearby: null,
    dialogItem: null,
    transition: false,
    paused: false,
    audioEnabled: true,
    audioContext: null,
    endingIndex: 0,
    lastTime: performance.now(),
    lastSaveAt: 0,
    toastTimer: null,
    chapterCardTimer: null,
    camera: { x: 0, y: 0, zoom: 1 }
  };

  function shuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      let randomValue = Math.random();
      if (window.crypto?.getRandomValues) {
        const bucket = new Uint32Array(1);
        window.crypto.getRandomValues(bucket);
        randomValue = bucket[0] / 4294967296;
      }
      const target = Math.floor(randomValue * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function quizItems() {
    return DATA.chapters.flatMap((chapter) => chapter.interactions.filter((item) => item.kind === "quiz"));
  }

  function validQuizOrder(item, order) {
    return Array.isArray(order)
      && order.length === item.choices.length
      && new Set(order).size === item.choices.length
      && order.every((index) => Number.isInteger(index) && index >= 0 && index < item.choices.length);
  }

  function ensureQuizOrders() {
    const items = quizItems();
    const saved = state.progress.quizOrders || {};
    if (items.every((item) => validQuizOrder(item, saved[item.id]))) {
      state.progress.quizOrders = saved;
      return;
    }
    const correctPositions = shuffle(items.map((_, index) => index % 3));
    const orders = {};
    items.forEach((item, itemIndex) => {
      const wrong = shuffle(item.choices.map((_, index) => index).filter((index) => index !== item.correct));
      wrong.splice(correctPositions[itemIndex], 0, item.correct);
      orders[item.id] = wrong;
    });
    state.progress.quizOrders = orders;
  }

  ensureQuizOrders();

  state.__total = (typeof DATA !== "undefined" && DATA.chapters ? DATA.chapters.length : 4) + 3;
  state.__loaded = 0;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`无法加载图片：${src}`));
      image.src = src;
    });
  }

  function reportProgress(done, total) {
    const bar = document.getElementById("boot-bar-fill");
    const text = document.getElementById("boot-percent");
    const ratio = total ? Math.min(1, done / total) : 0;
    if (bar) bar.style.width = `${Math.round(ratio * 100)}%`;
    if (text) text.textContent = `${Math.round(ratio * 100)}%`;
  }

  async function loadAssets(onProgress) {
    const tick = () => { if (onProgress) onProgress(); };
    const jobs = DATA.chapters.map(async (chapter) => {
      images.backgrounds.set(chapter.id, await loadImage(chapter.background));
      tick();
    });
    const coreJobs = [
      loadImage("assets/character/tieshiyi-walk.webp").then((img) => { images.sprite = img; tick(); }),
      loadImage("assets/generated/npc-atlas.webp").then((img) => { images.npcAtlas = img; tick(); }),
      loadImage("assets/generated/railway-portal-new.webp").then((img) => { images.portal = img; tick(); })
    ];
    await Promise.all(jobs.concat(coreJobs));
  }

  function applyCollisionPayload(payload) {
    if (!payload || typeof payload !== "object" || !payload.chapters) return false;
    state.collisions = payload.chapters;
    if (payload.portals) {
      DATA.chapters.forEach((chapter) => {
        const savedPortal = payload.portals[chapter.id];
        if (savedPortal && Number.isFinite(Number(savedPortal.x)) && Number.isFinite(Number(savedPortal.y))) {
          chapter.portal.x = Number(savedPortal.x);
          chapter.portal.y = Number(savedPortal.y);
        }
      });
    }
    if (payload.spawns) {
      DATA.chapters.forEach((chapter) => {
        const savedSpawn = payload.spawns[chapter.id];
        if (savedSpawn && Number.isFinite(Number(savedSpawn.x)) && Number.isFinite(Number(savedSpawn.y))) {
          chapter.spawn.x = Number(savedSpawn.x);
          chapter.spawn.y = Number(savedSpawn.y);
        }
      });
    }
    if (payload.npcs && typeof payload.npcs === "object") {
      DATA.chapters.forEach((chapter) => {
        const savedNpcs = payload.npcs[chapter.id];
        if (!savedNpcs || typeof savedNpcs !== "object") return;
        chapter.interactions.forEach((item) => {
          const savedNpc = savedNpcs[item.id];
          if (savedNpc && Number.isFinite(Number(savedNpc.x)) && Number.isFinite(Number(savedNpc.y))) {
            item.x = Number(savedNpc.x);
            item.y = Number(savedNpc.y);
          }
        });
      });
    }
    state.spawnSignature = DATA.chapters
      .map((chapter) => `${chapter.id}:${Number(chapter.spawn.x).toFixed(2)},${Number(chapter.spawn.y).toFixed(2)}`)
      .join("|");
    return true;
  }

  async function loadCollisions() {
    // Android WebView loads the game from file://, where fetch() can be blocked
    // by origin rules. The release build bundles the editor's saved payload as
    // a deterministic fallback, while the HTTP API still wins on desktop.
    if (location.protocol === "file:" && applyCollisionPayload(window.GAME_COLLISIONS)) return;
    for (const url of ["data/collisions.json", "/api/collisions", "data/collisions.default.json"]) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok && applyCollisionPayload(await response.json())) return;
      } catch (error) {
        // Try the next local source, then the bundled payload below.
      }
    }
    if (applyCollisionPayload(window.GAME_COLLISIONS)) return;
    state.collisions = {};
    state.spawnSignature = DATA.chapters
      .map((chapter) => `${chapter.id}:${Number(chapter.spawn.x).toFixed(2)},${Number(chapter.spawn.y).toFixed(2)}`)
      .join("|");
    showToast("空气墙配置未加载，当前使用场景边界保护");
  }

  function showScreen(name) {
    state.screen = name;
    els.cover.hidden = name !== "cover";
    els.intro.hidden = name !== "intro";
    els.game.hidden = name !== "game";
  }

  function currentChapter() {
    return DATA.chapters[state.chapterIndex];
  }

  function ensureAudioContext() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) state.audioContext = new AudioContext();
    }
    if (state.audioContext?.state === "suspended") state.audioContext.resume().catch(() => {});
  }

  function playClick(tone = "normal") {
    if (!state.audioEnabled) return;
    ensureAudioContext();
    if (!state.audioContext) return;
    const now = state.audioContext.currentTime;
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(tone === "success" ? 690 : tone === "error" ? 180 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(tone === "success" ? 980 : tone === "error" ? 120 : 280, now + .075);
    gain.gain.setValueAtTime(.045, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .085);
    osc.connect(gain).connect(state.audioContext.destination);
    osc.start(now);
    osc.stop(now + .09);
  }

  function setAudioEnabled(enabled) {
    state.audioEnabled = enabled;
    els.bgm.muted = !enabled;
    els.voice.muted = !enabled;
    const label = enabled ? "♫" : "×";
    els.audio.textContent = label;
    els.coverAudio.textContent = label;
    els.audio.setAttribute("aria-label", enabled ? "关闭声音" : "开启声音");
    if (enabled && state.screen === "game") playBgm();
    if (!enabled) {
      els.bgm.pause();
      els.voice.pause();
    }
  }

  function toggleAudio() {
    setAudioEnabled(!state.audioEnabled);
    playClick();
  }

  function playBgm() {
    if (!state.audioEnabled || state.screen !== "game") return;
    const src = currentChapter().bgm;
    if (!els.bgm.src.endsWith(src.replace(/^.*\//, ""))) {
      els.bgm.src = src;
      els.bgm.volume = .2;
    }
    els.bgm.play().catch(() => {});
  }

  function playVoice(id) {
    if (!id || !state.audioEnabled) return;
    els.voice.pause();
    els.voice.src = `assets/audio/dialogue/${id}.mp3`;
    els.voice.volume = .92;
    els.voice.play().catch(() => {});
  }

  function stopVoice() {
    els.voice.pause();
    els.voice.removeAttribute("src");
  }

  function showToast(message, duration = 2100) {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    state.toastTimer = setTimeout(() => { els.toast.hidden = true; }, duration);
  }

  function hasRealProgress() {
    const earnedArchive = state.progress.archives.some((id) => id !== "archive-tieshiyi-ip");
    return Boolean(state.progress.updatedAt || earnedArchive || Object.keys(state.progress.completed).length);
  }

  function updateCoverStatus() {
    if (!hasRealProgress()) {
      els.saveStatus.textContent = "尚未建立探索档案";
      return;
    }
    const index = Math.min(state.progress.chapterIndex || 0, DATA.chapters.length - 1);
    const chapter = DATA.chapters[index];
    els.saveStatus.textContent = state.progress.finished ? "已完成全部铁路科技探索" : `已有进度：${chapter.number} ${chapter.title}`;
  }

  function saveProgress(force = false) {
    const now = performance.now();
    if (!force && now - state.lastSaveAt < 1200) return;
    state.lastSaveAt = now;
    state.progress.chapterIndex = state.chapterIndex;
    state.progress.player = { x: Math.round(state.player.x), y: Math.round(state.player.y), direction: state.player.direction };
    state.progress.spawnSignature = state.spawnSignature || null;
    state.progress.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(DATA.saveKey, JSON.stringify(state.progress));
    } catch (error) {
      console.warn("自动存档失败", error);
    }
    updateCoverStatus();
  }

  function completedMap(chapterId) {
    if (!state.progress.completed[chapterId]) state.progress.completed[chapterId] = {};
    return state.progress.completed[chapterId];
  }

  function seenMap(chapterId) {
    if (!state.progress.seen[chapterId]) state.progress.seen[chapterId] = {};
    return state.progress.seen[chapterId];
  }

  function isTaskComplete(item, chapter = currentChapter()) {
    return Boolean(state.progress.completed[chapter.id]?.[item.id]);
  }

  function isSeen(item, chapter = currentChapter()) {
    return Boolean(state.progress.seen[chapter.id]?.[item.id]);
  }

  function unlockArchive(item) {
    if (!item || state.progress.archives.includes(item.id)) return;
    state.progress.archives.push(item.id);
  }

  function addBadge(name) {
    if (!name || state.progress.badges.includes(name)) return;
    state.progress.badges.push(name);
    showToast(`徽章获得：${name}`, 2600);
    playClick("success");
  }

  function mainTasks(chapter = currentChapter()) {
    return chapter.interactions.filter((item) => item.main);
  }

  function allMainComplete(chapter = currentChapter()) {
    const tasks = mainTasks(chapter);
    return tasks.length === 0 || tasks.every((item) => isTaskComplete(item, chapter));
  }

  function portalRequirements(chapter = currentChapter()) {
    return chapter.portal.requiresAllInteractions ? chapter.interactions : mainTasks(chapter);
  }

  function requirementComplete(item, chapter = currentChapter()) {
    return item.main ? isTaskComplete(item, chapter) : isSeen(item, chapter);
  }

  function isPortalReady(chapter = currentChapter()) {
    const requirements = portalRequirements(chapter);
    return requirements.length > 0 && requirements.every((item) => requirementComplete(item, chapter));
  }

  function announcePortalReady(chapter) {
    addBadge(chapter.badge);
    if (chapter.chapterArchive) unlockArchive(DATA.chapterArchives[chapter.chapterArchive]);
    const message = chapter.portal.ending
      ? "五项展区参观完成，结束探索入口已开启！"
      : "本章任务完成，下一关入口已开启！";
    setTimeout(() => showToast(message, 3000), 650);
  }

  function completeTask(item) {
    const chapter = currentChapter();
    if (!isTaskComplete(item, chapter)) {
      const wasPortalReady = isPortalReady(chapter);
      completedMap(chapter.id)[item.id] = true;
      unlockArchive(item.archive);
      showToast(`任务完成：${item.name}`);
      if (!wasPortalReady && isPortalReady(chapter)) announcePortalReady(chapter);
      updateHUD();
      saveProgress(true);
    }
  }

  function markSeen(item) {
    const chapter = currentChapter();
    if (isSeen(item, chapter)) return;
    const wasPortalReady = isPortalReady(chapter);
    seenMap(chapter.id)[item.id] = true;
    unlockArchive(item.archive);
    if (!wasPortalReady && isPortalReady(chapter)) announcePortalReady(chapter);
    updateHUD();
    saveProgress(true);
  }

  function updateHUD() {
    const chapter = currentChapter();
    els.chapterNumber.textContent = chapter.number;
    els.chapterTitle.textContent = chapter.title;
    els.missionText.textContent = chapter.objective;
    els.taskPips.replaceChildren();
    const items = mainTasks(chapter).length ? mainTasks(chapter) : chapter.interactions;
    items.forEach((item) => {
      const pip = document.createElement("span");
      pip.className = "task-pip";
      const done = item.main ? isTaskComplete(item, chapter) : isSeen(item, chapter);
      if (done) pip.classList.add("done");
      pip.title = `${item.name}：${done ? "已完成" : "未完成"}`;
      els.taskPips.append(pip);
    });
  }

  function showChapterCard() {
    clearTimeout(state.chapterCardTimer);
    const chapter = currentChapter();
    els.chapterCardNumber.textContent = chapter.number;
    els.chapterCardTitle.textContent = chapter.title;
    els.chapterCardObjective.textContent = chapter.objective;
    els.chapterCard.hidden = false;
    state.chapterCardTimer = setTimeout(() => { els.chapterCard.hidden = true; }, 2500);
  }

  function isTouchLayout() {
    return Boolean(window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth <= 800);
  }

  function setMissionCardCollapsed(collapsed) {
    if (!els.missionCard) return;
    const next = Boolean(collapsed);
    els.missionCard.classList.toggle("is-collapsed", next);
    els.missionCard.setAttribute("aria-expanded", String(!next));
    els.missionCard.setAttribute("aria-label", next ? "展开任务信息" : "收起任务信息");
  }

  function updateCamera(immediate = false) {
    const zoom = isTouchLayout() ? 1.28 : 1;
    const viewWidth = WORLD.width / zoom;
    const viewHeight = WORLD.height / zoom;
    const maxX = Math.max(0, WORLD.width - viewWidth);
    const maxY = Math.max(0, WORLD.height - viewHeight);
    const targetX = Math.min(maxX, Math.max(0, state.player.x - viewWidth / 2));
    const targetY = Math.min(maxY, Math.max(0, state.player.y - viewHeight / 2));
    if (immediate || state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
      state.camera.x = targetX;
      state.camera.y = targetY;
      return;
    }
    const ease = isTouchLayout() ? .18 : 1;
    state.camera.x += (targetX - state.camera.x) * ease;
    state.camera.y += (targetY - state.camera.y) * ease;
  }

  function startChapter(index, restorePosition = false) {
    state.chapterIndex = Math.max(0, Math.min(index, DATA.chapters.length - 1));
    const chapter = currentChapter();
    const saved = restorePosition
      && state.progress.player
      && state.progress.chapterIndex === state.chapterIndex
      && state.progress.spawnSignature
      && state.progress.spawnSignature === state.spawnSignature
      ? state.progress.player
      : null;
    state.player.x = saved?.x ?? chapter.spawn.x;
    state.player.y = saved?.y ?? chapter.spawn.y;
    state.player.direction = saved?.direction ?? chapter.spawn.direction;
    state.player.moving = false;
    state.nearby = null;
    state.transition = false;
    updateCamera(true);
    showScreen("game");
    updateHUD();
    setMissionCardCollapsed(isTouchLayout());
    playBgm();
    showChapterCard();
    saveProgress(true);
  }

  function beginAdventure() {
    ensureAudioContext();
    playClick();
    if (hasRealProgress()) {
      const index = Math.min(state.progress.chapterIndex || 0, DATA.chapters.length - 1);
      const chapter = DATA.chapters[index];
      els.startChoiceSummary.textContent = state.progress.finished
        ? "该存档已完成全部探索。你可以返回完成后的进度，或从第一站重新开始。"
        : `当前进度：${chapter.number} ${chapter.title}。请选择继续或重新开始。`;
      els.startChoice.hidden = false;
      return;
    }
    continueAdventure();
  }

  function continueAdventure() {
    els.startChoice.hidden = true;
    if (!state.progress.seenIntro) {
      showIntro();
      return;
    }
    startChapter(state.progress.chapterIndex || 0, true);
  }

  function restartAdventure() {
    localStorage.removeItem(DATA.saveKey);
    state.progress = defaultProgress();
    ensureQuizOrders();
    state.chapterIndex = 0;
    updateCoverStatus();
    renderArchive();
    playClick("success");
    continueAdventure();
  }

  function showIntro() {
    showScreen("intro");
    els.bgm.pause();
    els.introError.hidden = true;
    els.introVideo.currentTime = 0;
    els.introVideo.play().catch(() => {
      els.introError.hidden = false;
    });
  }

  function finishIntro() {
    els.introVideo.pause();
    state.progress.seenIntro = true;
    // 首次看完开场视频时，先按配置中的出生点进入章节。
    // 之前先保存默认玩家坐标再以“继续”模式进入，会让新出生点被旧坐标覆盖。
    startChapter(state.progress.chapterIndex || 0, false);
  }

  function returnToMenu() {
    saveProgress(true);
    stopVoice();
    els.bgm.pause();
    closeAllModals();
    showScreen("cover");
    updateCoverStatus();
  }

  function closeAllModals() {
    els.dialogOverlay.hidden = true;
    els.archiveOverlay.hidden = true;
    els.pauseOverlay.hidden = true;
    els.endingOverlay.hidden = true;
    els.startChoice.hidden = true;
    closeImageViewer();
    state.paused = false;
  }

  function isModalOpen() {
    return !els.dialogOverlay.hidden || !els.archiveOverlay.hidden || !els.imageViewerOverlay.hidden || !els.pauseOverlay.hidden || !els.endingOverlay.hidden || !els.startChoice.hidden;
  }

  function openDialog(item) {
    state.dialogItem = item;
    els.dialogSpeaker.textContent = item.speaker || "铁世一";
    els.dialogTopic.textContent = item.name || "";
    els.dialogTopic.hidden = !item.name;
    els.dialogText.textContent = item.prompt;
    els.dialogChoices.replaceChildren();
    els.dialogNext.hidden = true;
    els.dialogOverlay.hidden = false;
    if (item.kind === "quiz" && !isTaskComplete(item)) {
      const order = state.progress.quizOrders[item.id] || item.choices.map((_, index) => index);
      order.forEach((originalIndex, displayIndex) => {
        const choice = item.choices[originalIndex];
        const label = String.fromCharCode(65 + displayIndex);
        const cleanChoice = choice.replace(/^[A-C](?:\s+|[.．、:：]\s*)/i, "");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.textContent = `${label}. ${cleanChoice}`;
        button.addEventListener("click", () => answerQuiz(originalIndex));
        els.dialogChoices.append(button);
      });
      playVoice(item.promptVoice);
    } else {
      if (item.kind === "info") markSeen(item);
      if (item.kind === "quiz" && isTaskComplete(item)) els.dialogText.textContent = item.feedback;
      els.dialogNext.hidden = false;
      playVoice(item.kind === "quiz" ? item.feedbackVoice : item.promptVoice);
    }
  }

  function answerQuiz(index) {
    const item = state.dialogItem;
    if (!item) return;
    playClick(index === item.correct ? "success" : "error");
    if (index !== item.correct) {
      showToast("再想一想：安全、便捷和规范是关键。", 2300);
      return;
    }
    completeTask(item);
    els.dialogText.textContent = item.feedback;
    els.dialogChoices.replaceChildren();
    els.dialogNext.hidden = false;
    playVoice(item.feedbackVoice);
  }

  function closeDialog() {
    els.dialogOverlay.hidden = true;
    state.dialogItem = null;
    stopVoice();
  }

  function openImageViewer(src, alt) {
    if (!src) return;
    playClick();
    els.imageViewerImage.src = src;
    els.imageViewerImage.alt = alt || "铁世一档案图片";
    els.imageViewerCaption.textContent = `${alt || "铁世一档案图片"}　·　点击右上角或遮罩关闭`;
    els.imageViewerOverlay.hidden = false;
  }

  function closeImageViewer() {
    els.imageViewerOverlay.hidden = true;
    els.imageViewerImage.removeAttribute("src");
  }

  function renderArchive() {
    els.archiveList.replaceChildren();
    els.badgeRow.replaceChildren();
    state.progress.badges.forEach((name) => {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = `◆ ${name}`;
      els.badgeRow.append(badge);
    });
    const unlocked = state.progress.archives.map((id) => archiveCatalog.get(id)).filter(Boolean);
    unlocked.forEach((item) => {
      const card = document.createElement("article");
      card.className = "archive-card";
      const category = document.createElement("span");
      category.textContent = item.category;
      const title = document.createElement("h3");
      title.textContent = item.title;
      const body = document.createElement("p");
      body.textContent = item.body;
      card.append(category, title, body);
      if (Array.isArray(item.images) && item.images.length) {
        const gallery = document.createElement("div");
        gallery.className = "archive-gallery";
        item.images.forEach((imageData) => {
          if (!imageData || !imageData.src) return;
          const image = document.createElement("img");
          image.src = imageData.src;
          image.alt = imageData.alt || item.title;
          image.loading = "lazy";
          image.tabIndex = 0;
          image.title = "点击放大查看";
          image.addEventListener("click", (event) => {
            event.stopPropagation();
            openImageViewer(imageData.src, image.alt);
          });
          image.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openImageViewer(imageData.src, image.alt);
            }
          });
          gallery.append(image);
        });
        if (gallery.childElementCount) card.append(gallery);
      }
      els.archiveList.append(card);
    });
    els.archiveEmpty.hidden = unlocked.length > 0;
  }

  function openArchive() {
    playClick();
    renderArchive();
    els.archiveOverlay.hidden = false;
  }

  function closeArchive() {
    els.archiveOverlay.hidden = true;
  }

  function togglePause(force) {
    if (state.screen !== "game" || !els.dialogOverlay.hidden || !els.endingOverlay.hidden) return;
    const next = typeof force === "boolean" ? force : els.pauseOverlay.hidden;
    els.pauseOverlay.hidden = !next;
    state.paused = next;
    playClick();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nearestTarget() {
    const chapter = currentChapter();
    let best = null;
    let bestDistance = Infinity;
    chapter.interactions.forEach((item) => {
      const d = distance(state.player, item);
      if (d < bestDistance && d <= DATA.controls.interactionRadius) {
        best = { type: "interaction", item, distance: d };
        bestDistance = d;
      }
    });
    if (isPortalReady(chapter)) {
      const portalDistance = distance(state.player, chapter.portal);
      if (portalDistance < bestDistance && portalDistance <= DATA.controls.interactionRadius) {
        best = { type: "portal", item: chapter.portal, distance: portalDistance };
      }
    }
    return best;
  }

  function interact() {
    if (state.screen !== "game" || state.paused || isModalOpen() || state.transition) return;
    ensureAudioContext();
    playClick();
    const target = nearestTarget();
    if (!target) {
      showToast("附近没有可交互目标", 1200);
      return;
    }
    if (target.type === "interaction") {
      openDialog(target.item);
      return;
    }
    activatePortal();
  }

  function activatePortal() {
    const chapter = currentChapter();
    if (!isPortalReady(chapter)) {
      const remaining = portalRequirements(chapter).filter((item) => !requirementComplete(item, chapter)).length;
      showToast(`入口尚未开启，还需完成 ${remaining} 项探索。`, 2400);
      playClick("error");
      return;
    }
    if (chapter.portal.ending) {
      startEnding();
      return;
    }
    transitionToChapter(state.chapterIndex + 1);
  }

  function transitionToChapter(index) {
    if (state.transition) return;
    state.transition = true;
    saveProgress(true);
    showToast("列车即将发车……", 1500);
    setTimeout(() => startChapter(index, false), 1050);
  }

  function startEnding() {
    if (state.transition) return;
    state.transition = true;
    addBadge(currentChapter().badge);
    state.progress.finished = true;
    state.endingIndex = 0;
    els.endingPanel.classList.remove("credits");
    els.endingOverlay.hidden = false;
    showEndingLine();
    saveProgress(true);
  }

  function showEndingLine() {
    const line = DATA.ending[state.endingIndex];
    if (!line) {
      els.endingPanel.classList.add("credits");
      els.endingSpeaker.textContent = "前方到站，世界一流！";
      els.endingText.innerHTML = "科技改变生活　创新赢得未来<br><small>让每一次出发更便捷・让每一次运行更安全・让每一次抵达更美好</small>";
      els.endingNext.textContent = "返回主菜单";
      stopVoice();
      return;
    }
    els.endingSpeaker.textContent = line.speaker;
    els.endingText.textContent = line.text;
    els.endingNext.textContent = state.endingIndex === DATA.ending.length - 1 ? "观看片尾" : "继续";
    playVoice(line.voice);
  }

  function nextEnding() {
    playClick();
    if (state.endingIndex >= DATA.ending.length) {
      state.transition = false;
      returnToMenu();
      return;
    }
    state.endingIndex += 1;
    showEndingLine();
  }

  function playerCollisionRect(x = state.player.x, y = state.player.y) {
    const collision = DATA.controls.playerCollision || { width: 32, height: 39, offsetX: 16, offsetY: 41 };
    return {
      x: x - collision.offsetX,
      y: y - collision.offsetY,
      w: collision.width,
      h: collision.height
    };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function blockedAt(x, y) {
    const rect = playerCollisionRect(x, y);
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > WORLD.width || rect.y + rect.h > WORLD.height) return true;
    const walls = state.collisions[currentChapter().id] || [];
    return walls.some((wall) => rectsOverlap(rect, wall));
  }

  function updateMovement(dt) {
    if (state.screen !== "game" || state.paused || isModalOpen() || state.transition) {
      state.player.moving = false;
      return;
    }
    let dx = 0;
    let dy = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
    if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      const distancePerFrame = DATA.controls.speed * dt;
      const nextX = state.player.x + dx * distancePerFrame;
      const nextY = state.player.y + dy * distancePerFrame;
      if (!blockedAt(nextX, state.player.y)) state.player.x = nextX;
      if (!blockedAt(state.player.x, nextY)) state.player.y = nextY;
      if (Math.abs(dx) > Math.abs(dy)) state.player.direction = dx < 0 ? "left" : "right";
      else state.player.direction = dy < 0 ? "up" : "down";
      state.player.moving = true;
      state.player.animationTime += dt;
      saveProgress();
    } else {
      state.player.moving = false;
      state.player.animationTime = 0;
    }
    state.nearby = nearestTarget();
    updateInteractHint();
    const chapter = currentChapter();
    if (isPortalReady(chapter) && distance(state.player, chapter.portal) < chapter.portal.radius * .52 && !state.transition) activatePortal();
  }

  function updateInteractHint() {
    if (!state.nearby || state.transition || isModalOpen()) {
      els.interactHint.hidden = true;
      return;
    }
    els.interactHint.hidden = false;
    els.interactLabel.textContent = state.nearby.type === "portal" ? state.nearby.item.label : state.nearby.item.name;
  }

  function drawContained(image) {
    // Every chapter owns a full 16:9 game world. Stretching the source to
    // that world avoids letterbox bands on wide or tall chapter artwork; the
    // mobile camera then crops the filled world while following the player.
    ctx.fillStyle = "#071224";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.drawImage(image, 0, 0, WORLD.width, WORLD.height);
  }

  function drawPortal(chapter, time) {
    const portal = chapter.portal;
    if (!isPortalReady(chapter)) return;
    const width = portal.width || 160;
    const height = width * (images.portal.height / images.portal.width || .914);
    const top = portal.y - height * .58;
    const glow = .78 + Math.sin(time * .005) * .12;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = `${portal.color}45`;
    ctx.shadowColor = portal.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(portal.x, portal.y + 15, width * .28, height * .34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(images.portal, portal.x - width / 2, top, width, height);

    const labelY = Math.max(24, portal.y - height * .78);
    ctx.font = "900 17px 'Microsoft YaHei UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelWidth = Math.max(108, ctx.measureText(portal.label).width + 24);
    ctx.fillStyle = "rgba(2, 14, 42, .94)";
    ctx.strokeStyle = portal.color;
    ctx.lineWidth = 3;
    ctx.fillRect(portal.x - labelWidth / 2, labelY - 16, labelWidth, 32);
    ctx.strokeRect(portal.x - labelWidth / 2, labelY - 16, labelWidth, 32);
    ctx.fillStyle = "#f7fbff";
    ctx.shadowColor = "#00112f";
    ctx.shadowBlur = 4;
    ctx.fillText(portal.label, portal.x, labelY + 1);
    ctx.restore();
  }

  function drawNpc(item) {
    const sprite = NPC_SPRITES[item.npcSprite];
    if (!sprite || !images.npcAtlas.width) return;
    const cellWidth = images.npcAtlas.width / 3;
    const cellHeight = images.npcAtlas.height / 3;
    const height = item.npcHeight || 86;
    const width = height * (cellWidth / cellHeight);
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = "#00102f";
    ctx.beginPath();
    ctx.ellipse(item.x, item.y - 3, Math.max(17, width * .3), 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      images.npcAtlas,
      sprite[0] * cellWidth,
      sprite[1] * cellHeight,
      cellWidth,
      cellHeight,
      item.x - width / 2,
      item.y - height,
      width,
      height
    );
    ctx.restore();
  }

  function drawInteraction(item, chapter, time) {
    const done = item.main ? isTaskComplete(item, chapter) : isSeen(item, chapter);
    const pulse = 1 + Math.sin(time * .006 + item.x * .01) * .07;
    drawNpc(item);
    const markerSize = item.main ? 36 : 24;
    const markerOffset = item.npcSprite ? (item.npcHeight || 86) + 16 : item.main ? 54 : 44;
    ctx.save();
    ctx.translate(item.x, item.y - markerOffset);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = done ? "#35e6a0" : item.main ? "#ffd34e" : "#46d9ff";
    ctx.strokeStyle = "#06112d";
    ctx.lineWidth = item.main ? 8 : 5;
    ctx.font = `900 ${markerSize}px 'Microsoft YaHei UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(done ? "✓" : "!", 0, 0);
    ctx.fillText(done ? "✓" : "!", 0, 0);
    ctx.restore();
  }

  function drawPlayer() {
    const directionRows = { down: 0, left: 1, right: 2, up: 3 };
    const row = directionRows[state.player.direction] ?? 0;
    const sequence = [0, 1, 2, 1];
    const col = state.player.moving ? sequence[Math.floor(state.player.animationTime * 8) % sequence.length] : 1;
    const size = 82;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = .28;
    ctx.fillStyle = "#00102f";
    ctx.beginPath();
    ctx.ellipse(state.player.x, state.player.y - 4, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(images.sprite, col * 256, row * 256, 256, 256, state.player.x - size / 2, state.player.y - size, size, size);
    ctx.restore();
  }

  function drawDebugWalls() {
    if (!debugWalls) return;
    ctx.save();
    ctx.fillStyle = "rgba(255,50,75,.22)";
    ctx.strokeStyle = "#ff425c";
    ctx.lineWidth = 2;
    ctx.font = "12px monospace";
    (state.collisions[currentChapter().id] || []).forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = "#fff";
      ctx.fillText(wall.id || "wall", wall.x + 4, wall.y + 14);
      ctx.fillStyle = "rgba(255,50,75,.22)";
    });
    const box = playerCollisionRect();
    ctx.strokeStyle = "#56ff9a";
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  function render(time) {
    if (state.screen !== "game") return;
    const chapter = currentChapter();
    updateCamera();
    ctx.save();
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);
    const background = images.backgrounds.get(chapter.id);
    if (background) drawContained(background);
    drawPortal(chapter, time);
    chapter.interactions.forEach((item) => drawInteraction(item, chapter, time));
    drawPlayer();
    drawDebugWalls();
    const gradient = ctx.createRadialGradient(800, 450, 340, 800, 450, 920);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,4,18,.34)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.restore();
  }

  function loop(time) {
    const dt = Math.min(.05, Math.max(0, (time - state.lastTime) / 1000));
    state.lastTime = time;
    updateMovement(dt);
    render(time);
    requestAnimationFrame(loop);
  }

  function pressArtButton(button) {
    button.classList.add("is-pressed");
    setTimeout(() => button.classList.remove("is-pressed"), 120);
  }

  function bindEvents() {
    els.start.addEventListener("click", () => { pressArtButton(els.start); beginAdventure(); });
    els.continueGame.addEventListener("click", () => { playClick(); continueAdventure(); });
    els.restartGame.addEventListener("click", restartAdventure);
    els.startChoiceClose.addEventListener("click", () => { playClick(); els.startChoice.hidden = true; });
    els.coverArchive.addEventListener("click", () => { pressArtButton(els.coverArchive); openArchive(); });
    els.exit.addEventListener("click", () => {
      pressArtButton(els.exit);
      playClick();
      window.close();
      setTimeout(() => showToast("浏览器不允许网页自动关闭，请直接关闭当前标签页。", 3400), 160);
    });
    els.coverAudio.addEventListener("click", toggleAudio);
    els.audio.addEventListener("click", toggleAudio);
    els.skipIntro.addEventListener("click", finishIntro);
    els.introErrorSkip.addEventListener("click", finishIntro);
    els.introVideo.addEventListener("ended", finishIntro);
    els.introVideo.addEventListener("error", () => { els.introError.hidden = false; });
    els.introVideo.addEventListener("timeupdate", () => {
      const current = Number.isFinite(els.introVideo.currentTime) ? els.introVideo.currentTime : 0;
      const duration = Number.isFinite(els.introVideo.duration) ? els.introVideo.duration : 51;
      const fmt = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
      els.introTime.textContent = `${fmt(current)} / ${fmt(duration)}`;
    });
    els.archive.addEventListener("click", openArchive);
    els.archiveClose.addEventListener("click", closeArchive);
    els.imageViewerClose.addEventListener("click", closeImageViewer);
    els.imageViewerOverlay.addEventListener("click", (event) => {
      if (event.target === els.imageViewerOverlay) closeImageViewer();
    });
    els.pause.addEventListener("click", () => togglePause());
    els.resume.addEventListener("click", () => togglePause(false));
    els.pauseArchive.addEventListener("click", () => { togglePause(false); openArchive(); });
    els.returnMenu.addEventListener("click", returnToMenu);
    els.dialogClose.addEventListener("click", closeDialog);
    els.dialogNext.addEventListener("click", closeDialog);
    els.endingNext.addEventListener("click", nextEnding);
    if (els.missionCard) {
      const toggleMissionCard = () => {
        if (!isTouchLayout()) return;
        setMissionCardCollapsed(!els.missionCard.classList.contains("is-collapsed"));
        playClick("soft");
      };
      els.missionCard.addEventListener("click", toggleMissionCard);
      els.missionCard.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleMissionCard();
        }
      });
    }
    els.touchInteract.addEventListener("pointerdown", (event) => { event.preventDefault(); interact(); });

    document.querySelectorAll(".touch-key").forEach((button) => {
      const key = button.dataset.key;
      const release = () => { keys.delete(key); button.classList.remove("active"); };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        keys.add(key);
        button.classList.add("active");
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });

    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (event.repeat && ["Space", "Enter", "Escape"].includes(event.code)) return;
      if (event.code === "Escape") {
        if (!els.startChoice.hidden) els.startChoice.hidden = true;
        else if (!els.dialogOverlay.hidden) closeDialog();
        else if (!els.imageViewerOverlay.hidden) closeImageViewer();
        else if (!els.archiveOverlay.hidden) closeArchive();
        else togglePause();
        return;
      }
      if (event.code === "Space" || event.code === "Enter") {
        if (!els.dialogOverlay.hidden && !els.dialogNext.hidden) closeDialog();
        else if (!els.endingOverlay.hidden) nextEnding();
        else interact();
        return;
      }
      keys.add(event.code);
    }, { passive: false });
    window.addEventListener("keyup", (event) => keys.delete(event.code));
    window.addEventListener("blur", () => keys.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.screen === "game" && !isModalOpen()) togglePause(true);
    });
  }

  async function init() {
    bindEvents();
    updateCoverStatus();
    try {
      await Promise.all([
        loadAssets(() => reportProgress(++state.__loaded, state.__total)),
        loadCollisions()
      ]);
    } catch (error) {
      console.error(error);
      showToast("部分素材加载失败，请通过启动脚本打开游戏。", 4200);
    }
    const debugChapter = Number(qs.get("chapter"));
    if (debugChapter >= 1 && debugChapter <= DATA.chapters.length) state.progress.chapterIndex = debugChapter - 1;
    els.boot.hidden = true;
    els.app.hidden = false;
    showScreen("cover");
    requestAnimationFrame(loop);
  }

  window.GAME_TEST_API = {
    getState: () => ({
      screen: state.screen,
      chapterIndex: state.chapterIndex,
      player: { ...state.player },
      nearby: state.nearby,
      completed: JSON.parse(JSON.stringify(state.progress.completed)),
      archives: [...state.progress.archives],
      badges: [...state.progress.badges]
    }),
    startChapter,
    interact,
    setPlayer: (x, y) => { state.player.x = x; state.player.y = y; },
    completeCurrentChapter: () => portalRequirements().forEach((item) => item.main ? completeTask(item) : markSeen(item)),
    isPortalReady,
    getChapter: currentChapter,
    getCollisions: () => state.collisions,
    getQuizOrders: () => JSON.parse(JSON.stringify(state.progress.quizOrders))
  };

  init();
})();
