

export const usePromise = () => {
  let resolve
  let reject
  const promise = new Promise((resolver,  rejector) => {
    resolve = resolver
    reject = rejector
  })
  return [promise, resolve, reject]
}

export const getVKSupportVersion = () => {
	if (typeof wx.isVKSupport !== 'function') {
		return ''
	}
	if (wx.isVKSupport('v2')) {
		return 'v2'
	}
	if (wx.isVKSupport('v1')) {
		return 'v1'
	}
	return ''
}

