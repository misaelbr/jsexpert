export default class HandGestureService{
    #gestureEstimator
    #handPoseDetection
    #handsVersion
    #detector = null
    #gestureStrings
    constructor({
        fingerPose, handPoseDetection, handsVersion, gestureStrings, knownGestures
    }) {
        this.#gestureEstimator = new fingerPose.GestureEstimator(knownGestures)
        this.#handPoseDetection = handPoseDetection
        this.#handsVersion = handsVersion
        this.#gestureStrings = gestureStrings

    }

    async initializeDetector() {
        if (this.#detector) {
            return this.#detector
        }
        const model  = this.#handPoseDetection.SupportedModels.MediaPipeHands

        const detectorConfig = {
            runtime: 'mediapipe',
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${this.#handsVersion}`,
            modelType: 'lite',
            maxHands: 2,
        }
        this.#detector = await this.#handPoseDetection.createDetector(model, detectorConfig)

        return this.#detector
    }

    async estimate(keypoints3D) {
        const predictions = await this.#gestureEstimator.estimate(
            this.#getLandMarksFromKeypoints(keypoints3D),
            9
        )

        return predictions.gestures
    }
// keypoints3D

    async * detectGestures( predictions ) {
        for( const hand of predictions ) {
            if( !hand.keypoints3D ) {
                continue 
            }
            const gestures = await this.estimate( hand.keypoints3D )
            if(!gestures.length) {
                continue
            }

            const result = gestures.reduce( (previous, next) => (previous.score > next.score) ? previous : next )
            const {x,y} = hand.keypoints.find( keypoint => keypoint.name === 'index_finger_tip' ) 
            yield { event: result.name, x, y}
            console.log('detected: ', this.#gestureStrings[result.name] )
        }
    }

    #getLandMarksFromKeypoints( keypoints3D ) {
        return keypoints3D.map( keypoint => 
           [keypoint.x, keypoint.y, keypoint.z]
        )
    }

    async estimateHands(video) {
        return await this.#detector.estimateHands(video, {
            flipHorizontal: true,
        })
    }

}