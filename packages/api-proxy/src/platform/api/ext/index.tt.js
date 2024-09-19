import { ENV_OBJ } from '../../../common/js'

function getExtConfigSync () {
  return ENV_OBJ.getExtConfigSync().extConfig
}

export {
  getExtConfigSync
}
