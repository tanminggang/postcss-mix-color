const postcss = require('postcss')
const balanced = require('balanced-match')
const Color = require('color')
const messageHelpers = require('postcss-message-helpers')

const mix = (c1, c2, w = '') => {
  const weight = w.endsWith('%') ? w.replace('%', '') : w * 100
  return Color(c1).mix(Color(c2), weight / 100).string()
}

const transformValue = (string, source) => {
  const idx = string.indexOf('mixc(')
  if (idx < 0) return string
  if (idx >= 0) {
    const pre = string.substr(0, idx)
    const s = string.substr(idx)
    const { body, post } = balanced('(', ')', s)
    if (!body) throw new Error(`unclosed bracket in "${string}"`, source)
    const color = mix.apply(null, body.split(/,\s*(?![^()]*\))/))
    return pre + color + transformValue(post, source)
  }
}

const transformDecl = decl => {
  if (decl.value && decl.value.indexOf('mixc(') > -1) {
    messageHelpers.try(
      () => {
        decl.value = transformValue(decl.value, decl.source)
      },
      decl.source
    )
  }
}

module.exports = postcss.plugin('postcss-color-mix', () => style => {
  style.walkDecls(transformDecl)
})
