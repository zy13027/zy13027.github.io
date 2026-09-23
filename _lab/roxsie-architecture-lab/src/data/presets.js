/**
 * A plausible AMR interface: velocity command in, odometry / IMU / joint state out,
 * trajectory point in. Deliberately includes JointState, whose string[64] of joint
 * names is the single clearest demonstration of how the fixed-size mapping bites.
 */
export const AMR_PRESET = [
  { direction: 'r2p', type: 'geometry_msgs/msg/Twist', rate: 100 },
  { direction: 'p2r', type: 'nav_msgs/msg/Odometry', rate: 50 },
  { direction: 'p2r', type: 'sensor_msgs/msg/Imu', rate: 200 },
  { direction: 'p2r', type: 'sensor_msgs/msg/JointState', rate: 100 },
  { direction: 'r2p', type: 'trajectory_msgs/msg/JointTrajectoryPoint', rate: 50 },
];

export const DIRECTION_LABEL = {
  r2p: { short: 'R→P', yaml: 'ros2_to_plc', long: 'ROS 2 → PLC' },
  p2r: { short: 'P→R', yaml: 'plc_to_ros2', long: 'PLC → ROS 2' },
};
