import { uuid } from '../../utils/utils'

Component({
    properties: {
        marker: {
            type: String,
            value: ''
        },
        gltf: {
            type: String,
            value: ''
        }
    },

    data: {
        isARReady: false,
        isAssetsLoaded: false,
    },

    lifetimes: {
        attached() {
            this.AR_TRACKER_STATE = {
                INIT: 0,
                DETECTING: 1,
                DETECTED: 2,
                ERROR: 3
            }
            this.scene = null
        },

        ready() {

        },

        detached() {
            this.scene = null
        }
    },

    methods: {
        onSceneReady(event) {
            console.log('onSceneReady event: ', event)
            this.scene = event.detail.value
        },

        async onARReady(event) {
            console.log('onARReady event: ', event)
            this.setData({ isARReady: true })
            const { marker: markerSrc, gltf: gltfSrc } = this.properties
            const scene = this.scene
            const xr = wx.getXrFrameSystem()
            this.markerElement = this.createMarkerElement(scene, markerSrc)
            this.displayModelElement = await this.createDislpayModelElement(scene, gltfSrc)
            this.root = scene.getElementById('root')
            this.root.addChild(this.markerElement)
            this.root.addChild(this.displayModelElement)
            this.markerElement.event.add('ar-tracker-state', tracker => {
                console.group()
                const { state } = tracker
                console.log('event cb ar-tracker-state tracker: ', tracker)
                console.log('event cb ar-tracker-state tracker.state: ', state)
                if (state !== this.AR_TRACKER_STATE.DETECTED || this.waiting) {
                    console.groupEnd()
                    return
                }
                this.waiting = true
                console.log('ar-tracker-state state: ', state)
                console.log('event cb ar-tracker-state tracker === this.markerElement: ', tracker === this.markerElement)
                
                // 延时保证坐标已经设置
                setTimeout(() => {
                    // 将 lockTrackerEl 的世界矩阵信息同步到 lockItemEle
                    const markerTransform = this.markerElement.getComponent(xr.Transform)
                    const displayModelTransform = this.displayModelElement.getComponent(xr.Transform)
                    displayModelTransform.setLocalMatrix(markerTransform.worldMatrix)
                    
                    // 去除tracker监听
                    this.root.removeChild(this.markerElement)
                }, 30)
                console.groupEnd()
            })
        },

        onAssetsProgress(event) {
            console.log('onAssetsProgress event: ', event)
        },

        onAssetsLoaded(event) {
            console.log('onAssetsLoaded event: ', event)
            this.setData({ isAssetsLoaded: true })
        },

        createMarkerElement(scene, marker) {
            const xr = wx.getXrFrameSystem()
            // 动态创建添加tracker
            const element = scene.createElement(xr.XRNode)
            // marker: https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/marker/2dmarker-test.jpg
            const mode = 'Marker'
            element.addComponent(xr.ARTracker, { mode, src: marker })
            return element
        },

        async createDislpayModelElement(scene, glb) {
            const xr = wx.getXrFrameSystem()
            
            // 加载 gltf 模型
            const asset = await scene.assets.loadAsset(this.genGltfAssetConfig(glb))

            // 添加蝴蝶
            const gltf = scene.createElement(xr.XRGLTF, {
                // position: '0.2 0 -0.2',
                position: '0.1 0 0',
                scale: '0.6 0.6 0.6',
                rotation: '0 -50 0',
                'anim-autoplay': '',
            })
            gltf.getComponent(xr.GLTF).setData({ model: asset.value })

            // 动态改动模型根节点
            const nodeOptions = {
                position: '2000 0 0'
            }
            const element = scene.createElement(xr.XRNode, nodeOptions)
            element.addChild(gltf)

            // 先挂到场上，但是可以放在离屏
            return element
        },

        genAssetId() {
            return `A${uuid(15)}`
        },

        genAssetConfig(type, src) {
            const assetId = this.genAssetId()
            return { assetId, type, src }
        },

        genGltfAssetConfig(src) {
            const type = 'gltf'
            return this.genAssetConfig(type, src)
        },


    }
})
