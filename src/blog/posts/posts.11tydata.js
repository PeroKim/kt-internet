// 디렉토리 데이터: src/blog/posts/ 안의 모든 포스트에 적용
// 글 하나 = 마크다운 파일 하나를 이 폴더에 추가하면 됩니다.
module.exports = {
  layout: "post.njk",
  tags: "post", // collections.post 에 포함
  eleventyComputed: {
    // URL = /blog/<파일명>/  (파일명 = 영문 슬러그)
    permalink: (data) => `/blog/${data.page.fileSlug}/`,
    // OG 이미지: 글에 image 지정 시 사용, 없으면 사이트 기본 OG
    ogImage: (data) => data.image || "/assets/og-default.svg",
  },
};
