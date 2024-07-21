import { getVKSupportVersion } from '../../utils/utils'
import { chooseImages, isDirectorySync, isFileSync, saveFile, mkdir } from './fs'

Page({
	data: {
		images: []
	},

	onLoad() {
		// this.AR_IMAGES_DIR = `${wx.env.USER_DATA_PATH}/ar-assets/images`
		this.AR_IMAGES_DIR = `${wx.env.USER_DATA_PATH}`
		this.vk = this.initVK()
	},

	async choosePic() {
		const result = await chooseImages()
		console.log('result: ', result)
		const { tempFiles } = result || {}
		const files = Array.isArray(tempFiles) ? tempFiles : []
		const images = files.map(item => {
			const { tempFilePath: path } = item || {}
			return Object.assign({}, item, { path })
		}).slice(0, 4)
		const markerPromises = images.map(item => this.saveImageToLocalFile(item.path))
		const markers = await Promise.all(markerPromises).catch(e => {
			console.error('promise all catch: ', e)
		})
		const markerMap = markers.reduce((acc, item, index) => {
			return Object.assign(acc, { [item]: images[index] })
		}, {})
		console.log('markerMap: ', markerMap)
		this.setData({ images: images.slice(0, 4) })
		console.log('images: ', this.data.images)
	},

	initVK() {
		const vkSupportVersion = getVKSupportVersion()
		const vkOptions = {
			version: vkSupportVersion,
			track: {
				plane: {
					mode: 3
				}
			},
			marker: true
		}
		const vk = wx.createVKSession(vkOptions)
		const listeners = [
			{
				event: 'addAnchors',
				handler: this.vkAddAnchorsListener.bind(this)
			},
			{
				event: 'updateAnchors',
				handler: this.vkUpdateAnchorsListener.bind(this)
			},
			{
				event: 'removeAnchors',
				handler: this.vkRemoveAnchorsListener.bind(this)
			}
		]
		listeners.forEach(item => vk.on(item.event, item.handler))
		return vk
	},

	vkAddAnchorsListener(anchors) {
		console.log('vkAddAnchorsListener anchors: ', anchors)
	},

	vkUpdateAnchorsListener(anchors) {
		console.log('vkUpdateAnchorsListener anchors: ', anchors)
	},

	vkRemoveAnchorsListener(anchors) {
		console.log('vkRemoveAnchorsListener anchors: ', anchors)
	},

	addMarker() {
		this.vk.addMarker()
	},

	async saveImageToLocalFile(imagePath) {
		if (!isDirectorySync(this.AR_IMAGES_DIR)) {
			await mkdir(this.AR_IMAGES_DIR, true)
		}
		const fileName = imagePath.split('/').pop()
		const destPath = [this.AR_IMAGES_DIR, fileName].join('/')
		if (isFileSync(destPath)) {
			return destPath
		}
		return saveFile(imagePath, destPath)
	},


	startAR() {
		this.vk && this.vk.start((...args) => {
			console.log('vk start args: ', args)
		})
	}
})
