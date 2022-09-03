<template>
  <div class="page" :class="{readonly: isReadOnly}">
    <home-header />

    <compiled-code-dialog
      v-if="js.code"
      :code="js"
      :show.sync="showCompiledCode.js"
      highlight="javascript"
      type="js">
    </compiled-code-dialog>

    <compiled-code-dialog
      v-if="html.code"
      :code="html"
      :show.sync="showCompiledCode.html"
      highlight="htmlmixed"
      type="html">
    </compiled-code-dialog>

    <compiled-code-dialog
      v-if="css.code"
      :code="css"
      :show.sync="showCompiledCode.css"
      highlight="css"
      type="css">
    </compiled-code-dialog>

    <div class="pans">
      <html-pan class="pan" v-show="isVisible('html')" />
      <css-pan class="pan" v-show="isVisible('css')" />
      <js-pan class="pan" v-show="isVisible('js')" />
      <console-pan class="pan" v-show="isVisible('console')" />
      <output-pan class="pan" v-show="isVisible('output')" />
    </div>
  </div>
</template>

<script>
import progress from 'nprogress'
import { mapState, mapActions } from 'vuex'
import notie from 'notie'
import isElectron from 'is-electron'
import { inIframe } from '@/utils'
import Event from '@/utils/event'
import HomeHeader from '@/components/HomeHeader.vue'
import HTMLPan from '@/components/HTMLPan.vue'
import JSPan from '@/components/JSPan.vue'
import OutputPan from '@/components/OutputPan.vue'
import ConsolePan from '@/components/ConsolePan.vue'
import CSSPan from '@/components/CSSPan.vue'
import CompiledCodeDialog from '@/components/CompiledCodeDialog.vue'

async function handleRouteChange(to, vm) {
  let boilerplate
  let gist

  const { name } = to

  if (name === 'home') {
    boilerplate = to.query.boilerplate
    gist = to.query.gist
  } else if (name === 'boilerplate') {
    boilerplate = to.params.boilerplate
  } else if (name === 'gist') {
    gist = to.params.gist
  }

  if (boilerplate) {
    await vm.setBoilerplate(boilerplate)
    Event.$emit('refresh-editor')
    Event.$emit('run')
  } else if (gist) {
    await vm.setGist(gist)
    Event.$emit('refresh-editor')
    Event.$emit('run')
  }

  await vm.setAutoRun(true)

  progress.done()
}

export default {
  name: 'editor-page',
  data() {
    return {
      showCompiledCode: {
        js: false,
        css: false,
        html: false
      },
      isReadOnly: 'readonly' in this.$route.query
    }
  },
  computed: {
    ...mapState(['visiblePans', 'editorStatus', 'js', 'css', 'html'])
  },
  beforeRouteEnter(to, from, next) {
    next(async vm => {
      await handleRouteChange(to, vm)
    })
  },
  async beforeRouteUpdate(to, from, next) {
    console.log('route updated to', to)
    await handleRouteChange(to, this)
    next()
  },
  watch: {
    '$route.query.show': {
      handler(next, prev) {
        if (!next && prev) {
          this.showPans(['js', 'html', 'output'])
        } else if (next !== prev) {
          this.showPans(next.split(','))
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Tell the parent window we're ready!
    if (inIframe) {
      window.parent.postMessage({ type: 'codepan-ready' }, '*')
    }

    window.addEventListener('storage', this.handleStorageChanged)

    window.addEventListener('beforeunload', e => {
      if (!inIframe && !isElectron() && this.editorStatus !== 'saved') {
        e.returnValue = false
        return false
      }
    })

    // Since in prevous versions we didn't fetch userMeta after login
    // We need to force user to re-login in order to get that data
    if (this.$store.state.githubToken && Object.keys(this.$store.state.userMeta).length === 0) {
      this.$store.dispatch('setGitHubToken', null)
        .then(() => {
          notie.alert({
            type: 'warning',
            text: `You need to login again to use the new version!`
          })
        })
    }

    Event.$on('show-compiled-code', type => {
      this.showCompiledCode[type] = true
    })
  },
  methods: {
    ...mapActions(['setBoilerplate', 'setGist', 'showPans', 'setAutoRun']),
    isVisible(pan) {
      return this.visiblePans.indexOf(pan) !== -1
    },
    handleStorageChanged(e) {
      if (e.key === 'codepan:gh-token' && e.newValue) {
        this.$store.dispatch('setGitHubToken', e.newValue)
        if (inIframe) {
          notie.confirm({
            text: 'Success, reload this iframe?',
            submitCallback() {
              window.location.reload()
            }
          })
        } else {
          notie.alert({
            type: 'success',
            text: 'Successfully logged in with GitHub!'
          })
        }
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener('storage', this.handleStorageChanged)
  },
  components: {
    'html-pan': HTMLPan,
    'js-pan': JSPan,
    'output-pan': OutputPan,
    'console-pan': ConsolePan,
    'css-pan': CSSPan,
    'home-header': HomeHeader,
    CompiledCodeDialog
  }
}
</script>

<style src="codemirror/lib/codemirror.css">

</style>
<style src="codemirror/addon/fold/foldgutter.css">

</style>

<style lang="css">
  .cm-s-base16-ocean-dark.CodeMirror { background: transparent; color: #dfe1e8; }
  .cm-s-base16-ocean-dark div.CodeMirror-selected { background: #4f5b66; }
  .cm-s-base16-ocean-dark .CodeMirror-line::selection, .cm-s-base16-ocean-dark .CodeMirror-line > span::selection, .cm-s-base16-ocean-dark .CodeMirror-line > span > span::selection { background: rgba(48, 48, 48, .99); }
  .cm-s-base16-ocean-dark .CodeMirror-line::-moz-selection, .cm-s-base16-ocean-dark .CodeMirror-line > span::-moz-selection, .cm-s-base16-ocean-dark .CodeMirror-line > span > span::-moz-selection { background: rgba(48, 48, 48, .99); }
  .cm-s-base16-ocean-dark .CodeMirror-gutters { background: #2b303b; border-right: 0px; }
  .cm-s-base16-ocean-dark .CodeMirror-guttermarker { color: #c6c6c6; }
  .cm-s-base16-ocean-dark .CodeMirror-guttermarker-subtle { color: #c6c6c6; }
  .cm-s-base16-ocean-dark .CodeMirror-linenumber { color: #65737e; }
  .cm-s-base16-ocean-dark .CodeMirror-activeline .CodeMirror-linenumber { color: #c6c6c6; }
  .cm-s-base16-ocean-dark .CodeMirror-cursor { border-left: 2px solid #a7adba; }

  .cm-s-base16-ocean-dark span.cm-comment { color: #65737e; }
  .cm-s-base16-ocean-dark span.cm-atom { color: #b48ead; }
  .cm-s-base16-ocean-dark span.cm-number { color: #D08770; }

  .cm-s-base16-ocean-dark span.cm-property { color: #8fa1b3; }
  .cm-s-base16-ocean-dark span.cm-attribute { color: #bf616a; }
  .cm-s-base16-ocean-dark span.cm-keyword { color: #b48ead; }
  .cm-s-base16-ocean-dark span.cm-string { color: #a3be8c; }

  .cm-s-base16-ocean-dark span.cm-variable { color: #bf616a; }
  .cm-s-base16-ocean-dark span.cm-variable-2 { color: #bf616a; }
  .cm-s-base16-ocean-dark span.cm-variable-3 { color: #D08770; }
  .cm-s-base16-ocean-dark span.cm-def { color: #bf616a; }
  .cm-s-base16-ocean-dark span.cm-bracket { color: #dfe1e8; }
  .cm-s-base16-ocean-dark span.cm-tag { color: #bf616a; }
  .cm-s-base16-ocean-dark span.cm-link { color: #b48ead; }
  .cm-s-base16-ocean-dark span.cm-error { background: #bf616a; color: #a7adba; }

  .cm-s-base16-ocean-dark .CodeMirror-activeline-background { background: #65737e30; }
  .cm-s-base16-ocean-dark .CodeMirror-matchingbracket { text-decoration: underline; color: white !important; }
  .cm-qualifier { color: #D08770; }
</style>

<style lang="stylus" scoped>
.pans
  height: calc(100% - 40px)
  display: flex
  position: relative

.pan
  position: absolute
  top: 0
  bottom: 0
  overflow: auto

.pan:not(.output-pan)
  background-color: #2b303b
  &.active-pan
    background-color: #2b303b
</style>

<style lang="stylus">
.CodeMirror
  height: calc(100% - 40px)
  background-color: transparent

.CodeMirror-gutters
  background-color: transparent
  border-right: none

.pan-head
  height: 40px
  padding: 0 10px
  font-size: 14px
  display: flex
  justify-content: space-between
  align-items: center
  background-color: #2b303b
  color: #65737f
  svg.svg-icon
    margin-left: 5px
    cursor: pointer
    width: 14px
    height: @width
    color: #666
    outline: none
    &:hover
      color: #000

.el-dropdown
  color: #65737f

.pans.resizing
  cursor: ew-resize
  .pan-resizer
    cursor: ew-resize

.page.readonly
  .CodeMirror-cursor
    display: none !important

.cf-wrapper
  height: 40px
  line-height: 40px !important
  z-index: 9999 !important
  padding: 0 10px !important
</style>
