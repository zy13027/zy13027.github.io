---
layout: page
title: Differential-drive AGV navigation stack
description: EKF localisation and nav2 autonomy on a differential-drive platform. ROS 2 Jazzy, in progress.
# img: assets/img/projects/agv.jpg
# ^ uncomment once you have added the image at that path.
#   A missing img file makes the al-folio build fail, so it stays off by default.
importance: 1
category: robotics
---

**Stack:** ROS 2 Jazzy · nav2 · robot_localization (EKF) · ros2_control · Gazebo / MuJoCo

**Status: in progress — target November 2026.** &lt;Update this line as it moves;
a dated in-progress project is more persuasive than a vague finished one.&gt;

A complete autonomy stack on a differential-drive base, built end to end rather
than assembled from a tutorial: URDF and `ros2_control` hardware interface,
wheel-odometry and IMU fusion through an EKF, costmap configuration, and nav2
planner and controller tuning.

**What it demonstrates**

- **State estimation** — EKF fusion of wheel odometry and IMU, and what actually
  degrades it: wheel slip, unmodelled latency, covariance that is guessed rather than measured
- **Planning and control** — global planner and local controller behaviour on a
  non-holonomic base, and the recovery behaviours that decide whether a robot is
  usable or merely demonstrable
- **`ros2_control` integration** — the same hardware-interface problem as an
  industrial servo axis, expressed in ROS vocabulary
- **Reproducibility** — one command to bring the simulation up; anyone can run it

**Why this project**

My strongest robotics work dates from 2022. Rather than claim currency, I am
rebuilding it in public with the current toolchain. The repository history is the
evidence.

&lt;Link the repo here once it is public.&gt;
