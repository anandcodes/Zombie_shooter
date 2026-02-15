class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a15');

        // Load meta progress
        this.metaData = JSON.parse(localStorage.getItem('zombieArena_meta') || '{}');
        const highestLevel = this.metaData.highestLevel || 1;
        const totalCoins = this.metaData.coins || 0;

        // Title
        this.add.text(width / 2, 25, 'SELECT STAGE', {
            fontFamily: 'monospace', fontSize: '24px', color: '#e94560', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // Coins display
        this.add.text(width - 20, 25, `💰 ${totalCoins}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd57', fontStyle: 'bold'
        }).setOrigin(1, 0.5);

        // Level definitions — 6 stages × 5 levels each = 30 levels
        this.levelData = this.getLevelData();

        // Stage themed names & colors
        const stageNames = ['ABANDONED STREETS', 'DARK SEWERS', 'THE OUTSKIRTS', 'RUINED FACTORY', 'GRAVEYARD', 'INFERNO'];
        const stageColors = ['#88aacc', '#77aa99', '#ccaa77', '#aa8877', '#77cc88', '#ff6644'];

        // Scrollable area — use a camera offset
        this.scrollY = 0;
        const maxScroll = Math.max(0, 6 * 95 + 60 - (height - 100));

        // Create level grid
        const startY = 55;
        const stageHeight = 95;

        this.cardContainer = this.add.container(0, 0);

        for (let stage = 0; stage < 6; stage++) {
            const sy = startY + stage * stageHeight;

            // Stage label
            this.cardContainer.add(this.add.text(25, sy, `STAGE ${stage + 1}: ${stageNames[stage]}`, {
                fontFamily: 'monospace', fontSize: '11px', color: stageColors[stage], fontStyle: 'bold'
            }));

            // Divider
            this.cardContainer.add(this.add.rectangle(width / 2, sy + 16, width - 30, 1, 0x333355, 0.3));

            for (let lvl = 0; lvl < 5; lvl++) {
                const levelNum = stage * 5 + lvl + 1;
                // Center the grid: (width - approx 725) / 2 + card_center_offset
                const x = (width - 725) / 2 + lvl * 145 + 72;
                const y = sy + 48;
                const isUnlocked = levelNum <= highestLevel;
                const isBoss = lvl === 4;
                const isCompleted = levelNum < highestLevel;

                // Card bg
                const bgColor = isBoss ? 0x441122 : 0x222244;
                const card = this.add.rectangle(x, y, 130, 42, bgColor, isUnlocked ? 0.9 : 0.3)
                    .setInteractive(isUnlocked ? { useHandCursor: true } : {});
                this.cardContainer.add(card);

                const borderColor = isCompleted ? 0x00ff88 : (isUnlocked ? (isBoss ? 0xe94560 : 0x00d4ff) : 0x333355);
                const border = this.add.rectangle(x, y, 130, 42).setStrokeStyle(2, borderColor, 0.6);
                this.cardContainer.add(border);

                // Level text
                const labelText = isBoss ? `👹 BOSS ${stage + 1}` : `Level ${levelNum}`;
                const label = this.add.text(x, y - 6, labelText, {
                    fontFamily: 'monospace', fontSize: '11px',
                    color: isUnlocked ? '#ffffff' : '#555555', fontStyle: 'bold'
                }).setOrigin(0.5);
                this.cardContainer.add(label);

                // Sub-info
                if (isUnlocked) {
                    const ld = this.levelData[levelNum - 1];
                    const info = isBoss ? 'Defeat the boss' : `Kill ${ld.killTarget} zombies`;
                    this.cardContainer.add(this.add.text(x, y + 10, info, {
                        fontFamily: 'monospace', fontSize: '8px', color: '#888888'
                    }).setOrigin(0.5));
                }

                // Completed checkmark
                if (isCompleted) {
                    this.cardContainer.add(this.add.text(x + 52, y - 16, '✓', {
                        fontFamily: 'monospace', fontSize: '12px', color: '#00ff88', fontStyle: 'bold'
                    }).setOrigin(0.5));
                }

                // Lock icon
                if (!isUnlocked) {
                    this.cardContainer.add(this.add.text(x, y, '🔒', { fontSize: '14px' }).setOrigin(0.5).setAlpha(0.4));
                }

                // Click handler
                if (isUnlocked) {
                    card.on('pointerover', () => {
                        card.setFillStyle(isBoss ? 0x662244 : 0x334488, 1);
                        border.setStrokeStyle(2, borderColor, 1);
                    });
                    card.on('pointerout', () => {
                        card.setFillStyle(bgColor, 0.9);
                        border.setStrokeStyle(2, borderColor, 0.6);
                    });
                    card.on('pointerdown', () => {
                        this.startLevel(levelNum);
                    });
                }
            }
        }

        // Scroll handling via mouse wheel
        this.input.on('wheel', (pointer, gos, dx, dy) => {
            this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, maxScroll);
            this.cardContainer.y = -this.scrollY;
        });

        // Touch drag scroll
        let lastDragY = 0;
        this.input.on('pointerdown', (p) => { lastDragY = p.y; });
        this.input.on('pointermove', (p) => {
            if (p.isDown && p.y < height - 55) {
                const dy = lastDragY - p.y;
                this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, 0, maxScroll);
                this.cardContainer.y = -this.scrollY;
                lastDragY = p.y;
            }
        });

        // Scroll indicator
        if (maxScroll > 0) {
            this.add.text(width / 2, height - 65, '↕ Scroll for more stages', {
                fontFamily: 'monospace', fontSize: '9px', color: '#555577'
            }).setOrigin(0.5).setDepth(10);
        }

        // Bottom buttons (fixed, not scrollable)
        const btnBar = this.add.rectangle(width / 2, height - 28, width, 56, 0x0a0a15, 0.95).setDepth(9);

        const backBtn = this.add.rectangle(100, height - 28, 140, 32, 0x333355, 0.8)
            .setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.rectangle(100, height - 28, 140, 32).setStrokeStyle(1, 0x555577, 0.4).setDepth(10);
        this.add.text(100, height - 28, '← BACK', {
            fontFamily: 'monospace', fontSize: '13px', color: '#aaaacc', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        backBtn.on('pointerdown', () => this.scene.start('StartScene'));

        const shopBtn = this.add.rectangle(width / 2, height - 28, 160, 32, 0x332200, 0.8)
            .setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.rectangle(width / 2, height - 28, 160, 32).setStrokeStyle(1, 0xffaa33, 0.4).setDepth(10);
        this.add.text(width / 2, height - 28, '🛒 UPGRADES', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffaa33', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        shopBtn.on('pointerdown', () => this.scene.start('UpgradeShopScene'));

        const lbBtn = this.add.rectangle(width - 100, height - 28, 140, 32, 0x222244, 0.8)
            .setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.rectangle(width - 100, height - 28, 140, 32).setStrokeStyle(1, 0x00d4ff, 0.4).setDepth(10);
        this.add.text(width - 100, height - 28, '🏆 SCORES', {
            fontFamily: 'monospace', fontSize: '12px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        lbBtn.on('pointerdown', () => this.scene.start('LeaderboardScene'));
    }

    getLevelData() {
        const levels = [];
        const stageNames = ['street', 'sewer', 'outskirts', 'factory', 'graveyard', 'inferno'];
        const modifiers = [null, 'fog', null, 'darkness', null, 'fire'];
        const groundColors = [0x1a1a2e, 0x151a22, 0x2a2218, 0x221a1a, 0x1a2e1a, 0x2e1a1a];
        const fogTints = [0x334455, 0x223344, 0x443322, 0x443333, 0x224433, 0x442222];

        for (let i = 1; i <= 30; i++) {
            const stage = Math.ceil(i / 5);
            const isBoss = i % 5 === 0;

            // Readme formulas
            const enemyHP = 25 + i * 3;
            const enemySpeed = 40 + i * 1.5;
            const spawnRate = Math.max(600, 1800 - i * 40);
            const maxEnemies = Math.min(25, 8 + Math.floor(i / 3));
            const bossHP = isBoss ? 600 + i * 120 : 0;
            const killTarget = isBoss ? 1 : Math.min(60, 15 + i * 3);

            // Enemy pool expands with levels
            const enemyPool = ['normal'];
            if (i >= 3) enemyPool.push('runner');
            if (i >= 6) enemyPool.push('tank');
            if (i >= 15) enemyPool.push('tank'); // more tanks in late game

            levels.push({
                level: i,
                stage: stage,
                theme: stageNames[stage - 1],
                modifier: modifiers[stage - 1],
                isBoss: isBoss,
                killTarget: killTarget,
                enemyHP: enemyHP,
                enemySpeed: enemySpeed,
                enemyHPMult: enemyHP / 50, // for compatibility
                enemySpeedMult: enemySpeed / 80,
                spawnRate: spawnRate,
                maxEnemies: maxEnemies,
                bossHP: bossHP,
                bossName: isBoss ? this.getBossName(stage) : null,
                enemyPool: enemyPool,
                groundColor: groundColors[stage - 1],
                fogTint: fogTints[stage - 1],
            });
        }
        return levels;
    }

    getBossName(stage) {
        const names = [
            'The Butcher', 'Sewer Lord', 'The Warden',
            'Iron Reaper', 'Grave King', 'Inferno Titan'
        ];
        return names[stage - 1] || `Boss ${stage}`;
    }

    startLevel(levelNum) {
        if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') window.gameAudioCtx.resume();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
            this.scene.start('GameScene', { startLevel: levelNum, levelData: this.getLevelData() });
            this.scene.start('UIScene');
        });
    }
}
