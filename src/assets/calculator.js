(function () {
  "use strict";

  var dataEl = document.getElementById("product-data");
  if (!dataEl) return;

  var DATA;
  try {
    DATA = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  var STORAGE_KEY = "kt-calc-state";

  var state = {
    internet: null, // { id, fee, gift, name }
    term: 3,
    centrixOn: false,
    lines: 2,
    addons: {}, // { addonId: true } — 센트릭스 부가 옵션 (월 요금만)
  };

  var won = function (n) {
    return (Number(n) || 0).toLocaleString("ko-KR");
  };

  // ---------- DOM ref ----------
  var internetCards = document.querySelectorAll('[data-group="internet"] .opt-card');
  var toggle = document.getElementById("centrix-toggle");
  var linesBox = document.getElementById("centrix-lines");
  var addonsBox = document.getElementById("centrix-addons");
  var addonChecks = document.querySelectorAll(".addon-check");
  var lineOut = document.getElementById("line-count");
  var giftEl = document.getElementById("gift-amount");
  var monthlyEl = document.getElementById("monthly-amount");
  var breakdownEl = document.getElementById("result-breakdown");
  var configField = document.getElementById("f-config");
  var summaryEl = document.getElementById("config-summary");

  // ---------- 선택 헬퍼 (이벤트 + 복원 공용) ----------
  function selectInternet(card, doRender) {
    internetCards.forEach(function (c) { c.classList.remove("is-active"); });
    card.classList.add("is-active");
    state.internet = {
      id: card.dataset.id,
      fee: Number(card.dataset.fee),
      gift: Number(card.dataset.gift),
      discount: Number(card.dataset.discount) || 0,
      name: card.querySelector(".opt-name").textContent,
    };
    if (doRender) render();
  }

  function clearInternet(doRender) {
    internetCards.forEach(function (c) { c.classList.remove("is-active"); });
    state.internet = null;
    if (doRender) render();
  }

  function setCentrix(on, doRender) {
    state.centrixOn = !!on;
    if (toggle) toggle.checked = state.centrixOn;
    if (linesBox) linesBox.hidden = !state.centrixOn;
    if (addonsBox) addonsBox.hidden = !state.centrixOn;
    // 센트릭스를 끄면 부가 옵션도 해제 (옵션은 센트릭스 전용)
    if (!state.centrixOn) {
      state.addons = {};
      addonChecks.forEach(function (c) { c.checked = false; });
    }
    if (doRender) render();
  }

  function setAddon(id, on, doRender) {
    if (on) state.addons[id] = true;
    else delete state.addons[id];
    addonChecks.forEach(function (c) {
      if (c.dataset.addon === id) c.checked = !!on;
    });
    if (doRender) render();
  }

  function setLines(n, doRender) {
    state.lines = Math.max(1, Math.min(50, Number(n) || 1));
    if (lineOut) lineOut.textContent = state.lines;
    if (doRender) render();
  }

  // ---------- 이벤트 ----------
  internetCards.forEach(function (card) {
    card.addEventListener("click", function () {
      // 이미 선택된 카드를 다시 누르면 선택 해제 (인터넷 없이 = 센트릭스 단독 가능)
      if (card.classList.contains("is-active")) clearInternet(true);
      else selectInternet(card, true);
    });
  });

  if (toggle) {
    toggle.addEventListener("change", function () { setCentrix(toggle.checked, true); });
  }

  addonChecks.forEach(function (chk) {
    chk.addEventListener("change", function () {
      setAddon(chk.dataset.addon, chk.checked, true);
    });
  });

  document.querySelectorAll(".step-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLines(state.lines + Number(btn.dataset.step), true);
    });
  });

  // ---------- 상태 저장/복원 (페이지 간 유지) ----------
  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          internetId: state.internet ? state.internet.id : null,
          term: state.term,
          centrixOn: state.centrixOn,
          lines: state.lines,
          addons: Object.keys(state.addons),
        })
      );
    } catch (e) {}
  }

  function restoreState() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) { saved = null; }
    if (!saved) return;

    if (saved.lines) setLines(saved.lines, false);
    if (saved.centrixOn) {
      setCentrix(true, false);
      if (Array.isArray(saved.addons)) {
        saved.addons.forEach(function (id) { setAddon(id, true, false); });
      }
    }
    if (saved.internetId) {
      internetCards.forEach(function (card) {
        if (card.dataset.id === saved.internetId) selectInternet(card, false);
      });
    }
  }

  // 선택된 센트릭스 부가 옵션 목록
  function selectedAddons() {
    if (!state.centrixOn || !DATA.centrix.addons) return [];
    return DATA.centrix.addons.filter(function (a) { return state.addons[a.id]; });
  }

  // ---------- 신청 내역 요약 ----------
  function buildConfigSummary() {
    var parts = [];
    if (state.internet) parts.push(state.internet.name);
    if (state.centrixOn) {
      parts.push("인터넷전화 " + state.lines + "회선");
      var ads = selectedAddons();
      if (ads.length) {
        parts.push(ads.map(function (a) { return a.name; }).join("·"));
      }
    }
    if (parts.length === 0) return "";
    parts.push(state.term + "년 약정"); // 인터넷·센트릭스 공통
    if (giftEl) parts.push("예상 사은품 " + giftEl.textContent + "원");
    return parts.join(" / ");
  }

  function syncApply() {
    var summary = buildConfigSummary();
    if (configField) {
      configField.value = summary || "상품 미선택 (상담 후 결정)";
    }
    if (summaryEl) {
      if (summary) {
        summaryEl.textContent = summary;
        summaryEl.classList.remove("is-empty");
      } else {
        summaryEl.textContent = "인터넷 또는 인터넷전화를 선택하면 신청 내역이 표시됩니다.";
        summaryEl.classList.add("is-empty");
      }
    }
  }

  // ---------- 계산 & 렌더 ----------
  function render() {
    var mult = (DATA.termMultiplier && DATA.termMultiplier[state.term]) || 1;
    var lines = [];
    var totalGift = 0;
    var totalMonthly = 0;

    // 인터넷 (선택 시에만)
    if (state.internet) {
      var netGift = Math.round((state.internet.gift * mult) / 1000) * 1000;
      totalGift += netGift;
      totalMonthly += state.internet.fee;
      lines.push({
        label: state.internet.name + " (" + state.term + "년 약정)",
        sub: "월 " + won(state.internet.fee) + "원",
        gift: netGift,
      });
    }

    // 센트릭스 (선택 시에만)
    if (state.centrixOn) {
      var c = DATA.centrix;
      var lineGift = c.giftPerLine * state.lines;
      var lineMonthly = c.monthlyPerLine * state.lines;
      totalGift += lineGift;
      totalMonthly += lineMonthly;
      lines.push({
        label: "인터넷전화 " + state.lines + "회선 (" + state.term + "년 약정)",
        sub: "월 " + won(lineMonthly) + "원",
        gift: lineGift,
      });
    }

    // 결합 보너스 + 결합 할인 (인터넷 + 센트릭스 둘 다 선택했을 때만)
    if (state.internet && state.centrixOn) {
      totalGift += DATA.bundleBonus;
      lines.push({
        label: "인터넷 + 전화 결합 보너스",
        sub: "추가 현금",
        gift: DATA.bundleBonus,
      });

      // 결합 할인 — 월 요금에서 차감 (요금제별 금액)
      if (state.internet.discount > 0) {
        totalMonthly -= state.internet.discount;
        lines.push({
          label: "인터넷 + 전화 결합 할인",
          discount: true,
          monthly: state.internet.discount,
        });
      }
    }

    // 센트릭스 부가 옵션 (월 요금만, 캐시백 없음)
    if (state.centrixOn) {
      selectedAddons().forEach(function (a) {
        totalMonthly += a.monthly;
        lines.push({ label: a.name, addon: true, monthly: a.monthly });
      });
    }

    // 아무것도 선택하지 않음
    if (lines.length === 0) {
      if (breakdownEl)
        breakdownEl.innerHTML =
          '<li class="result-empty">인터넷 또는 인터넷전화를 선택하면 사은품이 계산됩니다.</li>';
      if (giftEl) giftEl.textContent = "0";
      if (monthlyEl) monthlyEl.textContent = "0원";
      syncApply();
      saveState();
      return;
    }

    if (breakdownEl) {
      breakdownEl.innerHTML = lines
        .map(function (l) {
          var subHtml, rightHtml;
          if (l.discount) {
            subHtml = '<span class="rl-sub">월 요금 할인</span>';
            rightHtml = '<span class="rl-discount">월 −' + won(l.monthly) + "원</span>";
          } else if (l.addon) {
            subHtml = '<span class="rl-sub">부가 옵션 · 사은품 미해당</span>';
            rightHtml = '<span class="rl-fee">월 ' + won(l.monthly) + "원</span>";
          } else {
            subHtml = '<span class="rl-sub">' + l.sub + "</span>";
            rightHtml = '<span class="rl-gift">+' + won(l.gift) + "원</span>";
          }
          return (
            '<li><div class="rl-main"><span class="rl-label">' +
            l.label +
            "</span>" +
            subHtml +
            "</div>" +
            rightHtml +
            "</li>"
          );
        })
        .join("");
    }

    if (giftEl) animateTo(giftEl, totalGift);
    if (monthlyEl) monthlyEl.textContent = won(totalMonthly) + "원";

    syncApply();
    saveState();
  }

  // 숫자 카운트업 애니메이션
  function animateTo(el, target) {
    var start = Number(String(el.textContent).replace(/[^0-9]/g, "")) || 0;
    var duration = 450;
    var startTime = null;
    function frame(t) {
      if (!startTime) startTime = t;
      var p = Math.min((t - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round((start + (target - start) * eased) / 1000) * 1000;
      el.textContent = won(val);
      if (p < 1) requestAnimationFrame(frame);
      else {
        el.textContent = won(target);
        syncApply(); // 애니메이션 종료 후 최종 금액으로 요약 갱신
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------- 상담신청 폼 ----------
  var form = document.getElementById("apply-form");
  var done = document.getElementById("apply-done");
  var errEl = document.getElementById("form-error");
  var againBtn = document.getElementById("apply-again");

  function setInvalid(el, on) {
    if (el) el.classList.toggle("is-invalid", !!on);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#f-name");
      var phone = form.querySelector("#f-phone");
      var email = form.querySelector("#f-email");
      var region = form.querySelector("#f-region");
      var agree = form.querySelector("#f-agree");

      var ok = true;
      if (!name.value.trim()) { setInvalid(name, true); ok = false; } else setInvalid(name, false);

      var phoneOk = /^[0-9\-\s]{9,}$/.test(phone.value.trim());
      if (!phoneOk) { setInvalid(phone, true); ok = false; } else setInvalid(phone, false);

      // 이메일 필수 — 형식까지 검사
      var emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!emailOk) { setInvalid(email, true); ok = false; } else setInvalid(email, false);

      // 설치 주소 필수
      if (region && !region.value.trim()) { setInvalid(region, true); ok = false; } else if (region) setInvalid(region, false);

      if (!agree.checked) ok = false;

      if (!ok) {
        if (errEl) errEl.hidden = false;
        return;
      }
      if (errEl) errEl.hidden = true;

      // 신청 직전 최신 조건을 hidden 필드에 반영
      if (configField) configField.value = buildConfigSummary() || "상품 미선택 (상담 후 결정)";

      // TODO(전송 연결): 여기서 fetch(form.action, {...}) 로 실제 전송하세요.
      // 현재는 UI 데모로 접수 완료 화면만 표시합니다.
      form.hidden = true;
      if (done) done.hidden = false;
      if (done) done.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", function () {
      if (done) done.hidden = true;
      if (form) { form.hidden = false; form.reset(); }
    });
  }

  // ---------- 초기화 ----------
  restoreState();
  render();
})();
