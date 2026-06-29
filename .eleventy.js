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
