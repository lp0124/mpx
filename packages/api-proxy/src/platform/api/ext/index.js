import { ENV_OBJ, envError } from '../../../common/js'

const getExtConfigSync = ENV_OBJ.getExtConfigSync || envError('getExtConfigSync')

export {
  getExtConfigSync
}
