(() => {
  const config = window.DATE_APP_CONFIG;
  const state = {
    step: 1,
    activity: null,
    activityIcon: "♡",
    date: null,
    time: null,
    note: ""
  };

  const $ = (id) => document.getElementById(id);
  const elements = {
    startButton: $("startButton"),
    planner: $("planner"),
    successPanel: $("successPanel"),
    backButton: $("backButton"),
    nextButton: $("nextButton"),
    progressBar: $("progressBar"),
    progressPercent: $("progressPercent"),
    stepLabel: $("stepLabel"),
    activityGrid: $("activityGrid"),
    dateGrid: $("dateGrid"),
    timeGrid: $("timeGrid"),
    customActivity: $("customActivity"),
    customDate: $("customDate"),
    customTime: $("customTime"),
    noteInput: $("noteInput"),
    toast: $("toast"),
    confettiLayer: $("confettiLayer")
  };

  function init() {
    applyConfig();
    renderActivities();
    renderDates();
    renderTimes();
    bindEvents();
    setDateInputMin();
    updateStep();
  }

  function applyConfig() {
    document.title = `${config.toName}，想和你约个会`;
    $("fromAvatar").textContent = firstCharacter(config.fromName);
    $("toAvatar").textContent = firstCharacter(config.toName);
    $("toName").textContent = config.toName;
    $("openingText").textContent = config.openingText;
    $("footerName").textContent = config.fromName;
    $("fromNameInSuccess").textContent = config.fromName;
    $("ticketFrom").textContent = config.fromName;
    $("ticketTo").textContent = config.toName;
    $("year").textContent = new Date().getFullYear();
  }

  function firstCharacter(name) {
    return [...String(name || "你")][0];
  }

  function renderActivities() {
    elements.activityGrid.innerHTML = config.activities.map(item => `
      <button class="activity-card" data-activity-id="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}" data-icon="${escapeHtml(item.icon)}">
        <span class="icon">${escapeHtml(item.icon)}</span>
        <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span>
      </button>
    `).join("");
  }

  function renderDates() {
    const dates = getSuggestedDates();
    elements.dateGrid.innerHTML = dates.map(date => {
      const iso = toLocalIsoDate(date);
      return `
        <button class="date-card" data-date="${iso}">
          <span class="weekday">${weekdayText(date)}</span>
          <span class="date-number">${date.getDate()}</span>
          <span class="month">${date.getMonth() + 1} 月</span>
        </button>
      `;
    }).join("");
  }

  function getSuggestedDates() {
    const result = [];
    const today = startOfDay(new Date());
    const offsets = [1, 3, 5, 7];
    offsets.forEach(offset => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      result.push(date);
    });
    return result;
  }

  function renderTimes() {
    elements.timeGrid.innerHTML = config.times.map(item => `
      <button class="time-card" data-time="${escapeHtml(item.value)}">
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.hint)}</small>
      </button>
    `).join("");
  }

  function bindEvents() {
    elements.startButton.addEventListener("click", () => {
      elements.planner.classList.remove("hidden");
      elements.planner.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.activityGrid.addEventListener("click", event => {
      const card = event.target.closest(".activity-card");
      if (!card) return;
      selectOne(elements.activityGrid, card);
      state.activity = card.dataset.title;
      state.activityIcon = card.dataset.icon;
      elements.customActivity.value = "";
      updateNextButton();
    });

    elements.customActivity.addEventListener("input", event => {
      const value = event.target.value.trim();
      if (value) {
        clearSelected(elements.activityGrid);
        state.activity = value;
        state.activityIcon = "✨";
      } else {
        state.activity = null;
      }
      updateNextButton();
    });

    elements.dateGrid.addEventListener("click", event => {
      const card = event.target.closest(".date-card");
      if (!card) return;
      selectOne(elements.dateGrid, card);
      state.date = card.dataset.date;
      elements.customDate.value = "";
      updateNextButton();
    });

    elements.customDate.addEventListener("change", event => {
      if (event.target.value) {
        clearSelected(elements.dateGrid);
        state.date = event.target.value;
      }
      updateNextButton();
    });

    elements.timeGrid.addEventListener("click", event => {
      const card = event.target.closest(".time-card");
      if (!card) return;
      selectOne(elements.timeGrid, card);
      state.time = card.dataset.time;
      elements.customTime.value = "";
      updateNextButton();
    });

    elements.customTime.addEventListener("change", event => {
      if (event.target.value) {
        clearSelected(elements.timeGrid);
        state.time = event.target.value;
      }
      updateNextButton();
    });

    elements.noteInput.addEventListener("input", event => {
      state.note = event.target.value.trim();
    });

    elements.nextButton.addEventListener("click", () => {
      if (!isCurrentStepValid()) return;
      if (state.step < 4) {
        state.step += 1;
        updateStep();
        elements.planner.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        state.note = elements.noteInput.value.trim();
        showSuccess();
      }
    });

    elements.backButton.addEventListener("click", () => {
      if (state.step > 1) {
        state.step -= 1;
        updateStep();
      }
    });

    $("shareButton").addEventListener("click", shareResult);
    $("calendarButton").addEventListener("click", downloadCalendarEvent);
    $("restartButton").addEventListener("click", resetApp);
  }

  function updateStep() {
    document.querySelectorAll(".step").forEach(step => {
      step.classList.toggle("active", Number(step.dataset.step) === state.step);
    });

    const percent = state.step * 25;
    elements.progressBar.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.stepLabel.textContent = `第 ${state.step} 步，共 4 步`;
    elements.backButton.classList.toggle("hidden", state.step === 1);
    elements.nextButton.textContent = state.step === 4 ? "确认这次约会" : "下一步";
    updateNextButton();
  }

  function isCurrentStepValid() {
    if (state.step === 1) return Boolean(state.activity);
    if (state.step === 2) return Boolean(state.date);
    if (state.step === 3) return Boolean(state.time);
    return true;
  }

  function updateNextButton() {
    elements.nextButton.disabled = !isCurrentStepValid();
  }

  function selectOne(container, selected) {
    clearSelected(container);
    selected.classList.add("selected");
  }

  function clearSelected(container) {
    container.querySelectorAll(".selected").forEach(item => item.classList.remove("selected"));
  }

  function setDateInputMin() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    elements.customDate.min = toLocalIsoDate(tomorrow);
  }

  function showSuccess() {
    const date = parseLocalDate(state.date);
    const code = createCode();
    $("ticketCode").textContent = `#${code}`;
    $("ticketIcon").textContent = state.activityIcon;
    $("ticketActivity").textContent = state.activity;
    $("ticketDateTime").textContent = `${formatDate(date)} · ${formatTime(state.time)}`;

    const noteBox = $("ticketNote");
    if (state.note) {
      noteBox.textContent = `小要求：${state.note}`;
      noteBox.classList.remove("hidden");
    } else {
      noteBox.classList.add("hidden");
    }

    localStorage.setItem("dateInvitationSelection", JSON.stringify({ ...state, code, savedAt: new Date().toISOString() }));
    elements.planner.classList.add("hidden");
    elements.successPanel.classList.remove("hidden");
    elements.successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    launchConfetti();
  }

  async function shareResult() {
    const text = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "约会邀请已确认", text });
        showToast("已经打开分享面板");
      } else {
        await copyText(text);
        showToast("约会信息已复制，发给 TA 就好");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyText(text);
        showToast("约会信息已复制");
      }
    }
  }

  function buildShareText() {
    const date = formatDate(parseLocalDate(state.date));
    const note = state.note ? `\n我的小要求：${state.note}` : "";
    return `我选好啦 ♡\n约会内容：${state.activity}\n时间：${date} ${formatTime(state.time)}${note}\n\n这次要说话算话哦，${config.fromName}。`;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function downloadCalendarEvent() {
    const start = combineDateTime(state.date, state.time);
    const end = new Date(start.getTime() + config.defaultDurationMinutes * 60 * 1000);
    const title = `${state.activity}｜${config.fromName} × ${config.toName}`;
    const description = state.note ? `小要求：${state.note}` : "好好见面，好好聊天。";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Our Date Invitation//CN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@our-date.local`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsLocal(start)}`,
      `DTEND:${toIcsLocal(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `我们的约会-${state.date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("日历文件已生成");
  }

  function resetApp() {
    state.step = 1;
    state.activity = null;
    state.activityIcon = "♡";
    state.date = null;
    state.time = null;
    state.note = "";
    [elements.activityGrid, elements.dateGrid, elements.timeGrid].forEach(clearSelected);
    elements.customActivity.value = "";
    elements.customDate.value = "";
    elements.customTime.value = "";
    elements.noteInput.value = "";
    elements.successPanel.classList.add("hidden");
    elements.planner.classList.remove("hidden");
    updateStep();
    elements.planner.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function launchConfetti() {
    const symbols = ["♥", "♡", "✦", "•"];
    for (let i = 0; i < 34; i += 1) {
      const item = document.createElement("span");
      item.className = "confetti";
      item.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      item.style.left = `${Math.random() * 100}%`;
      item.style.fontSize = `${10 + Math.random() * 15}px`;
      item.style.color = ["#e76b7d", "#c49add", "#f2a95b"][Math.floor(Math.random() * 3)];
      item.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      item.style.animationDelay = `${Math.random() * .5}s`;
      elements.confettiLayer.appendChild(item);
      setTimeout(() => item.remove(), 3300);
    }
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
  }

  function createCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "DATE-";
    for (let i = 0; i < 5; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(date);
  }

  function formatTime(value) {
    const [hourText, minute] = value.split(":");
    const hour = Number(hourText);
    const period = hour < 12 ? "上午" : hour < 18 ? "下午" : "晚上";
    return `${period} ${String(hour).padStart(2, "0")}:${minute}`;
  }

  function weekdayText(date) {
    return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseLocalDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function combineDateTime(isoDate, time) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute, 0);
  }

  function toLocalIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function toIcsLocal(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
      "T",
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
      "00"
    ].join("");
  }

  function toIcsUtc(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function escapeIcs(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  init();
})();
