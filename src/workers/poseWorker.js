import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

let detector = null;

const loadModel = async () => {
    await tf.setBackend('webgl');
    await tf.ready();
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
    };
    detector = await poseDetection.createDetector(model, detectorConfig);
    console.log("Model loaded successfully in worker");
    postMessage({ type: 'MODEL_LOADED' });
};

self.onmessage = async (event) => {
    const { type, imageData } = event.data;

    if (type === 'LOAD_MODEL') {
        try {
            await loadModel();
        } catch (error) {
            postMessage({ type: 'ERROR', error: error.message });
        }
    } else if (type === 'DETECT_POSE') {
        if (!detector) return;
        try {
            // imageData is an ImageData object or ImageBitmap
            const poses = await detector.estimatePoses(imageData, {
                flipHorizontal: false, // We handle flipping in CSS/Canvas usually
            });
            postMessage({ type: 'POSE_DETECTED', poses });
        } catch (error) {
            postMessage({ type: 'ERROR', error: error.message });
        }
    }
};
