module.exports = function (eleventyConfig) {
  // 정적 자산 패스스루
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // 천 단위 콤마 필터
  eleventyConfig.addFilter("won", (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString("ko-KR");
  });

  // JSON 직렬화 (페이지에 데이터 임베드용)
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  // SEO 날짜 필터
  eleventyConfig.addFilter("isoDate", (d) =>
    d ? new Date(d).toISOString() : new Date().toISOString()
  );
  eleventyConfig.addFilter("dateYmd", (d) =>
    (d ? new Date(d) : new Date()).toISOString().slice(0, 10)
  );

  // 현재 연도
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // ---- 블로그 헬퍼 ----------------------------------------------------
  // 한국어 날짜: 2026-06-29 -> "2026년 6월 29일"
  eleventyConfig.addFilter("readableDate", (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  });

  // 본문 HTML 기준 예상 읽기 시간 (한국어 ~500자/분)
  eleventyConfig.addFilter("readingTime", (html) => {
    const text = String(html || "").replace(/<[^>]+>/g, " ");
    const chars = (text.match(/\S/g) || []).length;
    return `${Math.max(1, Math.round(chars / 500))}분`;
  });

  // XML/Atom 피드용 escape
  eleventyConfig.addFilter("escapeHtml", (s) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  );

  // 최신순 정렬 / N개 자르기 / 현재 글 제외
  eleventyConfig.addFilter("newest", (arr) => [...(arr || [])].reverse());
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("exceptUrl", (arr, url) =>
    (arr || []).filter((p) => p.url !== url)
  );

  // 한글 보존 슬러그 (기본 slugify는 한글을 날림)
  const topicSlug = (t) => String(t).trim().replace(/\s+/g, "-");
  eleventyConfig.addFilter("topicSlug", topicSlug);

  // 제목(h2/h3)에 id 부여 — TOC 링크용
  const headingId = (text) =>
    String(text)
      .replace(/<[^>]+>/g, "")
      .trim()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  eleventyConfig.addFilter("addHeadingIds", (html) =>
    String(html || "").replace(
      /<h([23])>([\s\S]*?)<\/h\1>/g,
      (_f, lvl, inner) => `<h${lvl} id="${headingId(inner)}">${inner}</h${lvl}>`
    )
  );

  // h2/h3에서 목차(nav.toc) 생성 — 제목 2개 미만이면 빈 문자열
  eleventyConfig.addFilter("toc", (html) => {
    const re = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
    const items = [];
    let m;
    while ((m = re.exec(html))) {
      items.push({ level: +m[1], id: m[2], text: m[3].replace(/<[^>]+>/g, "").trim() });
    }
    if (items.length < 2) return "";
    let out = '<nav class="toc" aria-label="목차"><p class="toc-title">목차</p><ol class="toc-list">';
    let openSub = false;
    items.forEach((it, i) => {
      if (it.level === 2) {
        if (openSub) { out += "</ol></li>"; openSub = false; }
        out += `<li><a href="#${it.id}">${it.text}</a>`;
        if (items[i + 1] && items[i + 1].level === 3) { out += '<ol class="toc-sub">'; openSub = true; }
        else { out += "</li>"; }
      } else {
        out += `<li class="toc-sub-item"><a href="#${it.id}">${it.text}</a></li>`;
      }
    });
    if (openSub) out += "</ol></li>";
    out += "</ol></nav>";
    return out;
  });

  // 주제(topic)별 글 모음 — /blog/tag/<주제>/ 아카이브 생성용
  eleventyConfig.addCollection("topics", (api) => {
    const map = new Map();
    for (const post of api.getFilteredByTag("post")) {
      for (const t of post.data.topics || []) {
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(post);
      }
    }
    return [...map.entries()]
      .map(([topic, posts]) => ({
        topic,
        slug: topicSlug(topic),
        posts: posts.sort((a, b) => b.date - a.date),
      }))
      .sort((a, b) => b.posts.length - a.posts.length || a.topic.localeCompare(b.topic, "ko"));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
