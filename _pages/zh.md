---
layout: page
title: 中文
permalink: /zh/
description: 机器人与运动控制工程师。
nav: true
nav_order: 4
---

<div class="zy-doc" lang="zh">

<div class="zy-eyebrow">机器人 · 运动控制 · 北京</div>

<h1 class="zy-h1 zy-h1-page">杨子楠</h1>

<p class="zy-lede">机器人与运动控制工程师——算法与真实运动机构之间的那层控制软件。</p>

<p>我的背景分布在这个问题的两端：一端是机器人方向的硕士学习与四足机器人导航开发，另一端是四年工业伺服运动控制的工程实践。</p>

<p>目前在<strong>西门子（中国）有限公司</strong>担任应用工程师，方向为运动控制——SINAMICS S120 / S200 / V90 伺服驱动系统，涵盖回原点、凸轮同步、故障诊断的可复用 SCL 轴控制库，以及用程序化方式生成和校验控制项目的工程工具链。在此之前，我在<strong>吉利研究院</strong>负责四足机器人的导航开发：EKF 状态估计、A* 路径规划、激光雷达数据处理与 ROS 集成。</p>

<p>我正在把重心移回机器人方向。工业伺服控制与机器人运动控制本质上是同一门学科的两套词汇——轨迹规划、闭环位置控制、多轴协调运动，以及传感器失效或轴在运动过程中发生故障时系统应当如何响应。</p>

<h2 class="zy-mono zy-label">进行中</h2>

<div class="zy-card zy-zh-card">
  <div class="zy-zh-card-head">
    <span class="zy-pill"><span class="zy-dot"></span>进行中 · 仓库将于 2026 年 11 月公开</span>
    <h3 class="zy-h3">差速驱动 AGV 导航栈</h3>
    <p class="zy-muted">基于 ROS 2 Jazzy 与 nav2 的完整自主导航栈：URDF 与 ros2_control 硬件接口、轮式里程计与 IMU 的 EKF 融合、代价地图组态、全局规划器与局部控制器整定。</p>
    <div class="zy-mono zy-stackline">ROS 2 Jazzy · nav2 · robot_localization · ros2_control</div>
  </div>
</div>

<h2 class="zy-mono zy-label zy-label-gap">经历</h2>

<ul class="zy-list">
  <li class="zy-list-row"><span class="zy-mono zy-list-when">2022 — 至今</span><span><strong>西门子（中国）有限公司</strong> — 应用工程师（数字化工业集团）。运动控制库、驱动调试、TIA 博途 Openness 工程自动化。</span></li>
  <li class="zy-list-row"><span class="zy-mono zy-list-when">2022</span><span><strong>吉利研究院</strong> — 机器人算法工程师。四足机器人导航：EKF、A*、激光雷达、ROS。</span></li>
  <li class="zy-list-row"><span class="zy-mono zy-list-when">2020 — 22</span><span><strong>机器人学 硕士</strong>，伦敦国王学院。</span></li>
  <li class="zy-list-row"><span class="zy-mono zy-list-when">2018 — 20</span><span><strong>瓦锡兰</strong>（上海）— 产品工程师。</span></li>
  <li class="zy-list-row"><span class="zy-mono zy-list-when">2013 — 17</span><span><strong>机械工程 学士</strong>，布里斯托大学。</span></li>
</ul>

<h2 class="zy-mono zy-label zy-label-gap">主要工作</h2>

<div class="zy-zh-projects">
  <div class="zy-zh-project">
    <div class="zy-mono zy-row-cat">机器人</div>
    <h3 class="zy-h3">四足机器人导航<span class="zy-mono zy-zh-org">吉利研究院</span></h3>
    <p class="zy-muted">腿式平台的状态估计与路径规划。机身随步态持续俯仰与横滚，里程计来自腿部运动学而非编码器，激光雷达始终处于倾斜坐标系中——这些都使轮式导航的既有假设不再成立。</p>
  </div>
  <div class="zy-zh-project">
    <div class="zy-mono zy-row-cat">运动控制</div>
    <h3 class="zy-h3">伺服运动控制库<span class="zy-mono zy-zh-org">西门子</span></h3>
    <p class="zy-muted">面向 S7-1500T 工艺对象的可复用运动功能块：统一封装 <code>MC_Power</code>、<code>MC_Home</code>、<code>MC_Reset</code> 与 <code>MC_Move</code> 系列接口，涵盖回原点策略、凸轮同步、以及能指明故障轴与处理方式的诊断分级。配合一键调试流程，缩短新轴从接线到运行的时间。</p>
  </div>
  <div class="zy-zh-project">
    <div class="zy-mono zy-row-cat">工程自动化</div>
    <h3 class="zy-h3">工程自动化平台<span class="zy-mono zy-zh-org">西门子</span></h3>
    <p class="zy-muted">通过 TIA 博途 Openness 按规格书程序化生成画面、变量与程序块；PLC 与 HMI 变量的自动化交接，使不匹配在生成阶段即报错，而非在现场调试时才暴露；对 SCL 与 SimaticML 做静态分析，检出未被读取的互锁、未被调用的程序块、断裂的报警链路与缺少限幅的操作员设定值；并用 PLCSIM Advanced 在硬件到位前验证控制逻辑。</p>
  </div>
</div>

<h2 class="zy-mono zy-label zy-label-gap">技能</h2>

<dl class="zy-zh-skills">
  <dt>机器人</dt><dd class="zy-mono">ROS 2 / ROS · nav2 · EKF 与传感器融合 · SLAM 与定位 · 路径规划 · MuJoCo · Isaac Sim</dd>
  <dt>运动控制</dt><dd class="zy-mono">SIMATIC S7-1500T 工艺对象 · SINAMICS S120 / S200 / V90 · SIMOTICS S-1FL6 · 轨迹规划 · 凸轮同步 · 伺服调试</dd>
  <dt>编程</dt><dd class="zy-mono">SCL（结构化控制语言）· Python · C++ · C# · PowerShell · MySQL</dd>
  <dt>工程自动化</dt><dd class="zy-mono">TIA 博途 Openness · WinCC Unified · PLCSIM Advanced · TIA 博途版本控制接口 · 虚拟调试</dd>
  <dt>语言</dt><dd class="zy-mono">中文（母语）· 英语（流利）· 德语（日常交流）</dd>
</dl>

<h2 class="zy-mono zy-label zy-label-gap">联系</h2>

<p>邮箱：<a href="mailto:yangzinan95@163.com">yangzinan95@163.com</a></p>

<p class="zy-muted zy-small">英文版本见 <a href="{{ '/' | relative_url }}">首页</a>。本站为个人学习记录，内容不涉及任何客户项目文件、源代码或现场资料。</p>

</div>
