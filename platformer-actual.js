kaboom({
    background: [30, 30, 30], // dark background
});

// Start the main scene
scene("main", () => {
    setGravity(1600);

    const MOVE_SPEED = 240;
    const JUMP_FORCE = 900;

    // Add ground
    add([
        rect(640, 32),
        pos(0, 448),
        area(),
        body({ isStatic: true }),
        color(0, 180, 60),
    ]);

    // Add platforms
    const platforms = [
        [120, 380],
        [300, 320],
        [500, 260],
        [200, 200],
        [400, 140],
    ];

    for (const [x, y] of platforms) {
        add([
            rect(100, 20),
            pos(x, y),
            area(),
            body({ isStatic: true }),
            color(50, 120, 255),
        ]);
    }

    // Add player
    const player = add([
        rect(32, 32),
        pos(60, 400),
        area(),
        body(),
        color(255, 60, 60),
        'player',
    ]);

    // Score system
    let score = 0;
    const scoreLabel = add([
        text("Score: 0", { size: 24 }),
        pos(12, 12),
        fixed(),
        color(255, 255, 0),
    ]);

    function spawnCoin(x, y) {
        return add([
            rect(18, 18),
            pos(x, y - 20), // slightly above the platform
            area(),
            color(255, 220, 40),
            'coin',
        ]);
    }

    // Place coins randomly on platforms and ground
    function randomInt(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    // Coins on platforms
    for (const [x, y] of platforms) {
        if (Math.random() < 0.8) {
            spawnCoin(x + randomInt(10, 70), y - 10);
        }
    }
    // Coins on ground
    for (let i = 0; i < 5; i++) {
        spawnCoin(randomInt(20, 600), 448 - 20);
    }

    // Add moving obstacles on platforms
    const obstacles = [];
    for (const [x, y] of platforms) {
        // Place 1 obstacle per platform, not on all
        if (Math.random() < 0.7) {
            const startX = x + 10;
            const endX = x + 70;
            const speed = 60 + Math.random() * 60;
            const obs = add([
                rect(24, 24),
                pos(startX, y - 24),
                area(),
                color(255, 100, 0),
                'obstacle',
                { dir: Math.random() < 0.5 ? 1 : -1, startX, endX, speed },
            ]);
            obs.onUpdate(function() {
                this.move(this.dir * this.speed, 0);
                if (this.pos.x < this.startX) this.dir = 1;
                if (this.pos.x > this.endX) this.dir = -1;
            });
            obstacles.push(obs);
        }
    }

    // Player dies on obstacle collision
    player.onCollide("obstacle", () => {
        go("gameover", { score });
    });

    // Player controls
    onKeyDown("left", () => {
        player.move(-MOVE_SPEED, 0);
    });

    onKeyDown("right", () => {
        player.move(MOVE_SPEED, 0);
    });

    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(JUMP_FORCE);
        }
    });

    // Collect coins
    player.onCollide("coin", (coin) => {
        destroy(coin);
        score++;
        scoreLabel.text = `Score: ${score}`;
    });

    // Camera follows player
    player.onUpdate(() => {
        camPos(player.pos);
        // Game over if player falls below the screen
        if (player.pos.y > 520) {
            go("gameover", { score });
        }
    });

    // Confirmation popup logic (must be inside scene)
    let confirmPopup = null;
    let confirmActive = false;

    function showConfirmPopup() {
        confirmActive = true;
        const popupWidth = 420;
        const popupHeight = 110;
        const popupY = 300; // further down the screen
        const textYOffset = -48; // vertical offset
        const textXOffset = -160; // move text left by 5 lines total
        confirmPopup = [
            add([
                rect(popupWidth, popupHeight),
                pos(0, popupY),
                color(30, 30, 30), // fully opaque
                outline(4, rgb(255,255,0)),
                z(100),
                'popup',
            ]),
            add([
                text('Are you sure you want to restart?\nY: Yes   N: No', { size: 24, anchor: 'center', width: 400 }),
                pos(popupWidth / 2 + textXOffset, popupY + popupHeight / 2 + textYOffset),
                color(255, 255, 0),
                z(101),
                'popup',
            ]),
        ];
    }
    function removeConfirmPopup() {
        confirmActive = false;
        if (confirmPopup) {
            for (const obj of confirmPopup) destroy(obj);
            confirmPopup = null;
        }
    }

    onKeyPress("r", () => {
        if (!confirmActive) {
            showConfirmPopup();
        }
    });
    onKeyPress("y", () => {
        if (confirmActive) {
            removeConfirmPopup();
            go("main");
        }
    });
    onKeyPress("n", () => {
        if (confirmActive) {
            removeConfirmPopup();
        }
    });
});

// Game Over scene
scene("gameover", ({ score }) => {
    add([
        text("Game Over", { size: 48, anchor: "center" }),
        pos(width() / 2, height() / 2 - 40),
        color(255, 0, 0),
    ]);
    add([
        text(`Final Score: ${score}`, { size: 32, anchor: "center" }),
        pos(width() / 2, height() / 2 + 20),
        color(255, 255, 0),
    ]);
    add([
        text("Press R to Restart", { size: 24, anchor: "center" }),
        pos(width() / 2, height() / 2 + 70),
        color(200, 200, 200),
    ]);
    onKeyPress("r", () => {
        go("main"); // Restart the main scene
    });
});

go("main"); // Start the game
