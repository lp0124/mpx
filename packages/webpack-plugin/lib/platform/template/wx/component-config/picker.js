const TAG_NAME = 'picker'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: true })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    props: [
      {
        test: 'mode',
        ali: aliPropLog
      },
      {
        test: /^(header-text)$/,
        tt: ttPropLog,
        swan: baiduPropLog,
        ali: aliPropLog,
        jd: jdPropLog,
        qa: qaPropLog
      }
    ],
    event: [
      {
        test: /^(cancel)$/,
        ali: aliEventLog
      }
    ]
  }
}
