export default class Controller {
    #view
    #camera
    #worker
    #blinkCounter = 0
    constructor( {view, worker, camera} ) {
        this.#view = view
        this.#camera = camera
        this.#worker = this.#configureWorker(worker)

        this.#view.configureOnBtnClick(this.onBtnStart.bind(this))

    }

    static async initialize(deps) {
        const controller = new Controller( deps )
        controller.log('not yet detected eye blink! click on the button to start!')
        return controller.init()
    }

    async init() {
        console.log('Controller initialized')
    }

    #configureWorker( worker ) {
        let ready = false
        worker.onmessage = ({data}) => {
            console.log('Message received from worker', data)
            if(data === 'READY') {
                this.log('worker ready!')
                console.log('worker ready!')
                this.#view.enableButton()
                ready = true
                return;
            }

            const blinked = data.blinked
            this.#blinkCounter += blinked
            this.#view.togglePlayVideo()
            console.log('blinked', blinked)
        }

        return {
            send( msg ) {
                if(!ready) {
                    return;
                }
                worker.postMessage(msg)
            }
        }
    }

    loop() {
        const video = this.#camera.video
        const img = this.#view.getVideoFrame(video)
        this.#worker.send(img)
        this.log(`eye blink detected`)

        setTimeout(() => this.loop(), 100)
    }

    log( text ) {
        const times = `              - blinked times: ${this.#blinkCounter}`
        this.#view.log(`status: ${text}`.concat(this.#blinkCounter > 0 ? times :''))
    }

    onBtnStart() {
        this.log('initializing detection...')
        this.#blinkCounter = 0
        this.loop()
    }    
}