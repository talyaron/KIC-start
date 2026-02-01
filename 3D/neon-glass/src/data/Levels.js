export const Levels = [
    {
        name: "LVL 1: THE LIAR",
        twist: "Keep running or be crushed.",
        platforms: [
            { x: 1000, y: 584, w: 60, h: 1 }, // Flat ground
            { x: 1500, y: 200, w: 2, h: 10, crusher: true, trigger: 400 }, // Falling pillar 1
            { x: 2500, y: 200, w: 2, h: 10, crusher: true, trigger: 1800 }, // Falling pillar 2 (Different spot)
        ],
        spikes: [],
        gate: { x: 3000, y: 536 }
    },
    {
        name: "LVL 2: SHIFTING SKY",
        twist: "Lightning never strikes twice... usually.",
        platforms: [
            { x: 1000, y: 584, w: 60, h: 1 },
            { x: 500, y: 200, w: 1, h: 15, crusher: true, trigger: 100 },
            { x: 1200, y: 200, w: 1, h: 15, crusher: true, trigger: 800 },
            { x: 2000, y: 200, w: 1, h: 15, crusher: true, trigger: 1500 },
            { x: 2500, y: 200, w: 1, h: 15, crusher: true, trigger: 2200 },
        ],
        gate: { x: 3000, y: 536 }
    },
    {
        name: "LVL 3: THE FLOOR IS GONE",
        twist: "Look closely at the grid.",
        platforms: [
            { x: 400, y: 584, w: 20, h: 1 },
            { x: 1200, y: 584, w: 20, h: 1, fake: true }, // FAKE GROUND!
            { x: 2000, y: 584, w: 20, h: 1 },
        ],
        gate: { x: 3000, y: 536 }
    },
    {
        name: "LVL 4: SPEED TRAP",
        twist: "Don't jump.",
        platforms: [
            { x: 1000, y: 584, w: 60, h: 1 },
        ],
        spikes: [
            { x: 500, y: 568, count: 50 } // Massive spike corridor
        ],
        gate: { x: 3000, y: 536 }
    }
];
