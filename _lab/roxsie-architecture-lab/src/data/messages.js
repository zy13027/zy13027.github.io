/**
 * ROS 2 message size estimates.
 *
 * IMPORTANT: these are DERIVED, not published by Siemens. ROXSIE flattens every
 * message to a fixed-size struct under three documented rules:
 *
 *   string          -> a fixed 254-byte array
 *   sequence<T>     -> exactly 64 elements
 *   std_msgs/Header -> builtin_interfaces/Time (int32 sec + uint32 nanosec = 8)
 *                      plus string frame_id (254) = 262
 *
 * The RIB formula then rounds the field sum up to the next multiple of 8. Padding
 * the generator may insert per field is NOT modelled, so treat every figure here
 * as a close estimate and check it against the generated SCL before committing to
 * a machine design.
 *
 * Allowed scalar widths (RIB appendix A.3): int8/16/32/64 and unsigned at
 * 1/2/4/8 bytes, float 4, double 8, bool 1.
 */

export const STRING_BYTES = 254;
export const SEQUENCE_LEN = 64;
export const TIME_BYTES = 8;
export const HEADER_BYTES = TIME_BYTES + STRING_BYTES; // 262

const f32 = 4;
const f64 = 8;
const vector3 = 3 * f64; // 24
const quaternion = 4 * f64; // 32
const covariance9 = 9 * f64; // 72
const covariance36 = 36 * f64; // 288
const pose = vector3 + quaternion; // 56
const twist = vector3 + vector3; // 48

export const MESSAGES = [
  { type: 'std_msgs/msg/Bool', bytes: 1, shape: 'bool' },
  { type: 'std_msgs/msg/Float64', bytes: f64, shape: 'float64' },
  { type: 'geometry_msgs/msg/Vector3', bytes: vector3, shape: '3 × float64' },
  { type: 'geometry_msgs/msg/Twist', bytes: twist, shape: '2 × Vector3' },
  { type: 'geometry_msgs/msg/Pose', bytes: pose, shape: 'Point + Quaternion' },
  {
    type: 'geometry_msgs/msg/PoseStamped',
    bytes: HEADER_BYTES + pose,
    shape: 'Header + Pose',
  },
  {
    type: 'sensor_msgs/msg/Imu',
    bytes: HEADER_BYTES + quaternion + covariance9 + vector3 + covariance9 + vector3 + covariance9,
    shape: 'Header + orientation, rates, accel + 3 covariances',
  },
  {
    type: 'sensor_msgs/msg/LaserScan',
    bytes: HEADER_BYTES + 7 * f32 + SEQUENCE_LEN * f32 + SEQUENCE_LEN * f32,
    shape: 'Header + 7 × float32 + 2 sequences (64)',
  },
  {
    type: 'nav_msgs/msg/Odometry',
    bytes: HEADER_BYTES + STRING_BYTES + pose + covariance36 + twist + covariance36,
    shape: 'Header + child_frame_id + pose & twist with covariance',
  },
  {
    type: 'sensor_msgs/msg/BatteryState',
    bytes:
      HEADER_BYTES + 7 * f32 + SEQUENCE_LEN * f32 + SEQUENCE_LEN * f32 + 3 + 1 + 2 * STRING_BYTES,
    shape: 'Header + 7 × float32 + 2 sequences + 2 strings',
  },
  {
    type: 'trajectory_msgs/msg/JointTrajectoryPoint',
    bytes: 4 * SEQUENCE_LEN * f64 + TIME_BYTES,
    shape: '4 × float64 sequence (64) + Duration',
  },
  {
    type: 'sensor_msgs/msg/JointState',
    bytes: HEADER_BYTES + SEQUENCE_LEN * STRING_BYTES + 3 * SEQUENCE_LEN * f64,
    shape: 'Header + string[64] names + 3 × float64 sequence',
  },
];

const byType = new Map(MESSAGES.map((m) => [m.type, m]));

export const messageBytes = (type) => byType.get(type)?.bytes ?? 8;
export const messageShape = (type) => byType.get(type)?.shape ?? '';

/** Short label for tables: geometry_msgs/msg/Twist -> geometry_msgs/Twist. */
export const shortType = (type) => type.replace('/msg/', '/');

/** A flat scalar message is the only kind safe above 100 Hz. */
export const isComplex = (type) => messageBytes(type) > 64;

/** A string array is the one realistic way to approach the 8 MB window. */
export const isWide = (type) => messageBytes(type) > 4000;
