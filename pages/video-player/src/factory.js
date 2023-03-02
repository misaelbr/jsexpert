import Camera from '../../../lib/shared/camera.js'
import { supportsWorkerType } from '../../../lib/shared/util.js';
import Controller from './controller.js'
import Service from './service.js'
import View from './view.js'

async function getWorker() {

  if( supportsWorkerType ) {
    console.log('Web Workers are supported')
    const worker = new Worker('./src/worker.js', { type: 'module' })
    return worker
  }

  console.warn('Web Workers are not supported')

  console.log('Import libraries')
  
  await import("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js")
  await import("https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js")
  await import("https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js")
  await import("https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js")
  
  console.warn('Using a mock worker')

  const service = new Service({
    faceLandmarksDetection: window.faceLandmarksDetection
  })
  const workerMock = {
    async postMessage( video ) {
      const blinked = await service.handBlinked(video)
      if(!blinked) {
        return;
      }
      worker.onmessage({data: { blinked }})
    }, 
    onmessage(msg) {}

  }

  console.log('loading tf model...')
  await service.loadModel()
  console.log('tf model loaded!')
  setTimeout(()  => {
    worker.onmessage({data: 'READY'})
  }, 500)

  return workerMock
  
}

const worker = await getWorker()
worker.postMessage('Hello from main thread')

const camera = await Camera.init()

const [rootPath] = window.location.href.split('/pages/')


const factory = {
  async initialize() {
    console.log('Initialize callled in factory')
    return Controller.initialize({
      view: new View(),
      worker,
      camera
    })
  }
}

export default factory