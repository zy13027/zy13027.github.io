---
layout: page
title: Quadruped robot navigation
description: EKF state estimation, A* planning and LiDAR processing for a legged platform at Geely Research Institute.
# img: assets/img/projects/quadruped.jpg
# ^ uncomment once you have added the image at that path.
#   A missing img file makes the al-folio build fail, so it stays off by default.
importance: 2
category: robotics
---

**Stack:** ROS · EKF · A\* · LiDAR · C++ / Python
**Where:** Geely Research Institute, 2022

Navigation for a quadruped platform. Legged locomotion breaks assumptions that
wheeled navigation takes for granted — the body pitches and rolls with every
step, odometry is derived from leg kinematics rather than wheel encoders, and
LiDAR returns arrive from a sensor that is never level.

**What I worked on**

- **State estimation** — EKF fusing leg odometry with IMU, on a base whose motion
  is periodic and whose odometry drifts differently from a wheeled robot's
- **Path planning** — A\* over a costmap, with traversability meaning something
  different for a machine that can step over an obstacle a wheeled robot must go around
- **Perception** — LiDAR processing and ground segmentation from a continuously
  tilting sensor frame
- **Integration** — ROS nodes, message design, and the timing behaviour that
  determines whether the stack works on hardware or only in simulation

&lt;Add: what the platform was, what the navigation had to achieve, and a
measurable outcome — success rate, localisation error, distance covered
autonomously. If a demo video exists and is not proprietary, link it; this is the
single most convincing asset you have for a robotics application.&gt;

---

*No proprietary Geely material is reproduced here.*
