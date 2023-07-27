

                     re-render
          ┌───────────────────────────────────────────────────┐
          │                                                   │
          ▼                                                   │
       ┌─ mutraction-react sync ─────────┐                    │
       │                                 │                    │
       │  startDependencyTrack(); ────── │ ──────────┐        │
       │                                 │           │        │
       │  ┌─ Component ──────┐           │           │     ┌─ Meta React™ ───────────────┐
       │  │                  │           │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  │ if (model.foo) { │           │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  │   model.bar = 7; │           │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  │ }                │           │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  │                  │           │           │     │\\\\\\ Opaque       \\\\\\\\\│
       │  └──────────────────┘           │           │     │\\\\\\ Machinations \\\\\\\\\│
       │                                 │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  endDependencyTrack(); ──────── │ ──────────┤     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │                                 │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │  useSyncExternalStore(); ────── │ ───────── │ ───►│\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │                                 │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       │                                 │           │     │\\\\\\\\\\\\\\\\\\\\\\\\\\\\\│
       └─────────────┬───┬───────────────┘           │     └─────────────────────────────┘
                     │   │                           │                       ▲
                 get │   │ set                       │         │             │
                     │   │                           │         │ subscribe   │ callback
                     ▼   ▼                           ▼         ▼
           ┌─ Proxy ──────────────────┐           ┌─ Tracker ────────────────────┐
           │                          │           │                              │
           │         │   │ record     │           │  #history                    │
           │         │   │ change     │           │  #transactions               │
           │         │   ├─────────── │ ────────► │  #generation                 │
           │         │   │            │           │  #subscribers                │
           │         │   │ record     │           │                              │
           │         │   │ dependency │           │                              │
           │         ├── │ ────────── │ ────────► │                              │
           │         │   │            │           │                              │
           │         ▼   ▼            │           └──────────────────────────────┘
           │  ┌─ Model ────────────┐  │
           │  │                    │  │
           │  │ {                  │  │
           │  │   title: "Report", │  │
           │  │   type: 6          │  │
           │  │ }                  │  │
           │  │                    │  │
           │  └────────────────────┘  │
           │                          │
           └──────────────────────────┘

