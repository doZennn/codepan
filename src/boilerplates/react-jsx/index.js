export default async () => {
  const [htmlCode, jsCode, cssCode] = await Promise.all([
    import(/* webpackChunkName: "boilerplate-react-jsx" */ '!raw-loader!./codepan.html'),
    import(/* webpackChunkName: "boilerplate-react-jsx" */'!raw-loader!./codepan.js')
  ])

  return {
    js: {
      code: jsCode,
      transformer: 'babel'
    },
    html: {
      code: htmlCode,
      transformer: 'html'
    },
    showPans: ['js', 'output']
  }
}
