import { ENV_OBJ } from '../../../common/js'

function showModal (options = {}) {
  const cacheFail = options.fail
  const cacheSuccess = options.success
  options.success = function (res) {
    if (!res.confirm) cacheFail.call(this)
      else cacheSuccess.call(this, res)
  }
  ENV_OBJ.showModal(options)
}

export {
  showModal
}
