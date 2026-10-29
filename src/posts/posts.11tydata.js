export default {
  layout: 'post.njk',
  tags: ['post'],
  permalink: data => `/posts/${data.page.fileSlug}/`
};
