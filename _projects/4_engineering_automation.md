---
layout: page
title: Engineering automation platform
description: Generating and validating control projects programmatically — TIA Openness, PLC↔HMI tag handoff, simulated test rigs.

importance: 4
category: engineering automation
org: Siemens Ltd., China
period: 2022 – present
stack_line: TIA Openness (C# / PowerShell) · WinCC Unified · PLCSIM Advanced · TIA VCI
blurb: "Control projects as generated, testable artefacts: screens, tags and blocks created from a specification; an automated PLC↔HMI tag contract; static analysis over SCL and SimaticML; PLCSIM Advanced rigs driven from PowerShell; machine software under real version control. Virtual commissioning and CI for control software."
---

**Stack:** TIA Openness (C# / PowerShell) · WinCC Unified · PLCSIM Advanced · TIA VCI

Control projects are normally built by hand in an IDE, which makes them slow to
produce and impossible to verify mechanically. I built tooling that treats them
as generated, testable artefacts.

**Components**

- **Project generation** — screens, tags and blocks created programmatically from
  a specification rather than clicked
- **PLC↔HMI tag handoff** — an automated contract between the two sides, so a
  mismatch fails at generation time instead of at the panel during commissioning
- **Consistency checking** — static analysis over SCL and SimaticML catching dead
  interlocks, uncalled blocks, broken alarm chains and unclamped operator setpoints
- **Simulated test rigs** — PLCSIM Advanced instances driven from PowerShell, so
  control logic is exercised before hardware exists
- **Version control** — TIA VCI workspace integration, putting machine software
  under real source control

**Why it is relevant beyond automation**

This is virtual commissioning and CI for control software: test in simulation,
verify mechanically, deploy to hardware. The same argument applies to a robot
cell as to a production machine, and it is the workflow that Process Simulate and
Isaac Sim exist to serve.

**Result**

&lt;Quantify: authoring time before → after, defects caught pre-dispatch, projects
using the toolchain.&gt;

---

*Describes techniques only. No customer projects, source files or screenshots.*
