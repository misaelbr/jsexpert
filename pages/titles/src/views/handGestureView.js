export default class HandGestureView {
    #handsCanvas = document.querySelector('#hands')
    #canvasContext = this.#handsCanvas.getContext('2d')
    #fingerLookupIndices
    #styler
    
    constructor({fingerLookupIndices, styler}) {
        this.#handsCanvas.width = globalThis.screen.availWidth
        this.#handsCanvas.height = globalThis.screen.availHeight
        this.#fingerLookupIndices = fingerLookupIndices
        this.#styler = styler

        setTimeout(()=> this.#styler.loadDocumentStyles(), 200)
    }

    clearCanvas() {
        this.#canvasContext.clearRect(0, 0, this.#handsCanvas.width, this.#handsCanvas.height)
    }

    clickOnElement(x, y) {
        const element = document.elementFromPoint(x, y)
        if(!element) {
            return
        }

        const rect = element.getBoundingClientRect()
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: rect.left + x,
            clientY: rect.top + y
        })

        element.dispatchEvent(event)
    }

    drawResults( hands ) {

        for( const {keypoints, handedness } of hands ) {
            if(!keypoints)
                continue
            this.#canvasContext.fillStyle = handedness === 'Left' ? 'red' : 'blue'
            this.#canvasContext.strokeStyle = 'white'
            this.#canvasContext.lineWidth = 8
            this.#canvasContext.lineJoin = 'round'

            this.#drawJoients( keypoints )
            this.#drawFingersAndHoverElements(keypoints)
            
        }
    }

    #drawJoients( keypoints ) {

        for( const {x, y} of keypoints ) {
            this.#canvasContext.beginPath()
            this.#canvasContext.arc(x, y, 10, 0, 2 * Math.PI)
            this.#canvasContext.fill()
            const newX = x - 2
            const newY = y - 2
    
            const radius = 3
            const startAngle = 0
            const endAngle = 2 * Math.PI

            this.#canvasContext.arc(newX, newY, radius, startAngle, endAngle)
            this.#canvasContext.fill()
        }

    }

    #drawFingersAndHoverElements(keypoints) {
        const fingers = Object.keys(this.#fingerLookupIndices)
        for( const finger of fingers ) {
            const points = this.#fingerLookupIndices[finger].map( index =>
                keypoints[index]
            )
            const region = new Path2D() 
            const [{x, y}] = points
            region.moveTo(x, y)

            for( const {x, y} of points ) {
                region.lineTo(x, y)
            }

            this.#canvasContext.stroke(region)
            this.#hoverElements(finger, points)
        }

    }

    #hoverElements(finger, points) {
        if( finger!== 'indexFinger' ) {
            return
        }

        const {x, y} = points.find( item => item.name === 'index_finger_tip')
        const element = document.elementFromPoint(x, y)
        if(!element) {
            return
        }

        const fn = () => this.#styler.toggleStyle(element, ':hover')
        fn()
        setTimeout(()=> fn(), 500)
    }

    loop( fn ) {
        requestAnimationFrame( fn )
    }

    scrollPage(top) {
        scroll({
            top,
            behavior: 'smooth'
        })
    }
 }