class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a15');

        // ===== Animated atmospheric background =====
        for (let i = 0; i < 8; i++) {
            const fog = this.add.circle(
                Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                Phaser.Math.Between(40, 100), 0x1a1a2e, 0.15
            );
            this.tweens.add({
                targets: fog, x: fog.x + Phaser.Math.Between(-100, 100),
                y: fog.y + Phaser.Math.Between(-50, 50),
                alpha: { from: 0.05, to: 0.2 },
                duration: Phaser.Math.Between(4000, 8000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // Floating embers
        for (let i = 0; i < 40; i++) {
            const px = Phaser.Math.Between(0, width);
            const py = Phaser.Math.Between(height + 20, height + 200);
            const isEmber = Math.random() > 0.5;
            const dot = this.add.circle(px, py, Phaser.Math.Between(1, 3),
                isEmber ? 0xff6633 : 0xe94560, isEmber ? 0.6 : 0.4);
            this.tweens.add({
                targets: dot, y: -20, x: dot.x + Phaser.Math.Between(-80, 80), alpha: 0,
                duration: Phaser.Math.Between(3000, 7000), repeat: -1,
                delay: Phaser.Math.Between(0, 3000), ease: 'Sine.easeOut'
            });
        }

        // Silhouette zombies
        for (let i = 0; i < 5; i++) {
            const sz = this.add.circle(-30 - i * 60,
                height - 50 + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(6, 12), 0x331122, 0.4);
            this.tweens.add({
                targets: sz, x: width + 30,
                duration: Phaser.Math.Between(15000, 25000), repeat: -1,
                delay: Phaser.Math.Between(0, 5000)
            });
        }

        // ===== Title =====
        const titleGlow = this.add.text(width / 2, height / 2 - 120, 'ZOMBIE KILLER\nARENA', {
            fontFamily: 'monospace', fontSize: '50px', color: '#e94560', fontStyle: 'bold',
            align: 'center', lineSpacing: 10, stroke: '#e94560', strokeThickness: 12
        }).setOrigin(0.5).setAlpha(0.15);

        const title = this.add.text(width / 2, height / 2 - 120, 'ZOMBIE KILLER\nARENA', {
            fontFamily: 'monospace', fontSize: '50px', color: '#e94560', fontStyle: 'bold',
            align: 'center', lineSpacing: 10, stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({ targets: [title, titleGlow], scaleX: 1.03, scaleY: 1.03, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: titleGlow, alpha: { from: 0.1, to: 0.25 }, duration: 1500, yoyo: true, repeat: -1 });

        this.add.text(width / 2, height / 2 - 40, '— Arcade Zombie Shooter —', {
            fontFamily: 'monospace', fontSize: '13px', color: '#555577'
        }).setOrigin(0.5);

        // ===== Meta stats =====
        const meta = JSON.parse(localStorage.getItem('zombieArena_meta') || '{}');
        const highScore = meta.highScore || localStorage.getItem('zombieArena_highScore') || 0;
        const totalCoins = meta.coins || 0;
        const highestLevel = meta.highestLevel || 1;

        if (highScore > 0) {
            this.add.text(width / 2, height / 2 - 10, `★ HIGH SCORE: ${highScore}  •  💰 ${totalCoins}  •  📊 Stage ${Math.ceil(highestLevel / 4)}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffdd57'
            }).setOrigin(0.5);
        }

        // ===== PLAY button → Level Select =====
        const btnBg = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x222244, 0.8)
            .setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height / 2 + 50, 200, 50).setStrokeStyle(2, 0x00ff88, 0.6);
        const playBtn = this.add.text(width / 2, height / 2 + 50, '▶  SELECT STAGE', {
            fontFamily: 'monospace', fontSize: '18px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: [btnBg, playBtn], scaleX: 1.05, scaleY: 1.05, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0x334466, 1); playBtn.setColor('#aaffcc'); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(0x222244, 0.8); playBtn.setColor('#00ff88'); });
        btnBg.on('pointerdown', () => {
            if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') window.gameAudioCtx.resume();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start('LevelSelectScene'));
        });

        // ===== Quick Play button (start from level 1) =====
        const qpBg = this.add.rectangle(width / 2, height / 2 + 105, 160, 36, 0x333355, 0.6)
            .setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height / 2 + 105, 160, 36).setStrokeStyle(1, 0x555577, 0.4);
        const qpText = this.add.text(width / 2, height / 2 + 105, '⚡ QUICK PLAY', {
            fontFamily: 'monospace', fontSize: '14px', color: '#aaaacc'
        }).setOrigin(0.5);

        qpBg.on('pointerover', () => { qpBg.setFillStyle(0x444466, 1); qpText.setColor('#ffffff'); });
        qpBg.on('pointerout', () => { qpBg.setFillStyle(0x333355, 0.6); qpText.setColor('#aaaacc'); });
        qpBg.on('pointerdown', () => {
            if (window.gameAudioCtx && window.gameAudioCtx.state === 'suspended') window.gameAudioCtx.resume();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            // Quick play starts from level 1 with full level data (30 levels)
            const stageNames = ['street', 'sewer', 'outskirts', 'factory', 'graveyard', 'inferno'];
            const groundColors = [0x1a1a2e, 0x151a22, 0x2a2218, 0x221a1a, 0x1a2e1a, 0x2e1a1a];
            const fogTints = [0x334455, 0x223344, 0x443322, 0x443333, 0x224433, 0x442222];
            const modifiers = [null, 'fog', null, 'darkness', null, 'fire'];
            const bossNames = ['The Butcher', 'Sewer Lord', 'The Warden', 'Iron Reaper', 'Grave King', 'Inferno Titan'];
            const levels = [];
            for (let i = 1; i <= 30; i++) {
                const stage = Math.ceil(i / 5);
                const isBoss = i % 5 === 0;
                const enemyHP = 25 + i * 3;
                const enemySpeed = 40 + i * 1.5;
                const enemyPool = ['normal'];
                if (i >= 3) enemyPool.push('runner');
                if (i >= 6) enemyPool.push('tank');
                levels.push({
                    level: i, stage: stage, theme: stageNames[stage - 1],
                    modifier: modifiers[stage - 1],
                    isBoss: isBoss, killTarget: isBoss ? 1 : Math.min(60, 15 + i * 3),
                    enemyHP: enemyHP, enemySpeed: enemySpeed,
                    enemyHPMult: enemyHP / 50, enemySpeedMult: enemySpeed / 80,
                    spawnRate: Math.max(600, 1800 - i * 40),
                    maxEnemies: Math.min(25, 8 + Math.floor(i / 3)),
                    bossHP: isBoss ? 600 + i * 120 : 0,
                    bossName: isBoss ? bossNames[stage - 1] : null,
                    enemyPool: enemyPool,
                    groundColor: groundColors[stage - 1],
                    fogTint: fogTints[stage - 1],
                });
            }
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { startLevel: 1, levelData: levels });
                this.scene.start('UIScene');
            });
        });

        // ===== Tutorial Button =====
        const tutBg = this.add.rectangle(width / 2, height / 2 + 155, 160, 36, 0x333344, 0.6).setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height / 2 + 155, 160, 36).setStrokeStyle(1, 0x00d4ff, 0.5);
        this.add.text(width / 2, height / 2 + 155, 'HOW TO PLAY', {
            fontFamily: 'monospace', fontSize: '14px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        tutBg.on('pointerover', () => tutBg.setFillStyle(0x444455, 0.8));
        tutBg.on('pointerout', () => tutBg.setFillStyle(0x333344, 0.6));
        tutBg.on('pointerdown', () => this.scene.start('TutorialScene'));

        // ===== Controls =====
        const isMobile = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
        const controlsText = isMobile
            ? 'Joystick to move  •  Buttons to shoot & dash'
            : 'WASD Move • HOLD Click Auto-Fire • F Auto-Aim • SPACE Dash • 1-5 Weapons';
        this.add.text(width / 2, height - 40, controlsText, {
            fontFamily: 'monospace', fontSize: '10px', color: '#333355', align: 'center'
        }).setOrigin(0.5);
        this.add.text(width / 2, height - 20, '♠ Survive 30 levels of zombie carnage ♠', {
            fontFamily: 'monospace', fontSize: '10px', color: '#442233'
        }).setOrigin(0.5);
    }
}

class TutorialScene extends Phaser.Scene {
    constructor() { super({ key: 'TutorialScene' }); }
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a15');

        // Title
        this.add.text(width / 2, 50, 'GAME GUIDE', {
            fontFamily: 'monospace', fontSize: '32px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Sections
        const leftX = width * 0.25;
        const rightX = width * 0.75;
        let y = 120;

        // Visual Mechanics
        this.add.text(leftX, y, 'CONTROLS', { fontSize: '20px', color: '#ffdd57', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(rightX, y, 'MECHANICS', { fontSize: '20px', color: '#ffdd57', fontStyle: 'bold' }).setOrigin(0.5);

        y += 40;
        this.add.text(leftX, y, 'WASD: Move Character\nSPACE: Dash (Cooldown)\n1-5: Switch Weapon\nF: Toggle Auto-Aim', {
            fontSize: '14px', color: '#ccccdd', align: 'center', lineSpacing: 8
        }).setOrigin(0.5, 0);

        this.add.text(rightX, y, 'Auto-Aim: Shoots nearest\nAuto-Fire: Hold Click\nCombo: Kill fast for XP\nSynergies: Collect pairs', {
            fontSize: '14px', color: '#ccccdd', align: 'center', lineSpacing: 8
        }).setOrigin(0.5, 0);

        y += 140;

        // Weapons
        this.add.text(width / 2, y, 'WEAPONS & POWERUPS', { fontSize: '20px', color: '#ffdd57', fontStyle: 'bold' }).setOrigin(0.5);
        y += 40;

        // Weapon Visuals
        const wY = y;
        const weapons = [
            { key: 'weapon_pistol', label: 'PISTOL', x: 0.2 },
            { key: 'weapon_shotgun', label: 'SHOTGUN', x: 0.35 },
            { key: 'weapon_smg', label: 'SMG', x: 0.5 },
            { key: 'weapon_ar', label: 'RIFLE', x: 0.65 },
            { key: 'weapon_sniper', label: 'SNIPER', x: 0.8 }
        ];

        weapons.forEach(w => {
            const cx = width * w.x;
            this.add.circle(cx, wY - 20, 24, 0x222233).setStrokeStyle(1, 0x00d4ff, 0.3);
            this.add.image(cx, wY - 20, w.key).setScale(2.5);
            this.add.text(cx, wY + 14, w.label, { fontSize: '10px', color: '#aaaaaa' }).setOrigin(0.5);
        });

        y += 50;
        this.add.text(width / 2, y, 'Collect Blue Orbs for XP • Break Crates for Health/Ammo', {
            fontSize: '14px', color: '#00ff88'
        }).setOrigin(0.5);

        // Back Button
        const backBg = this.add.rectangle(width / 2, height - 60, 200, 50, 0x222244, 0.8).setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height - 60, 200, 50).setStrokeStyle(2, 0xff4444, 0.5);
        this.add.text(width / 2, height - 60, 'BACK TO MENU', { fontSize: '18px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);

        backBg.on('pointerdown', () => this.scene.start('StartScene'));
        backBg.on('pointerover', () => backBg.setFillStyle(0x333355));
        backBg.on('pointerout', () => backBg.setFillStyle(0x222244));
    }
}
