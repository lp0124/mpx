import { getEnvObj } from '@mpxjs/utils'

function compareVersion (v1, v2) {
  const parts1 = v1.split('.').map(Number) // 直接转换为数字数组
  const parts2 = v2.split('.').map(Number)
  const len = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < len; i++) {
    // 如果某个数组长度不够，则其值默认为0
    const num1 = i < parts1.length ? parts1[i] : 0
    const num2 = i < parts2.length ? parts2[i] : 0
    if (num1 > num2) {
      return 1
    }
    if (num1 < num2) {
      return -1
    }
  }
  return 0
}

function getExt () {
  const envObj = getEnvObj()
  const res = envObj.getSystemInfoSync() || {}
  const system = res.system || 'unknown'
  const platform = res.platform || 'unknown'
  const pixelRatio = res.pixelRatio || res.devicePixelRatio || 3
  const screenWidth = res.screen ? res.screen.width : res.screenWidth || 0
  // const screenHeight = res.screen ? res.screen.height : res.screenHeight || 0

  function getImageFormat () {
    // 对开发者工具的特殊处理
    if (platform === 'devtools') {
      return 'webp'
    }

    let os
    let version
    if (__mpx_mode__ === 'wx') {
      ;[os, version] = system.split(' ')
    }
    if (__mpx_mode__ === 'ali') {
      os = platform
      version = system
    }

    // 检查AVIF支持
    if (
      (os === 'Android' && compareVersion(version, '12.0.0') >= 0) ||
      (os === 'iOS' && compareVersion(version, '16.0.0') >= 0)
    ) {
      return 'avif'
    }
    // 检查WebP支持
    if (os === 'Android' || (os === 'iOS' && compareVersion(version, '14.0.0') >= 0)) {
      return 'webp'
    }
    return 'normal'
  }

  return {
    // system,
    // platform,
    pixelRatio,
    screenWidth,
    // screenHeight,
    imageFormat: getImageFormat()
  }
}

const mpxExt = getExt()

export default function extendFieldMixin () {
  return {
    data: {
      mpxExt
    }
  }
}
