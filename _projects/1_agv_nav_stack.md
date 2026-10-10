---
layout: page
title: Differential-drive AGV navigation stack
description: A benchmarked differential-drive simulation with EKF localisation and Nav2. Reproducibility and public release checks in progress.
img: assets/img/projects/agv-stack.png # raster fallback / social preview
diagram: assets/img/projects/agv-stack.svg # served directly: a vector stays sharp at any width
diagram_alt: "Architecture of the AGV navigation stack: simulated wheel encoders, IMU and 2D LiDAR feed an EKF and SLAM/AMCL, which publish the TF tree into global and local costmaps; nav2's planner, controller and behaviour servers produce cmd_vel, which ros2_control's diff_drive_controller turns into wheel velocities through a hardware interface to the motors, with joint states fed back to odometry."
importance: 1
category: robotics
featured: true
status: Simulation benchmarked · release checks in progress
org: Personal project
period: 2026
stack_line: ROS 2 Jazzy · Nav2 · robot_localization (EKF) · ros2_control · Gazebo Harmonic
demonstrates:
  - "<strong>State estimation</strong> — EKF fusion of wheel odometry and IMU, and what actually degrades it: wheel slip, unmodelled latency, covariance that is guessed rather than measured."
  - "<strong>Planning and control</strong> — global planner and local controller behaviour on a non-holonomic base, and the recovery behaviours that decide whether a robot is usable or merely demonstrable."
  - "<strong><code>ros2_control</code> integration</strong> — the same hardware-interface problem as an industrial servo axis, expressed in ROS vocabulary."
  - "<strong>Reproducibility</strong> — PowerShell/WSL entry points prepared; clean-clone verification remains pending."
---

**Stack:** ROS 2 Jazzy · Nav2 · robot_localization (EKF) · ros2_control · Gazebo Harmonic

**Status, 10 October 2026:** simulation benchmarks completed; clean-clone
verification and public repository release remain pending. November 2026 remains
the publication target.

An autonomy stack on a simulated differential-drive base: URDF and a
`ros2_control` simulated joint interface, wheel-odometry and IMU fusion through
an EKF, saved-map AMCL localisation, and NavFn / Regulated Pure Pursuit navigation.

**Recorded simulation results**

- 30/30 nominal navigation goals completed across three routes and ten seeds,
  with zero obstacle contacts.
- 50 completed fault cases met the plan's stopping and bounded-termination
  criteria. The original strict suite remains failed at 78/80 passes; one
  preflight failure and one contact-free obstacle progress abort are retained.
  The obstacle scenario reached its goal in 4/5 trials.
- The benchmark's worst nominal final-position error was 0.1458 m against a
  0.15 m target, leaving limited margin. Results apply to the tested world,
  starts and synthetic settings; they are not physical-robot validation.

The current work is clean-clone verification, release metadata and repository
publication. GUI/GPU operation remains unverified.

**What it demonstrates**

- **State estimation** — EKF fusion of wheel odometry and IMU, and what actually
  degrades it: wheel slip, unmodelled latency, covariance that is guessed rather than measured
- **Planning and control** — global planner and local controller behaviour on a
  non-holonomic base, and the recovery behaviours that decide whether a robot is
  usable or merely demonstrable
- **`ros2_control` integration** — the same hardware-interface problem as an
  industrial servo axis, expressed in ROS vocabulary
- **Reproducibility** — PowerShell/WSL entry points prepared; clean-clone verification remains pending

**Why this project**

My strongest robotics work dates from 2022. Rather than claim currency, I am
rebuilding it with the current toolchain. The simulation now has retained
benchmark results; clean-clone verification and repository publication are the
remaining release steps.

The repository link will be added after public release.
