---
layout: page
title: Differential-drive AGV navigation stack
description: A public differential-drive simulation with EKF localisation and Nav2. Clean-clone verified; versioned release and public demonstration pending.
img: assets/img/projects/agv-stack.png # raster fallback / social preview
diagram: assets/img/projects/agv-stack.svg # served directly: a vector stays sharp at any width
diagram_alt: "Gazebo Harmonic simulation architecture: wheel feedback and IMU feed the planar EKF; LiDAR supports SLAM Toolbox mapping or saved-map AMCL localisation and costmaps. Nav2 commands pass through Collision Monitor and the health supervisor as TwistStamped messages before reaching diff_drive_controller and the gz_ros2_control simulated joint interface; wheel-joint feedback closes the loop."
importance: 1
category: robotics
featured: true
status: Public source · clean-clone verified
org: Personal project
period: 2026
stack_line: ROS 2 Jazzy · Nav2 · robot_localization (EKF) · ros2_control · Gazebo Harmonic
demonstrates:
  - "<strong>State estimation</strong> — EKF fusion of wheel odometry and IMU, and what actually degrades it: wheel slip, unmodelled latency, covariance that is guessed rather than measured."
  - "<strong>Planning and control</strong> — global planner and local controller behaviour on a non-holonomic base, and the recovery behaviours that decide whether a robot is usable or merely demonstrable."
  - "<strong><code>ros2_control</code> integration</strong> — a simulated joint interface through <code>gz_ros2_control</code>, with stamped commands checked by Collision Monitor and health supervision."
  - "<strong>Reproducibility</strong> — clean-clone verification passed on 13 October 2026: three packages built, seven tests passed and a contact-free clear route."
---

**Stack:** ROS 2 Jazzy · Nav2 · robot_localization (EKF) · ros2_control · Gazebo Harmonic

**Status, 13 October 2026:** public source and clean-clone verification confirmed.
The [repository](https://github.com/zy13027/agv-ros2-sim) is available; no versioned
GitHub release or tag has been published. Public demonstration and artefact
publishing remain pending.

An autonomy stack on a simulated differential-drive base: URDF and a
`gz_ros2_control` simulated joint interface, wheel-odometry and IMU fusion through
a planar EKF, SLAM Toolbox mapping, saved-map AMCL localisation, and NavFn /
Regulated Pure Pursuit navigation. Stamped commands follow Nav2 → Collision
Monitor → health supervisor → diff-drive controller.

**Recorded simulation results**

- 30/30 nominal navigation goals completed across three routes and ten seeds,
  with zero obstacle contacts.
- 50 completed fault cases met the plan's stopping and bounded-termination
  criteria. The original strict suite remains failed at 78/80 passes; one
  preflight failure and one contact-free obstacle progress abort are retained.
  An additional unchanged-source attempt completed the seed whose first startup
  failed before movement, bringing the assessment to 81 total attempts.
  Scripted obstacle goals succeeded in 4/5 trials; the remaining trial stopped
  without contact and ended in a bounded progress abort.
- The benchmark's worst nominal final-position error was 0.1458 m against a
  0.15 m target, leaving limited margin. Results apply to the tested world,
  starts and synthetic settings; they are not physical-robot validation.

**Clean-clone verification, 13 October 2026**

At source commit `303099d6242642d8bec8a5662878fe66228c5daf`, three packages built
and seven tests passed. Clear-route navigation succeeded with zero contacts and
recoveries; final error was 0.0819 m / 0.0495 rad. The tested platform was an
Ubuntu 24.04 container on WSL2, with software rendering and runtime networking
disabled. This was one clear-route check; the full benchmark evidence is separate.

GUI/GPU operation and native Ubuntu installation remain unverified. All results
concern simulation. The 150-second local demonstration is measured-data replay,
not a Gazebo GUI recording, and has no verified public URL. Public JSON summaries
are available; raw bags and workstation logs remain local.

**Public source and evidence**

- [Repository](https://github.com/zy13027/agv-ros2-sim)
- [README](https://github.com/zy13027/agv-ros2-sim/blob/279001ce614edd7995780fdfc1466d104b721b2b/README.md)
- [Benchmark summary](https://github.com/zy13027/agv-ros2-sim/blob/279001ce614edd7995780fdfc1466d104b721b2b/reports/benchmark_summary.json)
- [Reproducibility summary](https://github.com/zy13027/agv-ros2-sim/blob/279001ce614edd7995780fdfc1466d104b721b2b/reports/reproducibility_summary.json)
- [Apache-2.0 licence](https://github.com/zy13027/agv-ros2-sim/blob/279001ce614edd7995780fdfc1466d104b721b2b/LICENSE)

Evidence links are pinned to public commit `279001ce614edd7995780fdfc1466d104b721b2b`.
The README and handoff's pending-publication wording predates the confirmed
public repository; versioned release remains pending. Maintainer:
`StrangeTiger360 <yangzinan95@163.com>`.

**What it demonstrates**

- **State estimation** — EKF fusion of wheel odometry and IMU, and what actually
  degrades it: wheel slip, unmodelled latency, covariance that is guessed rather than measured
- **Planning and control** — global planner and local controller behaviour on a
  non-holonomic base, and the recovery behaviours that decide whether a robot is
  usable or merely demonstrable
- **`ros2_control` integration** — simulated joints through `gz_ros2_control`,
  with stamped commands checked by Collision Monitor and health supervision
- **Reproducibility** — clean-clone verification passed: three packages built,
  seven tests passed and a contact-free clear route

**Why this project**

My strongest robotics work dates from 2022. Rather than claim currency, I am
rebuilding it with the current toolchain. The simulation now has retained
benchmark results and a verified clean clone, with public source available.
A versioned release and public demonstration / artefact publishing are the
remaining release steps.
