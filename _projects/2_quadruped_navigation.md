---
layout: page
title: YoboGo quadruped motion control
description: Motion-control integration and Up Board bring-up with an MIT Mini Cheetah-derived stack at Geely Research Institute.

importance: 2
category: robotics
org: Geely Research Institute
period: "2022"
stack_line: C++ · Linux · Up Board · LCM · MIT Mini Cheetah-derived control
blurb: YoboGo quadruped motion control during my 2022 internship. My work focused on the existing C++ control stack and Up Board bring-up; colleagues handled Jetson-side SLAM and LiDAR.
---

**Stack:** C++ · Linux · Up Board · LCM · MIT Mini Cheetah-derived control

**Where:** Geely Research Institute, 2022

During my internship at Geely Research Institute, I worked on motion control
for the YoboGo quadruped. The robot used an existing C++ control stack derived
from MIT Mini Cheetah software, running on an Up Board.

**What I worked on**

- **Motion control** — working with the existing quadruped control software
  and its integration on the target computer.
- **Target bring-up** — the Up Board Linux environment and the dependencies
  needed to build and run the control stack.
- **Software interfaces** — working with the stack's LCM-based command, state
  and logging interfaces.

**Team context**

The team divided motion control and perception across two computers. My focus
was the Up Board motion-control side; colleagues handled SLAM and LiDAR on a
Jetson. This experience shaped my interest in the practical interface between
control software, the target computer and a moving robot.

<section class="zy-quad-tech" markdown="1">

## Inside the control stack

The diagrams below explain the **public MIT Cheetah reference software** that
underpins this family of controllers. They describe inherited software concepts;
my contribution remained motion-control integration and target bring-up. The
reference revision is pinned in the source links below.

<figure class="zy-quad-figure">
  <div class="zy-quad-scroll" tabindex="0" role="region" aria-label="Scrollable locomotion control diagram">
    <img src="{{ '/assets/img/projects/quadruped-control.svg' | relative_url }}" width="1040" height="740" loading="lazy" alt="Reference control flow: motion intent and estimated state feed convex MPC. Its leg commands can reach LegController directly or pass through optional whole-body control. A platform adapter packs commands, and feedback closes the loop.">
  </div>
  <figcaption>Logical control flow in the public reference. WBC is an optional branch. <span class="zy-quad-pan-hint">Swipe horizontally to read the diagram.</span> <a href="{{ '/assets/img/projects/quadruped-control.svg' | relative_url }}" target="_blank" rel="noopener">Open full-size diagram ↗</a></figcaption>
</figure>

### Planning forces, then forming leg commands

In the reference locomotion state, `ConvexMPCLocomotion` runs first. It supplies
desired body motion, foot trajectories, contact states and ground-reaction
forces. When `use_wbc` enables whole-body control, these references are passed to
`LocomotionCtrl`; otherwise, the MPC-generated leg commands remain the direct
control path. This distinction matters when tracing which component produced
a particular target or gain.

The lower layer groups each leg's feed-forward torque, foot-force reference,
position/velocity targets and PD gains in `LegController`. The hardware adapter
then packs the appropriate platform command. This diagram expresses software
dependencies, rather than an as-built YoboGo wiring layout.

Source: [public locomotion state](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/user/MIT_Controller/FSM_States/FSM_State_Locomotion.cpp).

<details class="zy-quad-detail">
  <summary>Inspect one control iteration</summary>
  <div markdown="1">

In the pinned `RobotRunner::run()` revision, the order is:

1. Run the state estimator using the data currently held by its inputs.
2. Call `setupStep()` to refresh leg data and clear the previous command buffer.
3. Apply the mode, enable and initialisation logic before invoking the controller.
4. Run the selected controller and update visualisation data.
5. Call `finalizeStep()` to pack commands and publish telemetry.

The estimator call precedes `setupStep()` in this revision. The diagram above
is therefore a dependency map, not a sensor-to-actuator timing trace. No measured
loop frequency or latency is claimed here.

Source: [public runner and estimator setup](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/robot/src/RobotRunner.cpp).

  </div>
</details>

### State estimates and coordinate frames

The normal reference estimator setup combines contact estimation, VectorNav
orientation and `LinearKFPositionVelocityEstimator`. The latter estimates body
position and velocity using inertial acceleration and leg kinematics; contact
phase changes how strongly foot observations are trusted. These are components
of the inherited stack, separate from my personal contribution.

The leg interface uses a frame aligned with the body and originating at the
leg's hip pivot. World-frame body or foot references must therefore be handled
with the appropriate transformations before reaching this interface.

Sources: [public position/velocity estimator](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/common/src/Controllers/PositionVelocityEstimator.cpp),
[leg-frame convention](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/common/src/Controllers/LegController.cpp).

### From a foot-force reference to joint torque

For the public Mini Cheetah SPI command packer, the host combines a
feed-forward foot force with Cartesian position and velocity feedback:

<div class="zy-quad-equation" tabindex="0" role="region" aria-label="Leg command equations" markdown="1">

$$f_{\mathrm{leg}} = f_{\mathrm{ff}} + K_p^x(p_d-p) + K_d^x(v_d-v)$$

$$\tau_{\mathrm{pack}} = \tau_{\mathrm{ff}} + J^{\mathsf T}f_{\mathrm{leg}}$$

</div>

Here, $p$ and $v$ are foot position and velocity in the leg frame, $J$ is the
leg Jacobian, and the subscript $d$ denotes a desired value. Joint targets and
diagonal joint PD gains are packed separately. The host's `tauEstimate` adds
the joint PD terms to the packed torque; it is a computed estimate, not a
torque-sensor measurement.

Source: [public leg-command packing](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/common/src/Controllers/LegController.cpp).

## Making the system observable with LCM

LCM provides typed publish/subscribe messages, generated encoding/decoding,
and tools for recording and replay. In the public runner, the three channels
below expose a snapshot of commands, leg data and the estimated body state.
Those snapshots make it possible to compare what the controller requested with
the state available to it.

<figure class="zy-quad-figure">
  <div class="zy-quad-scroll" tabindex="0" role="region" aria-label="Scrollable LCM telemetry diagram">
    <img src="{{ '/assets/img/projects/quadruped-telemetry.svg' | relative_url }}" width="1040" height="570" loading="lazy" alt="RobotRunner publishes leg_control_command, leg_control_data and state_estimator as typed LCM channels. Illustrative subscribers inspect, record or replay those messages. The hardware command path is separate.">
  </div>
  <figcaption>Reference channel names, with illustrative monitoring tools. <span class="zy-quad-pan-hint">Swipe horizontally to read the diagram.</span> <a href="{{ '/assets/img/projects/quadruped-telemetry.svg' | relative_url }}" target="_blank" rel="noopener">Open full-size diagram ↗</a></figcaption>
</figure>

Despite its name, `leg_control_command` is published here as command telemetry
after the platform command has been packed. Its presence alone does not identify
the physical motor bus or establish an LCM actuator-command path.

<details class="zy-quad-detail">
  <summary>Inspect the message contents</summary>
  <div class="zy-quad-table" tabindex="0" role="region" aria-label="LCM telemetry fields">
    <table>
      <thead><tr><th>Channel</th><th>Representative fields</th><th>What to inspect</th></tr></thead>
      <tbody>
        <tr><td><code>leg_control_command</code></td><td>Joint/foot targets, feed-forward terms and gains</td><td>Whether the intended command is populated</td></tr>
        <tr><td><code>leg_control_data</code></td><td>Joint position/velocity, foot position/velocity, estimated torque</td><td>Signs, offsets and consistency with the requested motion</td></tr>
        <tr><td><code>state_estimator</code></td><td>Position, quaternion, roll/pitch/yaw and body/world velocities</td><td>Frame conventions and changes in the estimated body state</td></tr>
      </tbody>
    </table>
  </div>
  <p>The public command and leg-data schemas use flattened 12-element arrays; the state schema uses named body/world vectors. These field layouts describe the reference messages.</p>
</details>

Sources: [LCM documentation](https://lcm-proj.github.io/lcm/),
[command schema](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/lcm-types/leg_control_command_lcmt.lcm),
[leg-data schema](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/lcm-types/leg_control_data_lcmt.lcm),
[state schema](https://github.com/mit-biomimetics/Cheetah-Software/blob/c71c5a138d3e418cc833e94e25357ceea8955daa/lcm-types/state_estimator_lcmt.lcm).

### Integration questions this architecture makes concrete

- **Target build:** are the model, controller executable, dependencies and generated message bindings consistent with the selected target?
- **Feedback:** do joint signs, zero offsets and coordinate frames agree with the model before motion is enabled?
- **Control path:** is the active controller branch producing the expected targets and gains?
- **Observability:** do recorded command and state messages support the behaviour seen on the robot?

These are integration checks suggested by the architecture. They are not a
record of measured acceptance results from my Geely internship.

</section>

---

*No proprietary Geely material is reproduced here.*
