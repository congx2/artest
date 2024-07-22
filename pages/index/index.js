import { getVKSupportVersion, usePromise } from '../../utils/utils'
import {  chooseImages, isDirectorySync, isFileSync, saveFile, mkdir } from './fs'
import threeBehavior from './behavior-three'

Page({
	behaviors: [threeBehavior],
	data: {
		images: [],
		markers: []
	},

	onLoad() {
		// this.AR_IMAGES_DIR = `${wx.env.USER_DATA_PATH}/ar-assets/images`
		this.AR_IMAGES_DIR = `${wx.env.USER_DATA_PATH}`
		this.FPS = 30
		this.NEAR = 0.01
		this.FAR = 1000
		this.canvas = {
			width: 0,
			height: 0
		}
	},

	onReady() {
		this.init()
	},

	getCanvasNode(selector) {
		const [promise, resolve, reject] = usePromise()
		const cb = result => {
			const rect = Array.isArray(result) ? result[0] : null
			const { node } = rect || {}
			return node ? resolve(node) : reject(new Error(`Node<${selector}> not found.`))
		}
		this.createSelectorQuery().select(selector).node().exec(cb)
		return promise
	},

	getCanvasSize() {
		const systemInfo = wx.getSystemInfoSync()
		const { pixelRatio, windowWidth, windowHeight } = systemInfo || {}
		const width = windowWidth * pixelRatio
		const height = windowHeight * pixelRatio
		return { width, height }
	},

	async init() {
		const canvas = await this.getCanvasNode('#canvas')
		const size = this.getCanvasSize()
		canvas.width = size.width
		canvas.height = size.height
		this.canvas = canvas
		this.vk = this.createVK()
		this.initTHREE()

      // 初始化 GL，基于 Three.js 的 Context，用于相机YUV渲染
    this.initYUV()

      // 初始化VK
      // start完毕后，进行更新渲染循环
    // this.initVK();
	},

	loop() {
		let fpsInterval = 1000 / this.FPS
		let last = Date.now()

		const vk = this.vk;

		// 逐帧渲染
		const renderFrame = timestamp => {
				try {
						let now = Date.now()
						const mill = now - last
						// 经过了足够的时间
						if (mill >= fpsInterval) {
								last = now - (mill % fpsInterval); //校正当前时间
								this.renderCameraView();
						}
				} catch(e) {
						console.error(e);
				}
				vk.requestAnimationFrame(renderFrame)
		}
		vk.requestAnimationFrame(renderFrame)
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
		this.setData({ images: images.slice(0, 4), markers })
		console.log('images: ', this.data.images)
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

	addMarker(path) {
		this.vk.addMarker(path)
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

	createVK() {
		const vkSupportVersion = getVKSupportVersion()
		const vkOptions = {
			track: {
				plane: {
					mode: 3
				},
				marker: true,
			},
			version: 'v1',
		}
		return wx.createVKSession(vkOptions)
	},

	setVKListeners(vk) {
		vk.on('addAnchors', this.vkAddAnchorsListener.bind(this))
		// vk.on('updateAnchors', this.vkUpdateAnchorsListener.bind(this))
		// vk.on('removeAnchors', this.vkRemoveAnchorsListener.bind(this))
	},


	startAR() {
		this.vk.start(e => {
			console.log('vk start e: ', e)
			if (e) {
				throw e
			}
			if (this.data.markers) {
				while(this.data.markers.length) {
					this.addMarker(this.data.markers.shift())
				}
			}
			this.setVKListeners(this.vk)
			this.loop()
		})
	},

	toARPage() {
		wx.navigateTo({
			url: '/pages/ar/2dmarker-ar/2dmarker-ar'
		})
	},

	renderCameraView() {
		// console.log('loop')

      // 获取 VKFrame
      const frame = this.vk.getVKFrame(this.canvas.width, this.canvas.height)

      // 成功获取 VKFrame 才进行
      if(!frame) { return; }

      // 更新相机 YUV 数据
      this.renderYUV(frame)

      // 获取 VKCamera
      const VKCamera = frame.camera

      // 相机
      if (VKCamera) {
        // 接管 ThreeJs 相机矩阵更新，Marker模式下，主要由视图和投影矩阵改变渲染效果
        this.camera.matrixAutoUpdate = false

        // 视图矩阵
        this.camera.matrixWorldInverse.fromArray(VKCamera.viewMatrix);
        this.camera.matrixWorld.getInverse(this.camera.matrixWorldInverse);

        // 投影矩阵
        const projectionMatrix = VKCamera.getProjectionMatrix(this.NEAR, this.FAR)
        this.camera.projectionMatrix.fromArray(projectionMatrix)
        this.camera.projectionMatrixInverse.getInverse(this.camera.projectionMatrix)
      }

      // 绘制而为提示框的逻辑
      // if (this.hintInfo) {
      //   // 存在提示信息，则更新
      //   const THREE = this.THREE;

      //   // 原点偏移矩阵，VK情况下，marker 点对应就是 0 0 0，世界矩阵可以认为是一个单位矩阵
      //   // marker 右侧点可以理解是 0.5 0 0
      //   const center = new THREE.Vector3();
      //   const right = new THREE.Vector3(0.5, 0, 0);

      //   // 获取设备空间坐标
      //   const devicePos = center.clone().project(this.camera);

      //   // 转换坐标系，从 (-1, 1) 转到 (0, 100)，同时移到左上角 0 0，右下角 1 1
      //   const screenPos = new THREE.Vector3(0, 0, 0);
      //   screenPos.x = devicePos.x * 50 + 50;
      //   screenPos.y = 50 - devicePos.y * 50;

      //   // 获取右侧点信息
      //   const deviceRightPos = right.clone().project(this.camera);
      //   const screenRightPos = new THREE.Vector3(0, 0, 0);
      //   screenRightPos.x = deviceRightPos.x * 50 + 50;

      //   const markerHalfWidth = screenRightPos.x - screenPos.x;
        
      //   this.setData({
      //     hintBoxList: [
      //       {
      //         markerId: this.hintInfo.markerId,
      //         left: screenPos.x - markerHalfWidth,
      //         top: screenPos.y - markerHalfWidth,
      //         width: markerHalfWidth * this.data.domWidth * 2 / 100,
      //         height: markerHalfWidth * this.data.domWidth * 2 / 100,
      //       }
      //     ]
      //   });
      // }

      this.renderer.autoClearColor = false
      this.renderer.state.setCullFace(this.THREE.CullFaceBack)
      this.renderer.render(this.scene, this.camera)
      this.renderer.state.setCullFace(this.THREE.CullFaceNone)
	}
})
