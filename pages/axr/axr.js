
Page({
    data: {
        width: 0,
        height: 0,
        renderWidth: 0,
        renderHeight: 0,
        // marker: './gongpai2.jpg',
        marker: 'https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/marker/2dmarker-test.jpg',
        gltf: 'https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/butterfly/index.glb'
    },

    async onReady() {
        const { windowWidth, windowHeight, pixelRatio } = this.getSystemInfoSync()
        const width = Math.floor(windowWidth)
        const height = Math.floor(windowHeight)
        const renderWidth = Math.floor(windowWidth * pixelRatio)
        const renderHeight = Math.floor(windowHeight * pixelRatio)
        this.setData({ width, height, renderWidth, renderHeight })
    },

    getSystemInfoSync() {
        let info = null
        try {
            info = wx.getSystemInfoSync()
            if (!info) {
                info = wx.getSystemInfoSync()
            }
        } catch (error) {
            info = wx.getSystemInfoSync()
        }
        return info || {}
    }
})
