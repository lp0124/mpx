import { ENV_OBJ, envError } from '../../../common/js'

function showToast (options = {}) {
  if (!options.icon) options.icon = 'none'
  if (options.title) ENV_OBJ.showToast(options)
}

const hideToast = ENV_OBJ.hideToast || envError('hideToast')

const showLoading = ENV_OBJ.showLoading || envError('showLoading')

const hideLoading = ENV_OBJ.hideLoading || envError('hideLoading')

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading
}
