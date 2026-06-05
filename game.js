// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sprite images
const spriteKeys = ['brick', 'qblock', 'empty', 'coin', 'ground', 'mario', 'mariojump', 'mariowalk', 'mariodeath', 'goomba', 'pole', 'mushroom'];
const sprites = {};
spriteKeys.forEach(k => { sprites[k] = new Image(); });
let spritesLoaded = false;

function spriteOk(s) {
    return s.complete && s.naturalWidth > 0;
}

function loadSprites() {
    let loaded = 0;
    const total = spriteKeys.length;
    const onDone = () => { loaded++; if (loaded >= total) spritesLoaded = true; };
    spriteKeys.forEach(k => {
        sprites[k].onload = onDone;
        sprites[k].onerror = onDone;
        sprites[k].src = `sprites/${k}.png`;
    });
}
loadSprites();

// Fullscreen canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    blocks = [];
    enemies = [];
    initializeBlocks();
    initEnemies();
    initPole();
    player.y = canvas.height - 80 - PLAYER_HEIGHT;
});

// Game constants
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 5;
const JUMP_POWER = 12;
const GRAVITY = 0.6;
const JUMP_HOLD_GRAVITY = 0.25;
const DEATH_JUMP = -10;
const LEVEL_WIDTH = 5000; // Extended level width
const BLOCK_SIZE = 40; // Block width matches player width
const ENEMY_SIZE = 40;
const ENEMY_SPEED = 2;

// Block bounce (when hit from below)
const BOUNCE_STRENGTH = -8;
const BOUNCE_RECOVERY = 1;

// Score
const COIN_SCORE = 100;
const ENEMY_SCORE = 200;
const COIN_SIZE = 20;
const COIN_LIFT = -7;
const COIN_GRAVITY = 0.4;
const COIN_LIFETIME = 25;
const FLOAT_LIFETIME = 35;
const MUSHROOM_SCORE = 1000;

// Sky & cloud background
const SKY_COLOR = '#5c94fc';
const CLOUD_CELL = 12; // pixel size of each cloud cell

// Cloud patterns (1 = cloud fill)
const cloudPatterns = [
    { // Small cloud (12x4 cells = 96x32 px)
        w: 12, h: 4,
        data: [
            [0,0,0,0,0,1,1,1,1,1,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,0,0,0],
        ]
    },
    { // Large cloud (14x6 cells = 112x48 px)
        w: 14, h: 6,
        data: [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
        ]
    }
];

// Cloud instances across the level (parallax removed — fixed world positions)
const clouds = [
    { x: 200,  y: 60, pattern: 0 },
    { x: 700,  y: 40, pattern: 1 },
    { x: 1300, y: 70, pattern: 0 },
    { x: 1900, y: 35, pattern: 1 },
    { x: 2500, y: 65, pattern: 0 },
    { x: 3200, y: 45, pattern: 1 },
    { x: 3900, y: 60, pattern: 0 },
    { x: 4600, y: 40, pattern: 1 },
];

// --- SMB-style pixel hills ---
const HILL_CELL = 8;
const HILL_COLORS = ['#00e800', '#00a800', '#006800'];

const hillDefs = [
    { // Small hill
        w: 12, h: 6,
        data: [
            [0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
        ]
    },
    { // Large hill
        w: 16, h: 8,
        data: [
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ]
    }
];

const hills = [
    { x: 100,  pattern: 0 },
    { x: 900,  pattern: 1 },
    { x: 1900, pattern: 0 },
    { x: 2800, pattern: 1 },
    { x: 3800, pattern: 0 },
    { x: 4700, pattern: 1 },
];

// Bushes reuse cloud pattern, rendered in green at ground level
const BUSH_CELL = 10;
const BUSH_COLORS = ['#00b800', '#007800'];

const bushInstances = [
    { x: 550,  pattern: 0 },
    { x: 1550, pattern: 1 },
    { x: 2650, pattern: 0 },
    { x: 3650, pattern: 1 },
    { x: 4550, pattern: 0 },
];

// Pole constants
const POLE_WIDTH = 24;
const POLE_HEIGHT = 280;
const POLE_X = 4880;
const POLE_STAND_TIME = 2000;

// Game state
let gameWon = false;
let gameOver = false;
let pole = {};
let poleStandStart = 0;
let score = 0;
let coinCount = 0;
let timer = 500;
let lastTimerTick = 0;
let coins = [];
let floatTexts = [];

// Pit definitions — gaps in the upper floor tier
const pits = [
    { x: 760, width: 120 },
    { x: 1360, width: 120 },
    { x: 2040, width: 160 },
    { x: 2760, width: 120 },
    { x: 3480, width: 160 },
    { x: 4200, width: 120 }
];

// Block definition
let blocks = [];
let enemies = [];

// Helper: check if an x position is inside any pit
function isInPit(x) {
    return pits.some(pit => x >= pit.x && x < pit.x + pit.width);
}

// Initialize blocks from platform definitions
function initializeBlocks() {
    const floatingPlatforms = [
        {
            x: 350,
            y: canvas.height - 250,
            width: 160,
            height: 40
        },
        {
            x: 1000,
            y: canvas.height - 300,
            width: 160,
            height: 40
        },
        {
            x: 1680,
            y: canvas.height - 280,
            width: 120,
            height: 40
        },
        {
            x: 2400,
            y: canvas.height - 340,
            width: 200,
            height: 40
        },
        {
            x: 3040,
            y: canvas.height - 300,
            width: 160,
            height: 40
        },
        {
            x: 3800,
            y: canvas.height - 355,
            width: 240,
            height: 40
        },
        {
            x: 4520,
            y: canvas.height - 350,
            width: 200,
            height: 40
        }
    ];

    // --- Ground: two tiers — both skip pit areas ---
    for (let i = 0; i < LEVEL_WIDTH / BLOCK_SIZE; i++) {
        const bx = i * BLOCK_SIZE;
        if (!isInPit(bx)) {
            blocks.push({
                x: bx,
                y: canvas.height - 40,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                intact: true,
                bouncing: false,
                bounceOffset: 0,
                isGround: true
            });
            blocks.push({
                x: bx,
                y: canvas.height - 80,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                intact: true,
                bouncing: false,
                bounceOffset: 0,
                isGround: true
            });
        }
    }

    // --- Floating platforms ---
    floatingPlatforms.forEach(platform => {
        const blocksCount = platform.width / BLOCK_SIZE;
        for (let i = 0; i < blocksCount; i++) {
            const hasCoin = Math.random() < 0.25;
            blocks.push({
                x: platform.x + (i * BLOCK_SIZE),
                y: platform.y,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                intact: true,
                bouncing: false,
                bounceOffset: 0,
                hasCoin: hasCoin,
                wasCoin: hasCoin
            });
        }
    });

}

// Initialize blocks
initializeBlocks();

// Initialize enemies
function initEnemies() {
    const groundTop = canvas.height - 80;
    // Ground enemies (on top tier, between pits)
    const groundSpots = [
        { x: 1020, w: 160 },
        { x: 1720, w: 120 },
        { x: 2480, w: 160 },
        { x: 3160, w: 120 },
        { x: 3920, w: 160 },
        { x: 4640, w: 120 }
    ];
    function makeEnemy(x, y) {
        return {
            x, y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE,
            startX: x,
            dir: -1,
            velY: 0,
            onGround: true,
            alive: true
        };
    }
    groundSpots.forEach(spot => {
        enemies.push(makeEnemy(spot.x, groundTop - ENEMY_SIZE));
    });
}
initEnemies();

// Initialize flag pole
function initPole() {
    const py = canvas.height - 80 - POLE_HEIGHT;
    pole = { x: POLE_X, y: py, width: POLE_WIDTH, height: POLE_HEIGHT };
}
initPole();

// Camera
let cameraX = 0;

// Player object
const player = {
    x: 100,
    y: canvas.height - 80 - PLAYER_HEIGHT, // start on top of ground (two tiers)
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velX: 0,
    velY: 0,
    speed: PLAYER_SPEED,
    jumpPower: JUMP_POWER,
    gravity: GRAVITY,
    onGround: false,
    facing: 1,
    dead: false
};

// Input state
const keys = {
    left: false,
    right: false,
    up: false
};

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowUp':
        case ' ':
            keys.up = true;
            break;
        case 'r':
        case 'R':
            if (gameWon) {
                gameWon = false;
                respawnPlayer();
            } else if (gameOver) {
                respawnPlayer();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowUp':
        case ' ':
            keys.up = false;
            break;
    }
});

// Helper: check if a solid block exists at (x, y) covering a given area
function isBlockBelow(x, y, w) {
    const feetY = y + 1;
    return blocks.some(b =>
        b.intact &&
        x + w > b.x &&
        x <= b.x + b.width &&
        feetY >= b.y &&
        feetY < b.y + b.height
    );
}

// Update enemies (physics-based patrol)
function updateEnemies() {
    enemies.forEach(e => {
        if (!e.alive) return;

        // Gravity
        e.velY += GRAVITY;
        e.onGround = false;

        // Vertical movement
        e.y += e.velY;

        // Block collision (vertical landing)
        blocks.forEach(block => {
            if (!block.intact) return;
            const eRect = { x: e.x, y: e.y, width: e.width, height: e.height };
            if (checkCollision(eRect, block)) {
                const overlapX = Math.min(e.x + e.width, block.x + block.width) - Math.max(e.x, block.x);
                const overlapY = Math.min(e.y + e.height, block.y + block.height) - Math.max(e.y, block.y);
                if (overlapX >= overlapY) {
                    if (e.velY > 0) {
                        e.y = block.y - e.height;
                        e.velY = 0;
                        e.onGround = true;
                    } else if (e.velY < 0) {
                        e.y = block.y + block.height;
                        e.velY = 0;
                    }
                }
            }
        });

        // Spawned enemies: wait until landed, then start moving
        if (e.spawned) {
            if (e.onGround) {
                e.spawned = false;
            }
            return;
        }

        // Check if standing on ground blocks — disable noEdgeDetect
        if (e.noEdgeDetect && e.onGround) {
            const feetY = e.y + e.height;
            const onGroundBlock = blocks.some(b =>
                b.intact && b.isGround &&
                e.x + e.width > b.x &&
                e.x < b.x + b.width &&
                Math.abs(feetY - b.y) < 0.5
            );
            if (onGroundBlock) {
                e.noEdgeDetect = false;
            }
        }

        // Horizontal movement (only on ground)
        if (e.onGround) {
            const nextX = e.x + ENEMY_SPEED * e.dir;
            if (e.noEdgeDetect) {
                e.x = nextX;
            } else {
                const feetY = e.y + e.height;
                const checkX = e.dir > 0 ? nextX + e.width : nextX;
                const hasGroundAhead = isBlockBelow(checkX, feetY, 1);
                if (hasGroundAhead) {
                    e.x = nextX;
                } else {
                    e.dir *= -1;
                }
            }
        }
    });
}

// Spawn enemy/mushroom from question block
function spawnBlockEnemy(cx, cy, type) {
    enemies.push({
        x: cx - ENEMY_SIZE / 2,
        y: cy - ENEMY_SIZE,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        startX: cx,
        dir: -1,
        velY: -6,
        onGround: false,
        alive: true,
        spawned: true,
        noEdgeDetect: true,
        type: type || 'goomba'
    });
}

// Respawn player after death
function respawnPlayer() {
    // Reset player to start
    player.x = 100;
    player.y = canvas.height - 80 - PLAYER_HEIGHT;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.facing = 1;
    player.dead = false;
    gameOver = false;
    // Reset score and game objects
    score = 0;
    coinCount = 0;
    timer = 500;
    lastTimerTick = 0;
    coins = [];
    floatTexts = [];
    // Remove spawned enemies and reset regular ones
    enemies = enemies.filter(e => !e.spawned);
    enemies.forEach(e => {
        e.alive = true; e.x = e.startX; e.dir = -1; e.velY = 0; e.onGround = true;
    });
    // Reset pole stand timer
    poleStandStart = 0;
    // Reset camera
    cameraX = 0;
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update player position and physics
function updatePlayer() {
    // Death animation: fly up then fall; no input, no collisions
    if (player.dead) {
        player.velY += GRAVITY;
        player.y += player.velY;
        if (player.y > canvas.height + 200) {
            gameOver = true;
        }
        return;
    }

    // Horizontal movement
    if (keys.left) {
        player.velX = -player.speed;
        player.facing = -1;
    } else if (keys.right) {
        player.velX = player.speed;
        player.facing = 1;
    } else {
        player.velX = 0;
    }

    // Jump
    if (keys.up && player.onGround) {
        player.velY = -player.jumpPower;
        player.onGround = false;
    }

    // Apply gravity (reduced while holding jump and ascending)
    if (keys.up && player.velY < 0) {
        player.velY += JUMP_HOLD_GRAVITY;
    } else {
        player.velY += player.gravity;
    }

    // Save previous position before any movement
    const prevPlayerY = player.y;

    // --- Horizontal movement ---
    player.onGround = false;
    player.x += player.velX;

    // Horizontal collision pass (only push sideways)
    blocks.forEach(block => {
        if (!block.intact) return;
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkCollision(playerRect, block)) {
            const overlapX = Math.min(player.x + player.width, block.x + block.width) - Math.max(player.x, block.x);
            const overlapY = Math.min(player.y + player.height, block.y + block.height) - Math.max(player.y, block.y);
            if (overlapX < overlapY) {
                if (player.velX > 0) {
                    player.x = block.x - player.width;
                } else if (player.velX < 0) {
                    player.x = block.x + block.width;
                }
                player.velX = 0;
            }
        }
    });

    // --- Vertical movement ---
    player.y += player.velY;

    // Vertical collision pass (only push up/down)
    blocks.forEach(block => {
        if (!block.intact) return;
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkCollision(playerRect, block)) {
            const overlapX = Math.min(player.x + player.width, block.x + block.width) - Math.max(player.x, block.x);
            const overlapY = Math.min(player.y + player.height, block.y + block.height) - Math.max(player.y, block.y);
            if (overlapX >= overlapY) {
                if (player.velY > 0) {
                    player.y = block.y - player.height;
                    player.velY = 0;
                    player.onGround = true;
                } else if (player.velY < 0) {
                    if (prevPlayerY >= block.y + block.height && !block.bouncing) {
                        block.bouncing = true;
                        block.bounceOffset = BOUNCE_STRENGTH;
                        if (block.hasCoin) {
                            block.hasCoin = false;
                            const roll = Math.random();
                            if (roll < 0.4) {
                                spawnBlockEnemy(block.x + block.width / 2, block.y, 'goomba');
                            } else if (roll < 0.6) {
                                spawnBlockEnemy(block.x + block.width / 2, block.y, 'mushroom');
                            } else {
                                coins.push({
                                    x: block.x + block.width / 2 - COIN_SIZE / 2,
                                    y: block.y - COIN_SIZE,
                                    vy: COIN_LIFT,
                                    life: COIN_LIFETIME
                                });
                            }
                        }
                    }
                    player.y = block.y + block.height;
                    player.velY = 0;
                }
            }
        }
    });

    // Pit death — player fell below screen
    if (player.y > canvas.height) {
        player.dead = true;
        player.velX = 0;
        player.velY = DEATH_JUMP;
    }

    // Enemy/mushroom collision
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkCollision(playerRect, enemy)) {
            if (enemy.type === 'mushroom') {
                enemy.alive = false;
                score += MUSHROOM_SCORE;
                floatTexts.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y,
                    text: '' + MUSHROOM_SCORE,
                    vy: -2,
                    alpha: 1,
                    life: FLOAT_LIFETIME
                });
            } else if (player.velY > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                enemy.alive = false;
                player.velY = -JUMP_POWER / 1.5;
                score += ENEMY_SCORE;
                floatTexts.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y,
                    text: '' + ENEMY_SCORE,
                    vy: -2,
                    alpha: 1,
                    life: FLOAT_LIFETIME
                });
            } else {
                player.dead = true;
                player.velX = 0;
                player.velY = DEATH_JUMP;
            }
        }
    });

    // Prevent moving off level horizontally
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x > LEVEL_WIDTH - player.width) {
        player.x = LEVEL_WIDTH - player.width;
    }

    // Update camera to follow player
    const desiredCameraX = player.x - canvas.width / 2 + player.width / 2;
    // Clamp camera to level bounds
    cameraX = Math.max(0, Math.min(desiredCameraX, LEVEL_WIDTH - canvas.width));
}

// Update block animations (bounce recovery)
function updateBlocks() {
    blocks.forEach(block => {
        if (!block.bouncing) return;
        block.bounceOffset += BOUNCE_RECOVERY;
        if (block.bounceOffset >= 0) {
            block.bounceOffset = 0;
            block.bouncing = false;
        }
    });
}

function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.vy += COIN_GRAVITY;
        c.y += c.vy;
        c.life--;
        if (c.life <= 0) {
            score += COIN_SCORE;
            coinCount++;
            floatTexts.push({
                x: c.x + COIN_SIZE / 2,
                y: c.y,
                text: '' + COIN_SCORE,
                vy: -2,
                alpha: 1,
                life: FLOAT_LIFETIME
            });
            coins.splice(i, 1);
        }
    }
}

function updateFloatTexts() {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        const ft = floatTexts[i];
        ft.y += ft.vy;
        ft.life--;
        ft.alpha = Math.max(0, ft.life / FLOAT_LIFETIME);
        if (ft.life <= 0) {
            floatTexts.splice(i, 1);
        }
    }
}

// Render blocks
function renderBlocks() {
    const now = Date.now();
    const useSprites = spritesLoaded && spriteOk(sprites.brick) && spriteOk(sprites.ground);
    blocks.forEach(block => {
        if (!block.intact) return;
        const by = block.y + block.bounceOffset;
        const sx = block.x - cameraX;

        if (useSprites) {
            if (block.hasCoin) {
                ctx.drawImage(sprites.qblock, sx, by, BLOCK_SIZE, BLOCK_SIZE);
                const pulse = 0.12 + 0.08 * Math.sin(now / 250);
                ctx.fillStyle = `rgba(255,255,200,${pulse})`;
                ctx.fillRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
            } else if (block.wasCoin && spriteOk(sprites.empty)) {
                ctx.drawImage(sprites.empty, sx, by, BLOCK_SIZE, BLOCK_SIZE);
            } else if (block.isGround) {
                ctx.drawImage(sprites.ground, sx, by, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                ctx.drawImage(sprites.brick, sx, by, BLOCK_SIZE, BLOCK_SIZE);
            }
        } else {
            if (block.hasCoin) {
                ctx.fillStyle = '#c8a24e';
                ctx.fillRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    });
}

// Render enemies
function renderEnemies() {
    const hasGoomba = spritesLoaded && spriteOk(sprites.goomba);
    const hasMushroom = spritesLoaded && spriteOk(sprites.mushroom);
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const ex = enemy.x - cameraX;
        const bob = hasGoomba ? Math.sin(Date.now() / 120 + enemy.startX) * 2 : 0;
        const ey = enemy.y + bob;
        if (enemy.type === 'mushroom') {
            if (hasMushroom) {
                ctx.save();
                if (enemy.dir < 0) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprites.mushroom, -ex - ENEMY_SIZE, ey, ENEMY_SIZE, ENEMY_SIZE);
                } else {
                    ctx.drawImage(sprites.mushroom, ex, ey, ENEMY_SIZE, ENEMY_SIZE);
                }
                ctx.restore();
            } else {
                const cx = ex + ENEMY_SIZE / 2;
                const cy = ey + ENEMY_SIZE / 2;
                const r = ENEMY_SIZE / 2 - 2;
                ctx.fillStyle = '#e03030';
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(cx - 5, cy - 4, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + 5, cy - 4, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d4a060';
                ctx.fillRect(cx - 5, cy + 2, 10, 10);
            }
        } else if (hasGoomba) {
            ctx.save();
            if (enemy.dir < 0) {
                ctx.scale(-1, 1);
                ctx.drawImage(sprites.goomba, -ex - ENEMY_SIZE, ey, ENEMY_SIZE, ENEMY_SIZE);
            } else {
                ctx.drawImage(sprites.goomba, ex, ey, ENEMY_SIZE, ENEMY_SIZE);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#a000a0';
            ctx.fillRect(ex, ey, ENEMY_SIZE, ENEMY_SIZE);
            ctx.fillStyle = '#fff';
            ctx.fillRect(ex + 6, ey + 8, 8, 8);
            ctx.fillRect(ex + 26, ey + 8, 8, 8);
            ctx.fillStyle = '#000';
            ctx.fillRect(ex + 8, ey + 10, 4, 4);
            ctx.fillRect(ex + 28, ey + 10, 4, 4);
        }
    });
}

// Render player
function renderPlayer() {
    const px = player.x - cameraX;
    const bob = (player.velX !== 0 && player.onGround) ? Math.sin(Date.now() / 120) * 2 : 0;
    const py = player.y + bob;
    const hasMario = spritesLoaded && spriteOk(sprites.mario);
    const hasJump = spritesLoaded && spriteOk(sprites.mariojump);
    const hasWalk = spritesLoaded && spriteOk(sprites.mariowalk);
    const hasDeath = spritesLoaded && spriteOk(sprites.mariodeath);

    let img = null;
    if (player.dead && hasDeath) {
        img = sprites.mariodeath;
    } else if (!player.onGround && hasJump) {
        img = sprites.mariojump;
    } else if (player.velX !== 0 && hasWalk) {
        img = sprites.mariowalk;
    } else if (hasMario) {
        img = sprites.mario;
    }

    if (img) {
        ctx.save();
        if (player.facing < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(img, -px - player.width, py, player.width, player.height);
        } else {
            ctx.drawImage(img, px, py, player.width, player.height);
        }
        ctx.restore();
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(px, py, player.width, player.height);
    }
}

// Render flag pole
function renderPoleAndFlag() {
    const px = pole.x - cameraX;
    const py = pole.y;
    if (spritesLoaded && spriteOk(sprites.pole)) {
        ctx.drawImage(sprites.pole, px, py, POLE_WIDTH, POLE_HEIGHT);
    } else {
        ctx.fillStyle = '#654321';
        ctx.fillRect(px, py, POLE_WIDTH, POLE_HEIGHT);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(px + POLE_WIDTH / 2, py, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Render victory overlay
function renderVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SCORE  ' + String(score).padStart(6, '0'), canvas.width / 2, canvas.height / 2);
    ctx.fillText('COINS  ' + coinCount, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('TIME   ' + timer, canvas.width / 2, canvas.height / 2 + 60);
    ctx.font = '18px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 100);
}

// Render game over overlay
function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SCORE  ' + String(score).padStart(6, '0'), canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('COINS  ' + coinCount, canvas.width / 2, canvas.height / 2 + 50);
    ctx.font = '16px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 90);
}

// Render coins (popped from blocks)
function renderCoins() {
    coins.forEach(c => {
        const cx = c.x - cameraX;
        const cy = c.y;
        if (spritesLoaded && spriteOk(sprites.coin)) {
            ctx.drawImage(sprites.coin, cx, cy, COIN_SIZE, COIN_SIZE);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(cx + COIN_SIZE / 2, cy + COIN_SIZE / 2, COIN_SIZE / 2 - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    });
}

// Render floating score texts
function renderFloatTexts() {
    floatTexts.forEach(ft => {
        const fx = ft.x - cameraX;
        ctx.fillStyle = `rgba(255, 255, 255, ${ft.alpha})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(ft.text, fx, ft.y);
    });
}

// Render score HUD
function renderHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText('MARIO  ' + String(score).padStart(6, '0') + '  COINS  ' + coinCount + '  TIME  ' + timer, canvas.width - 4, 4);
}

// Render SMB-style pixel-art clouds
function renderClouds() {
    clouds.forEach(cloud => {
        const pattern = cloudPatterns[cloud.pattern];
        const screenX = cloud.x - cameraX;
        const screenY = cloud.y;
        const cw = pattern.w * CLOUD_CELL;
        const ch = pattern.h * CLOUD_CELL;
        // Skip if completely off-screen
        if (screenX + cw < 0 || screenX > canvas.width) return;
        // Draw each cell of the pattern
        pattern.data.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if (!cell) return;
                const cx = screenX + colIdx * CLOUD_CELL;
                const cy = screenY + rowIdx * CLOUD_CELL;
                // Cloud fill (white)
                ctx.fillStyle = '#f8f8f8';
                ctx.fillRect(cx, cy, CLOUD_CELL, CLOUD_CELL);
                // Subtle border for pixel-art look
                ctx.strokeStyle = '#d0d0d0';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(cx, cy, CLOUD_CELL, CLOUD_CELL);
            });
        });
    });
}

// Render SMB-style pixel hills
function renderHills() {
    const groundY = canvas.height - 80;
    hills.forEach(hill => {
        const def = hillDefs[hill.pattern];
        const sx = hill.x - cameraX;
        const cw = def.w * HILL_CELL;
        const ch = def.h * HILL_CELL;
        if (sx + cw < 0 || sx > canvas.width) return;
        const bottomY = groundY;
        const topY = bottomY - ch;
        def.data.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if (!cell) return;
                const cx = sx + colIdx * HILL_CELL;
                const cy = topY + rowIdx * HILL_CELL;
                const colorIdx = rowIdx < 2 ? 0 : rowIdx < 4 ? 1 : 2;
                ctx.fillStyle = HILL_COLORS[colorIdx];
                ctx.fillRect(cx, cy, HILL_CELL, HILL_CELL);
                ctx.strokeStyle = '#004800';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(cx, cy, HILL_CELL, HILL_CELL);
            });
        });
    });
}

// Render SMB-style bushes
function renderBushes() {
    const groundY = canvas.height - 80;
    bushInstances.forEach(bush => {
        const pattern = cloudPatterns[bush.pattern];
        const sx = bush.x - cameraX;
        const cw = pattern.w * BUSH_CELL;
        const ch = pattern.h * BUSH_CELL;
        if (sx + cw < 0 || sx > canvas.width) return;
        const bottomY = groundY;
        const topY = bottomY - ch;
        pattern.data.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if (!cell) return;
                const cx = sx + colIdx * BUSH_CELL;
                const cy = topY + rowIdx * BUSH_CELL;
                const colorIdx = rowIdx < 2 ? 0 : 1;
                ctx.fillStyle = BUSH_COLORS[colorIdx];
                ctx.fillRect(cx, cy, BUSH_CELL, BUSH_CELL);
            });
        });
    });
}

// Main game loop
function gameLoop() {
    // Fill sky background
    ctx.fillStyle = SKY_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pole stand timer
    if (!gameWon && !player.dead) {
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkCollision(playerRect, pole)) {
            const now = Date.now();
            if (poleStandStart === 0) poleStandStart = now;
            if (now - poleStandStart >= POLE_STAND_TIME) {
                gameWon = true;
            }
        } else {
            poleStandStart = 0;
        }
    }

    // Timer countdown (1 tick per second)
    if (!player.dead && !gameWon) {
        const now = Date.now();
        if (lastTimerTick === 0) lastTimerTick = now;
        if (now - lastTimerTick >= 1000) {
            timer--;
            lastTimerTick = now;
            if (timer <= 0) {
                timer = 0;
                player.dead = true;
                player.velX = 0;
                player.velY = DEATH_JUMP;
            }
        }
    }

    // Update game state
    if (!player.dead) {
        updateBlocks();
        updateCoins();
        updateEnemies();
    }
    updateFloatTexts();
    updatePlayer();

    // Render
    renderClouds();
    renderHills();
    renderBushes();
    renderBlocks();
    renderCoins();
    renderEnemies();
    renderPoleAndFlag();
    renderPlayer();
    renderFloatTexts();
    renderHUD();

    // Victory overlay
    if (gameWon) {
        renderVictory();
    }

    // Game over overlay
    if (gameOver) {
        renderGameOver();
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);