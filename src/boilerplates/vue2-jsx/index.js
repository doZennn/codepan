export default async () => {
  const [htmlCode, jsCode, cssCode] = await Promise.all([
    import(/* webpackChunkName: "boilerplate-vue2-jsx" */ '!raw-loader!./codepan.html'),
    import(/* webpackChunkName: "boilerplate-vue2-jsx" */'!raw-loader!./codepan.js'),
    import(/* webpackChunkName: "boilerplate-vue2-jsx" */'!raw-loader!./codepan.css')
  ])

  return {
    js: {
      code: jsCode,
      transformer: 'vue2-jsx'
    },
    html: {
      code: htmlCode,
      transformer: 'html'
    },
    css: {
      code: cssCode,
      transformer: 'css'
    },
    showPans: ['js', 'output']
  }
}
