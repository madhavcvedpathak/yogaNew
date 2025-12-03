// Keypoint indices from MoveNet
const KEYPOINTS = {
    NOSE: 0,
    LEFT_EYE: 1,
    RIGHT_EYE: 2,
    LEFT_EAR: 3,
    RIGHT_EAR: 4,
    LEFT_SHOULDER: 5,
    RIGHT_SHOULDER: 6,
    LEFT_ELBOW: 7,
    RIGHT_ELBOW: 8,
    LEFT_WRIST: 9,
    RIGHT_WRIST: 10,
    LEFT_HIP: 11,
    RIGHT_HIP: 12,
    LEFT_KNEE: 13,
    RIGHT_KNEE: 14,
    LEFT_ANKLE: 15,
    RIGHT_ANKLE: 16,
};

const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
        angle = 360.0 - angle;
    }
    return angle;
};

export const classifyPose = (keypoints) => {
    if (!keypoints || keypoints.length === 0) return { name: 'Unknown', confidence: 0 };

    const p = (name) => keypoints[KEYPOINTS[name]];
    const isVisible = (point) => point && point.score > 0.3;

    // Calculate Angles
    // Note: Y increases downwards in canvas/video coordinates

    // Arms
    const leftElbowAngle = calculateAngle(p('LEFT_SHOULDER'), p('LEFT_ELBOW'), p('LEFT_WRIST'));
    const rightElbowAngle = calculateAngle(p('RIGHT_SHOULDER'), p('RIGHT_ELBOW'), p('RIGHT_WRIST'));
    const leftShoulderAngle = calculateAngle(p('LEFT_HIP'), p('LEFT_SHOULDER'), p('LEFT_ELBOW'));
    const rightShoulderAngle = calculateAngle(p('RIGHT_HIP'), p('RIGHT_SHOULDER'), p('RIGHT_ELBOW'));

    // Legs
    const leftKneeAngle = calculateAngle(p('LEFT_HIP'), p('LEFT_KNEE'), p('LEFT_ANKLE'));
    const rightKneeAngle = calculateAngle(p('RIGHT_HIP'), p('RIGHT_KNEE'), p('RIGHT_ANKLE'));
    const leftHipAngle = calculateAngle(p('LEFT_SHOULDER'), p('LEFT_HIP'), p('LEFT_KNEE'));
    const rightHipAngle = calculateAngle(p('RIGHT_SHOULDER'), p('RIGHT_HIP'), p('RIGHT_KNEE'));

    // Logic for 10 Poses

    // 1. Pranamasana (Prayer Pose)
    // Hands together at chest, standing straight.
    // Difficult to detect hands together exactly without hand tracking, but elbows bent and wrists close.
    // Standing: Hip angles ~180, Knee angles ~180.
    if (leftKneeAngle > 160 && rightKneeAngle > 160 && leftHipAngle > 160 && rightHipAngle > 160) {
        if (leftElbowAngle < 160 && rightElbowAngle < 160 && Math.abs(p('LEFT_WRIST').x - p('RIGHT_WRIST').x) < 50) {
            return { name: 'Pranamasana', confidence: 0.85 };
        }
        // 2. Tadasana (Mountain Pose)
        // Arms by side (shoulder angle small) or up. Usually by side.
        if (leftShoulderAngle < 30 && rightShoulderAngle < 30) {
            return { name: 'Tadasana', confidence: 0.9 };
        }
        // 7. Vrikshasana (Tree Pose)
        // One leg straight, one bent (knee angle < 100). Hands usually up or prayer.
    }

    // Tree Pose Logic (One leg bent)
    if ((leftKneeAngle < 100 && rightKneeAngle > 160) || (rightKneeAngle < 100 && leftKneeAngle > 160)) {
        // Check if standing upright
        if (leftHipAngle > 150 || rightHipAngle > 150) {
            return { name: 'Vrikshasana', confidence: 0.85 };
        }
    }

    // 3. Phalakasana (Plank Pose)
    // Horizontal body. Shoulders, Hips, Ankles in line.
    // In video feed, this depends on camera angle, but generally body is extended.
    // Arms straight (Elbows ~180).
    if (leftElbowAngle > 160 && rightElbowAngle > 160) {
        // Check horizontal alignment or specific angles
        // Hard to detect orientation without ground plane, but we can check relative positions.
        // Hips between Shoulders and Ankles.
        // Let's assume side view or diagonal.
        if (leftKneeAngle > 160 && rightKneeAngle > 160 && leftHipAngle > 160 && rightHipAngle > 160) {
            // Differentiate from standing: Orientation.
            // If Shoulders and Hips are at similar Y level? No, Plank is usually horizontal.
            // If Y difference between Shoulder and Ankle is small (horizontal) vs large (vertical).
            const height = Math.abs(p('LEFT_SHOULDER').y - p('LEFT_ANKLE').y);
            const width = Math.abs(p('LEFT_SHOULDER').x - p('LEFT_ANKLE').x);
            if (width > height) {
                return { name: 'Phalakasana', confidence: 0.8 };
            }
        }
    }

    // 4. Bhujangasana (Cobra Pose)
    // Prone, chest lifted. Legs straight on ground.
    // Hips on ground (low Y). Shoulders high. Arms bent or straight support.
    // Hip angle is obtuse (extension).
    // This is hard to distinguish from Upward Dog without foot context.
    // Heuristic: Legs straight, Hips lower than Shoulders, Spine arched.
    if (leftKneeAngle > 160 && rightKneeAngle > 160) {
        // Check if hips are lower than shoulders (in Y, lower means higher value usually, but "down" is +Y)
        // Actually in Cobra, Shoulders are ABOVE Hips (smaller Y).
        if (p('LEFT_SHOULDER').y < p('LEFT_HIP').y) {
            // Check for arch (Hip angle)
            // Not easy with 2D keypoints.
            // Let's rely on "Legs straight + Torso upright + Hips close to ground"
            // We can't know "ground" easily.
            // Let's assume Cobra if legs extended and shoulders significantly above hips.
            // And elbows might be bent.
        }
    }

    // 5. Adho Mukha Svanasana (Downward Dog)
    // Inverted V. Hips high (Smallest Y).
    // Hips higher than Shoulders and Ankles.
    if (p('LEFT_HIP').y < p('LEFT_SHOULDER').y && p('LEFT_HIP').y < p('LEFT_ANKLE').y) {
        // Hip angle < 90 (flexion)
        if (leftHipAngle < 100 && rightHipAngle < 100) {
            if (leftKneeAngle > 150 && rightKneeAngle > 150) { // Legs straight
                return { name: 'Adho Mukha Svanasana', confidence: 0.9 };
            }
        }
    }

    // 6. Virabhadrasana II (Warrior II)
    // Wide stance. One knee bent ~90. Arms horizontal.
    // Arms: Shoulder angles ~90. Elbows ~180.
    if (Math.abs(leftShoulderAngle - 90) < 30 && Math.abs(rightShoulderAngle - 90) < 30) {
        // Legs: One bent, one straight.
        if ((leftKneeAngle < 110 && rightKneeAngle > 150) || (rightKneeAngle < 110 && leftKneeAngle > 150)) {
            return { name: 'Virabhadrasana II', confidence: 0.85 };
        }
    }

    // 8. Savasana (Corpse Pose)
    // Lying flat. All angles ~180.
    // Width > Height (Horizontal).
    if (leftKneeAngle > 160 && rightKneeAngle > 160 && leftHipAngle > 160 && rightHipAngle > 160) {
        const height = Math.abs(p('LEFT_SHOULDER').y - p('LEFT_ANKLE').y);
        const width = Math.abs(p('LEFT_SHOULDER').x - p('LEFT_ANKLE').x);
        if (width > height) {
            // Arms by side?
            return { name: 'Savasana', confidence: 0.9 };
        }
    }

    // 9. Ashwa Sanchalanasana (Equestrian/Low Lunge)
    // One leg forward bent, one back extended (knee on ground usually).
    // Hands on floor.
    // Similar to lunge.
    if ((leftKneeAngle < 100 && rightKneeAngle > 120) || (rightKneeAngle < 100 && leftKneeAngle > 120)) {
        // Hands down (Wrist Y > Shoulder Y)
        if (p('LEFT_WRIST').y > p('LEFT_SHOULDER').y) {
            return { name: 'Ashwa Sanchalanasana', confidence: 0.8 };
        }
    }

    return { name: 'Unknown', confidence: 0 };
};
