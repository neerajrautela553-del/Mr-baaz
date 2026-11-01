# MR BAAZ 3D — GPS Radar & Expanded Pahadi Open World

Enhance the open world experience by introducing an on-screen mini-map GPS radar showing real-time player and Jeep coordinates, adding a nimble Mountain Bike vehicle alongside the 4x4 Jeep, and expanding interactive village quests.

### User Review & Critical Decisions

> [!IMPORTANT]
> The user asked "Aap kha hai" ("Where are you?"). We are introducing a high-precision on-screen Himalayan GPS Compass & Radar so players can instantly see their exact location in the village, relative to the 4x4 Jeep, Chai Tapri, and the Summit Mandir.

- **Confirmed Decision 1**: Add an active Circular Mini-Map Radar on the top corner with an orientation needle and real-time landmark pins.
- **Proposed Feature 2**: Add a switchable Mountain Sports Bike (Pahadi Cycle) with high maneuverability on narrow mountain paths, alongside the existing 4x4 Jeep.
- **Proposed Feature 3**: Add directional 3D waypoint beacon markers hovering over active mission targets.

---

### 1. Overview & Core Concept

- **What It Does**: Provides clear spatial navigation in the Uttarakhand Himalayan open world with an interactive HUD radar, accurate distance readouts to key landmarks, multiple vehicle choices, and streamlined mission waypoints.
- **Target Audience**: Mobile and PC players exploring the 3D Himalayan countryside, completing driving challenges, and seeking cultural landmarks.
- **Key Value**: Eliminates disorientation on winding mountain roads while deepening immersion and vehicle variety.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Orientation*: As the player moves or drives, the mini-map radar smoothly rotates to reflect camera heading, displaying real-time distance in meters to the nearest landmark.
  2. *Vehicle Selection*: Players can walk up to either the 4x4 Mountain Jeep or the Mountain Bike to mount/drive.
  3. *Waypoint Guidance*: Active quests display an in-world 3D glowing beacon and distance HUD counter.
- **Visual Identity & Theme**:
  - *Aesthetic*: Authentic Himalayan adventure with earthy slate, deodar green, and alpine sky tones.
  - *Typography*: Clean display sans for location titles, paired with tabular monospace numerals for GPS coordinates and speed.
  - *Radar Styling*: Circular radar with compass cardinals (N, S, E, W), player chevron, and color-coded landmark icons.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: SVG/Canvas 2D HUD Radar vs 3D Render Target Mini-Map**
  - *Chosen Approach*: Lightweight 2D canvas/SVG radar math running on coordinates directly.
  - *Why*: Renders at 60 FPS with zero extra WebGL draw passes, avoiding GPU strain on mobile devices and software WebGL environments.
- **Decision 2: Seamless Vehicle Proximity Detection**
  - *Chosen Approach*: Contextual button highlight when within 5 meters of any vehicle.
  - *Why*: Prevents accidental enters and provides clear affordance on touchscreens and keyboards.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   GameCanvas (WebGL)                   │
│   ┌────────────────┐  ┌──────────────┐  ┌───────────┐  │
│   │ Terrain/World  │  │  PahadiJeep  │  │ PahadiBike│  │
│   └───────┬────────┘  └──────┬───────┘  └─────┬─────┘  │
│           │                  │                │        │
│           └───────────┬──────┴────────────────┘        │
│                       ▼                                │
│               Active Actor Matrix                      │
│            (Position, Heading, Speed)                  │
└───────────────────────┬────────────────────────────────┘
                        │ Real-time stats & coordinates
                        ▼
┌────────────────────────────────────────────────────────┐
│                   HUD & Overlay Layer                  │
│   ┌────────────────────┐      ┌────────────────────┐   │
│   │ Circular GPS Radar │      │   Speed & Score    │   │
│   └────────────────────┘      └────────────────────┘   │
│   ┌────────────────────┐      ┌────────────────────┐   │
│   │ Active Quest Guide │      │ Collapsible Dock   │   │
│   └────────────────────┘      └────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

- **Data Model**:
  - Real-time player vector `[x, y, z]` mapped to normalized radar coordinates.
  - Active waypoint distance calculation: $d = \sqrt{(x_2 - x_1)^2 + (z_2 - z_1)^2}$.
  - Vehicle state machine: `WALK` $\leftrightarrow$ `DRIVE_JEEP` $\leftrightarrow$ `RIDE_BIKE`.
