
const AR_IMAGES_DIR  = `${wx.env.USER_DATA_PATH}/ar-assets/images`


export const getFileSystemManager = () => {
  return wx.getFileSystemManager()
}

const usePromise = () => {
  let resolve
  let reject
  const promise = new Promise((resolver,  rejector) => {
    resolve = resolver
    reject = rejector
  })
  return [promise, resolve, reject]
}


const promisify = (fn, thisArg) => {
  return function (options, ...args) {
    const [promise, success, fail] = usePromise()
    const conf = Object.assign({}, options, { success, fail })
    const that = thisArg || getFileSystemManager()
    fn.call(that, conf, ...args)
    return promise
  }
}

export const isDirectorySync = (path) => {
  try {
    const fs = getFileSystemManager()
    const stats = fs.statSync(path)
    // console.log('isDirectorySync stats: ', stats)
    return stats.isDirectory()
  } catch (e) {
    // console.log('isDirectory e: ', e)
    return false
  }
}

export const isFileSync = (path) => {
  try {
    const fs = getFileSystemManager()
    const stats = fs.statSync(path)
    // console.log('isFileSync stats: ', stats)
    return stats.isFile()
  } catch (e) {
    // console.log('isFileSync e: ', e)
    return false
  }
}

export const mkdir = (dirPath, recursive = true) => {
  const fs = getFileSystemManager()
  const options = { dirPath, recursive }
  return promisify(fs.mkdir)(options)
}

export const saveFile = async (sourcePath, destPath) => {
  const fs = getFileSystemManager()
  const options = { tempFilePath: sourcePath, filePath: destPath }
  const result = await promisify(fs.saveFile)(options)
  return result.savedFilePath
}

export const removeSavedFile = (filePath) => {
  const fs = getFileSystemManager()
  const options = { filePath }
  return promisify(fs.removeSavedFile)(options)
}

export const unlink = (filePath) => {
  const fs = getFileSystemManager()
  const options = { filePath }
  return promisify(fs.unlink)(options)
}

export const chooseImages = options => {
  const mediaType = ['image']
  const sourceType = ['album', 'camera']
  const sizeType = ['original', 'compressed']
  const defaultOptions = { count: 9, mediaType, sourceType, sizeType }
  const config = Object.assign({}, defaultOptions, options)
  return promisify(wx.chooseMedia, wx)(config)
}


// const 