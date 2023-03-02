import { prepareRunChecker } from '../../../../lib/shared/util.js'

const {shouldRun: scrollShouldRun } = prepareRunChecker({timerDelay: 200 })
const {shouldRun: clickSouldRUn } = prepareRunChecker({timerDelay: 400 })

export default class HandGestureController {

    #view
    #service
    #camera
    #lastDirection = {
        direction: '',
        y: 0
    }
    constructor({view, service, camera}) {
        this.#view = view
        this.#service = service
        this.#camera = camera
    }

    static async initialize( deps ) {
        const controller = new HandGestureController( deps )
        return await controller.init()
    }

    async init() {
        return await this.#loop()
    }

    #scrollPage(direction) {
        const pixelsPerScroll = 100

        if( this.#lastDirection.y < 0 ) {
            this.#lastDirection.y = 0
        }
        if( this.#lastDirection.direction === direction ) {
            this.#lastDirection.y = (
                direction === 'scroll-down' ? 
                this.#lastDirection.y + pixelsPerScroll : 
                this.#lastDirection.y - pixelsPerScroll
            )
        } else {
            this.#lastDirection.direction = direction
        }

        this.#view.scrollPage(this.#lastDirection.y)
    }

    async #estimateHands() {
        try {
            const hands = await this.#service.estimateHands(this.#camera.video)
            this.#view.clearCanvas()

            if( hands && hands.length) {
                this.#view.drawResults(hands)
            }

            for await( const {event, x, y} of this.#service.detectGestures(hands)) {
                if( event === 'click' ) {
                    if( !clickSouldRUn() ) {
                        continue
                    }
                    this.#view.clickOnElement(x, y)
                    continue
                }
                if( event.includes('scroll') ) {
                    if( !scrollShouldRun() ) {
                        continue
                    }
                    this.#scrollPage(event)
                }

            }
            
        } catch (error) {
            console.error('Deu ruim:', error)
            
        }
    }

    async #loop() {
        await this.#service.initializeDetector()
        await this.#estimateHands()
        this.#view.loop( this.#loop.bind(this) )

    }
}