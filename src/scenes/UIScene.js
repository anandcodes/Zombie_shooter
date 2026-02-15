class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.scene.bringToTop();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // ===== Health Bar =====
        this.healthBarBg = this.add.rectangle(20, 20, 200, 18, 0x333355).setOrigin(0, 0).setDepth(100);
        this.healthBar = this.add.rectangle(22, 22, 196, 14, 0xe94560).setOrigin(0, 0).setDepth(101);
        this.healthLabel = this.add.text(22, 6, 'HP', {
            fontFamily: 'monospace', fontSize: '12px', color: '#e94560', fontStyle: 'bold'
        }).setDepth(101);
        this.healthText = this.add.text(120, 22, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(102);

        // ===== XP Bar =====
        this.xpBarBg = this.add.rectangle(20, 46, 200, 12, 0x333355).setOrigin(0, 0).setDepth(100);
        this.xpBar = this.add.rectangle(22, 48, 0, 8, 0x00d4ff).setOrigin(0, 0).setDepth(101);
        this.xpLabel = this.add.text(22, 38, 'XP', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00d4ff'
        }).setDepth(101);

        // ===== Level Display =====
        this.levelText = this.add.text(230, 20, 'LVL 1', {
            fontFamily: 'monospace', fontSize: '20px', color: '#00ff88', fontStyle: 'bold'
        }).setDepth(101);

        // ===== Score Display =====
        this.scoreText = this.add.text(width - 20, 20, 'SCORE: 0', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ffdd57', fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(101);

        // ===== Phase 3: Stage/Level Indicator =====
        this.stageText = this.add.text(width / 2, 18, 'STAGE 1-1', {
            fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(101);

        // ===== Phase 3: Kill Progress Bar =====
        this.killBarBg = this.add.rectangle(width / 2 - 100, 40, 200, 8, 0x333355).setOrigin(0, 0).setDepth(100);
        this.killBar = this.add.rectangle(width / 2 - 98, 42, 0, 4, 0xe94560).setOrigin(0, 0).setDepth(101);
        this.killText = this.add.text(width / 2, 50, '0 / 30', {
            fontFamily: 'monospace', fontSize: '9px', color: '#888888'
        }).setOrigin(0.5, 0).setDepth(101);

        // ===== Phase 3: Boss Health Bar =====
        this.bossBarContainer = this.add.container(width / 2, 75).setDepth(201).setAlpha(0);
        this.bossBarBg = this.add.rectangle(0, 0, 300, 14, 0x333355);
        this.bossBarFill = this.add.rectangle(-149, 0, 298, 10, 0xff2200).setOrigin(0, 0.5);
        this.bossNameText = this.add.text(0, -14, 'BOSS', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.bossBarContainer.add([this.bossBarBg, this.bossBarFill, this.bossNameText]);

        // ===== Weapon Display =====
        this.weaponBg = this.add.rectangle(20, height - 50, 180, 36, 0x222244, 0.8).setOrigin(0, 0).setDepth(100);
        this.weaponText = this.add.text(30, height - 42, '🔫 Pistol', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setDepth(101);
        this.ammoText = this.add.text(190, height - 42, '∞', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd57', fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(101);

        // ===== Dash Cooldown =====
        this.dashBg = this.add.rectangle(20, height - 80, 80, 20, 0x333355).setOrigin(0, 0).setDepth(100);
        this.dashBar = this.add.rectangle(22, height - 78, 76, 16, 0x00ff88).setOrigin(0, 0).setDepth(101);
        this.dashLabel = this.add.text(22, height - 94, 'DASH', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00ff88'
        }).setDepth(101);

        // ===== Mute indicator =====
        this.muteText = this.add.text(width - 50, height - 20, '🔊', {
            fontSize: '18px'
        }).setOrigin(1, 1).setDepth(101).setInteractive({ useHandCursor: true });

        this.muteText.on('pointerdown', () => {
            this.game.sound.mute = !this.game.sound.mute;
            this.muteText.setText(this.game.sound.mute ? '🔇' : '🔊');
        });

        // ===== Fullscreen Button =====
        this.fullscreenBtn = this.add.text(width - 20, height - 20, '🖥️', {
            fontSize: '18px'
        }).setOrigin(1, 1).setDepth(101).setInteractive({ useHandCursor: true });

        this.fullscreenBtn.on('pointerdown', () => {
            if (this.scale.isFullscreen) { this.scale.stopFullscreen(); }
            else { this.scale.startFullscreen(); }
        });

        // ===== Phase 2: Combo Display =====
        this.comboContainer = this.add.container(width - 110, 70).setDepth(201).setAlpha(0);
        this.comboBg = this.add.rectangle(0, 0, 120, 28, 0x000000, 0.5);
        this.comboText = this.add.text(0, -4, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff8800', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.comboMultText = this.add.text(0, 12, '', {
            fontFamily: 'monospace', fontSize: '9px', color: '#ffaa44'
        }).setOrigin(0.5);
        this.comboContainer.add([this.comboBg, this.comboText, this.comboMultText]);

        // ===== Phase 2: Active Power Display =====
        this.powerContainer = this.add.container(width - 20, 105).setDepth(201).setAlpha(0);
        this.powerBg = this.add.rectangle(0, 0, 140, 24, 0x000000, 0.6).setOrigin(1, 0.5);
        this.powerText = this.add.text(-70, 0, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.powerTimerBar = this.add.rectangle(-140, 12, 140, 3, 0xffffff, 0.3).setOrigin(0, 0.5);
        this.powerTimerFill = this.add.rectangle(-140, 12, 140, 3, 0x00ff88).setOrigin(0, 0.5);
        this.powerContainer.add([this.powerBg, this.powerText, this.powerTimerBar, this.powerTimerFill]);

        // ===== Phase 2: Arena Event Banner =====
        this.arenaBanner = this.add.text(width / 2, 95, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(201).setAlpha(0);

        // ===== Phase 2: Synergy Display =====
        this.synergyTexts = [];

        // ===== Announcement text =====
        this.announcement = this.add.text(width / 2, height / 2 - 60, '', {
            fontFamily: 'monospace', fontSize: '48px', color: '#e94560', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(200).setAlpha(0);

        // ===== Phase 3: Stage Clear Overlay =====
        this.stageClearContainer = this.add.container(0, 0).setDepth(350).setVisible(false);

        // ===== Upgrade Menu =====
        this.upgradeContainer = this.add.container(0, 0).setDepth(400).setVisible(false);
        this.createUpgradeMenu(width, height);

        // ===== Pause Overlay =====
        this.pauseOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
            .setDepth(350).setVisible(false);
        this.pauseText = this.add.text(width / 2, height / 2, 'PAUSED\n\nPress P to resume', {
            fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            align: 'center', lineSpacing: 10
        }).setOrigin(0.5).setDepth(351).setVisible(false);

        // ===== Game Over Overlay =====
        this.gameOverOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setDepth(300).setVisible(false);
        this.gameOverTitle = this.add.text(width / 2, height / 2 - 130, 'GAME OVER', {
            fontFamily: 'monospace', fontSize: '48px', color: '#e94560', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(301).setVisible(false);
        this.gameOverStats = this.add.text(width / 2, height / 2 - 10, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            align: 'center', lineSpacing: 6
        }).setOrigin(0.5).setDepth(301).setVisible(false);

        // Phase 3 game over buttons
        this.restartBtn = this.createMenuButton(width / 2, height / 2 + 100, '🏠 MAIN MENU', '#00ff88', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('StartScene');
        });
        this.menuBtn = this.createMenuButton(width / 2, height / 2 + 145, '📋 STAGES', '#00d4ff', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('LevelSelectScene');
        });
        this.shopBtn = this.createMenuButton(width / 2, height / 2 + 190, '🛒 UPGRADE SHOP', '#ffaa33', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('UpgradeShopScene');
        });

        // ===== Controls hint =====
        this.controlsHint = this.add.text(width / 2, height - 12, 'WASD Move • HOLD Left Click Auto-Fire • SPACE Dash • 1-5 Weapons • P Pause • M Mute', {
            fontFamily: 'monospace', fontSize: '10px', color: '#444466'
        }).setOrigin(0.5).setDepth(101);

        this.time.delayedCall(8000, () => {
            this.tweens.add({ targets: this.controlsHint, alpha: 0, duration: 1000 });
        });

        // ===== Listen to GameScene events =====
        const gameScene = this.scene.get('GameScene');

        gameScene.events.on('updateUI', (data) => this.updateHUD(data));
        gameScene.events.on('levelUp', (level) => this.showLevelUpEffect(level));
        gameScene.events.on('gameOver', (data) => this.showGameOverScreen(data));
        gameScene.events.on('showUpgrades', (choices) => this.showUpgradeMenu(choices));
        gameScene.events.on('hideUpgrades', () => this.hideUpgradeMenu());
        gameScene.events.on('pauseToggle', (paused) => this.togglePauseOverlay(paused));
        gameScene.events.on('muteToggle', (enabled) => {
            this.muteText.setText(enabled ? '🔊' : '🔇');
        });

        // Phase 2 events
        gameScene.events.on('comboUpdate', (data) => this.updateCombo(data));
        gameScene.events.on('comboEnd', () => this.hideCombo());
        gameScene.events.on('powerActivated', (type) => this.showPower(type));
        gameScene.events.on('powerDeactivated', () => this.hidePower());
        gameScene.events.on('synergyActivated', (syn) => this.showSynergyNotification(syn));
        gameScene.events.on('arenaEvent', (data) => this.showArenaEvent(data));
        gameScene.events.on('arenaEventEnd', () => this.hideArenaEvent());

        // Phase 3 events
        gameScene.events.on('levelStart', (data) => this.showLevelStart(data));
        gameScene.events.on('stageClear', (data) => this.showStageClear(data));
        gameScene.events.on('bossSpawn', (data) => this.showBossSpawn(data));
        gameScene.events.on('victory', (data) => this.showVictoryScreen(data));
    }

    createMenuButton(x, y, text, color, callback) {
        const bg = this.add.rectangle(x, y, 200, 32, 0x222244, 0.9)
            .setInteractive({ useHandCursor: true }).setDepth(302).setVisible(false);
        this.add.rectangle(x, y, 200, 32).setStrokeStyle(1,
            Phaser.Display.Color.HexStringToColor(color).color, 0.4).setDepth(302).setVisible(false);
        const label = this.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: '13px', color: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(303).setVisible(false);
        bg.on('pointerover', () => bg.setFillStyle(0x334466, 1));
        bg.on('pointerout', () => bg.setFillStyle(0x222244, 0.9));
        bg.on('pointerdown', callback);
        return { bg, label, border: bg }; // Simplified
    }

    // ===== Phase 3: Level Start Announcement =====
    showLevelStart(data) {
        const stageNum = Math.ceil(data.level / 5);
        const subLevel = ((data.level - 1) % 5) + 1;
        const text = data.isBoss ? `👹 BOSS FIGHT — STAGE ${stageNum}` : `STAGE ${stageNum}-${subLevel}`;
        this.stageText.setText(`STAGE ${stageNum}-${subLevel}`);
        this.announcement.setText(text);
        this.announcement.setColor(data.isBoss ? '#ff4444' : '#00d4ff');
        this.announcement.setAlpha(1).setScale(0.5);
        this.tweens.add({
            targets: this.announcement, scale: 1, duration: 400, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({ targets: this.announcement, alpha: 0, delay: 1200, duration: 500 });
            }
        });
    }

    // ===== Phase 3: Stage Clear Screen =====
    showStageClear(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.stageClearContainer.removeAll(true);
        this.stageClearContainer.setVisible(true);

        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
        const title = this.add.text(width / 2, height / 2 - 60,
            data.isBoss ? '👹 BOSS DEFEATED!' : '★ STAGE CLEAR ★', {
            fontFamily: 'monospace', fontSize: '36px',
            color: data.isBoss ? '#ff4444' : '#00ff88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        const stats = this.add.text(width / 2, height / 2 + 10,
            `Score Bonus: +${data.bonusScore}\nCoins Earned: +${data.bonusCoins} 💰\nTotal Score: ${data.totalScore}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', align: 'center', lineSpacing: 6
        }).setOrigin(0.5).setAlpha(0);

        const nextBtn = this.add.text(width / 2, height / 2 + 130, 'NEXT LEVEL >>', {
            fontFamily: 'monospace', fontSize: '18px', color: '#00ff88',
            backgroundColor: '#004422', padding: { x: 10, y: 5 }, fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        const menuBtn = this.add.text(width / 2 - 120, height / 2 + 130, '🏠 HOME', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#222244', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        const upgradeBtn = this.add.text(width / 2 + 120, height / 2 + 130, '🛒 UPGRADES', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffaa33',
            backgroundColor: '#332200', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        nextBtn.on('pointerdown', () => {
            // Animate out
            this.tweens.add({
                targets: this.stageClearContainer, alpha: 0, duration: 200,
                onComplete: () => {
                    this.stageClearContainer.setVisible(false).setAlpha(1);
                    const gameScene = this.scene.get('GameScene');
                    if (gameScene) gameScene.events.emit('nextLevel');
                }
            });
        });

        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('StartScene');
        });

        upgradeBtn.on('pointerdown', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('UpgradeShopScene');
        });

        nextBtn.on('pointerover', () => nextBtn.setBackgroundColor('#006633'));
        nextBtn.on('pointerout', () => nextBtn.setBackgroundColor('#004422'));
        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor('#333355'));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#222244'));
        upgradeBtn.on('pointerover', () => upgradeBtn.setBackgroundColor('#443300'));
        upgradeBtn.on('pointerout', () => upgradeBtn.setBackgroundColor('#332200'));

        this.stageClearContainer.add([bg, title, stats, nextBtn, menuBtn, upgradeBtn]);

        this.tweens.add({
            targets: title, alpha: 1, scaleX: 1.1, scaleY: 1.1, duration: 400, ease: 'Back.easeOut',
            onComplete: () => { this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 200 }); }
        });
        this.tweens.add({ targets: stats, alpha: 1, duration: 400, delay: 500 });
        this.tweens.add({ targets: [nextBtn, menuBtn, upgradeBtn], alpha: 1, duration: 400, delay: 1000 });

        // Removed auto-hide timer to wait for user input
    }

    // ===== Phase 3: Boss Health Bar =====
    showBossSpawn(data) {
        this.bossNameText.setText(data.name);
        this.bossBarContainer.setAlpha(0);
        this.tweens.add({ targets: this.bossBarContainer, alpha: 1, duration: 500 });
    }

    // ===== Phase 3: Victory Screen =====
    showVictoryScreen(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(400);
        const title = this.add.text(width / 2, height / 2 - 120, '🏆 VICTORY! 🏆', {
            fontFamily: 'monospace', fontSize: '48px', color: '#ffdd57', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(401);

        const stats = this.add.text(width / 2, height / 2 + 10,
            `Final Score: ${data.score}\n` +
            `Levels Completed: ${data.levelsCompleted}\n` +
            `Bosses Defeated: ${data.bossesDefeated}\n` +
            `Coins Earned: ${data.totalCoins} 💰\n\n` +
            `Congratulations! You survived all 30 levels!`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', align: 'center', lineSpacing: 8
        }).setOrigin(0.5).setDepth(401);

        const menuBtn = this.add.rectangle(width / 2, height / 2 + 140, 200, 40, 0x222244, 0.9)
            .setInteractive({ useHandCursor: true }).setDepth(402);
        this.add.text(width / 2, height / 2 + 140, '← MAIN MENU', {
            fontFamily: 'monospace', fontSize: '16px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(403);
        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('StartScene');
        });

        // Celebratory effects
        overlay.setAlpha(0); title.setAlpha(0); stats.setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 0.8, duration: 500 });
        this.tweens.add({ targets: title, alpha: 1, scaleY: { from: 0.3, to: 1 }, duration: 600, delay: 300, ease: 'Back.easeOut' });
        this.tweens.add({ targets: stats, alpha: 1, duration: 500, delay: 700 });
    }

    // ===== Phase 2: Combo UI =====
    updateCombo(data) {
        this.comboContainer.setAlpha(1);
        this.comboText.setText(`COMBO x${data.count}`);
        this.comboMultText.setText(`${data.multiplier.toFixed(1)}x SCORE`);
        this.comboContainer.setScale(1.3);
        this.tweens.add({ targets: this.comboContainer, scaleX: 1, scaleY: 1, duration: 150 });
        if (data.count >= 20) this.comboText.setColor('#ff0000');
        else if (data.count >= 10) this.comboText.setColor('#ff4400');
        else if (data.count >= 5) this.comboText.setColor('#ff8800');
        else this.comboText.setColor('#ffaa44');
    }

    hideCombo() {
        this.tweens.add({ targets: this.comboContainer, alpha: 0, duration: 300 });
    }

    // ===== Phase 2: Power-up UI =====
    showPower(type) {
        this.powerContainer.setAlpha(1);
        this.powerText.setText(type.name);
        this.powerText.setColor(type.color);
        this.powerTimerFill.setFillStyle(Phaser.Display.Color.HexStringToColor(type.color).color);
        this.activePowerStartTime = this.time.now;
        this.activePowerDuration = type.duration;
        if (this.powerTimerEvent) this.powerTimerEvent.destroy();
        this.powerTimerEvent = this.time.addEvent({
            delay: 50, loop: true,
            callback: () => {
                const elapsed = this.time.now - this.activePowerStartTime;
                const pct = Math.max(0, 1 - elapsed / this.activePowerDuration);
                this.powerTimerFill.width = 140 * pct;
            }
        });
    }

    hidePower() {
        this.tweens.add({ targets: this.powerContainer, alpha: 0, duration: 300 });
        if (this.powerTimerEvent) { this.powerTimerEvent.destroy(); this.powerTimerEvent = null; }
    }

    // ===== Phase 2: Synergy Notification =====
    showSynergyNotification(syn) {
        const width = this.cameras.main.width;
        const y = 120 + this.synergyTexts.length * 20;
        const synText = this.add.text(width / 2, y, `⚡ SYNERGY: ${syn.name} — ${syn.desc}`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffaa00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(202).setAlpha(0);
        this.synergyTexts.push(synText);
        this.tweens.add({ targets: synText, alpha: 1, duration: 300, hold: 4000, yoyo: true, onComplete: () => synText.destroy() });
    }

    // ===== Phase 2: Arena Event Banner =====
    showArenaEvent(data) {
        const names = {
            darkness: '🌑 DARKNESS MODE', meteor_strikes: '☄ METEOR STRIKES',
            turret_spawn: '🔫 TURRET SUPPORT', slow_motion: '⏱ SLOW MOTION'
        };
        this.arenaBanner.setText(names[data.type] || data.type.toUpperCase());
        this.arenaBanner.setAlpha(0);
        this.tweens.add({ targets: this.arenaBanner, alpha: 1, duration: 300 });
        this.tweens.add({ targets: this.arenaBanner, scaleX: 1.05, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1 });
    }

    hideArenaEvent() {
        this.tweens.add({ targets: this.arenaBanner, alpha: 0, duration: 500 });
    }

    createUpgradeMenu(width, height) {
        const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        this.upgradeContainer.add(backdrop);

        const title = this.add.text(width / 2, height / 2 - 130, 'LEVEL UP! Choose an Upgrade', {
            fontFamily: 'monospace', fontSize: '22px', color: '#00d4ff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.upgradeContainer.add(title);

        this.upgradeCards = [];
    }

    showUpgradeMenu(choices) {
        this.upgradeContainer.setVisible(true);
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.upgradeCards.forEach(c => c.destroy());
        this.upgradeCards = [];

        const cardWidth = 180;
        const cardHeight = 100;
        const spacing = 20;
        const totalWidth = choices.length * cardWidth + (choices.length - 1) * spacing;
        const startX = width / 2 - totalWidth / 2 + cardWidth / 2;

        choices.forEach((upgrade, i) => {
            const x = startX + i * (cardWidth + spacing);
            const y = height / 2 + 10;

            const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x222255, 0.9)
                .setInteractive({ useHandCursor: true });
            this.upgradeContainer.add(card);
            this.upgradeCards.push(card);

            const border = this.add.rectangle(x, y, cardWidth, cardHeight)
                .setStrokeStyle(2, 0x00d4ff, 0.6);
            this.upgradeContainer.add(border);
            this.upgradeCards.push(border);

            const icon = this.add.text(x, y - 25, upgrade.icon, { fontSize: '28px' }).setOrigin(0.5);
            this.upgradeContainer.add(icon);
            this.upgradeCards.push(icon);

            const nameText = this.add.text(x, y + 15, upgrade.name, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
                align: 'center', wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);
            this.upgradeContainer.add(nameText);
            this.upgradeCards.push(nameText);

            card.on('pointerover', () => {
                card.setFillStyle(0x334488, 1);
                border.setStrokeStyle(2, 0x00ff88, 1);
            });
            card.on('pointerout', () => {
                card.setFillStyle(0x222255, 0.9);
                border.setStrokeStyle(2, 0x00d4ff, 0.6);
            });
            card.on('pointerdown', () => {
                const gameScene = this.scene.get('GameScene');
                gameScene.applyUpgrade(upgrade.id);
            });

            card.setAlpha(0); card.setScale(0.8);
            this.tweens.add({
                targets: [card, border, icon, nameText],
                alpha: 1, scale: 1, duration: 300, delay: i * 100, ease: 'Back.easeOut'
            });
        });
    }

    hideUpgradeMenu() {
        this.upgradeContainer.setVisible(false);
    }

    updateHUD(data) {
        // Health bar
        const healthPercent = Math.max(0, data.hp / data.maxHP);
        this.healthBar.width = 196 * healthPercent;

        if (healthPercent > 0.5) this.healthBar.setFillStyle(0x00ff88);
        else if (healthPercent > 0.25) this.healthBar.setFillStyle(0xffdd57);
        else this.healthBar.setFillStyle(0xe94560);

        this.healthText.setText(`${Math.ceil(data.hp)}/${data.maxHP}`);

        // XP bar
        const xpPercent = data.xp / data.xpToNext;
        this.xpBar.width = 196 * Math.min(xpPercent, 1);

        // Texts
        this.levelText.setText(`LVL ${data.level}`);
        this.scoreText.setText(`SCORE: ${data.score}`);

        // Phase 3: Kill progress
        if (data.currentLevel && !data.currentLevel.isBoss) {
            this.killBar.width = 196 * Math.min(data.killProgress / data.killTarget, 1);
            this.killText.setText(`${data.killProgress} / ${data.killTarget}`);
        } else {
            this.killBar.width = 0;
            this.killText.setText('BOSS FIGHT');
        }

        // Phase 3: Boss HP bar
        if (data.bossMaxHP > 0 && data.bossHP > 0) {
            this.bossBarContainer.setAlpha(1);
            this.bossBarFill.width = 298 * (data.bossHP / data.bossMaxHP);
        } else {
            this.bossBarContainer.setAlpha(0);
        }

        // Weapon
        this.weaponText.setText(`🔫 ${data.weaponName}`);
        this.ammoText.setText(data.ammo === Infinity ? '∞' : `${data.ammo}/${data.maxAmmo}`);

        // Dash cooldown
        if (data.dashReady) {
            this.dashBar.width = 76;
            this.dashBar.setFillStyle(0x00ff88);
        } else {
            const cdPercent = 1 - (data.dashCooldownRemaining / data.dashCooldown);
            this.dashBar.width = 76 * cdPercent;
            this.dashBar.setFillStyle(0x666688);
        }

        // Mute
        this.muteText.setText(data.soundEnabled ? '🔊' : '🔇');
    }

    showLevelUpEffect(level) {
        this.announcement.setText(`⬆ LEVEL ${level} ⬆`);
        this.announcement.setColor('#00d4ff');
        this.announcement.setAlpha(1).setScale(0.5);
        this.tweens.add({
            targets: this.announcement, scale: 1.3, duration: 400, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({ targets: this.announcement, alpha: 0, delay: 800, duration: 500 });
            }
        });
    }

    togglePauseOverlay(paused) {
        this.pauseOverlay.setVisible(paused);
        this.pauseText.setVisible(paused);
    }

    showGameOverScreen(data) {
        this.gameOverOverlay.setVisible(true);
        this.gameOverTitle.setVisible(true);
        this.gameOverStats.setVisible(true);
        this.restartBtn.bg.setVisible(true); this.restartBtn.label.setVisible(true);
        this.menuBtn.bg.setVisible(true); this.menuBtn.label.setVisible(true);
        this.shopBtn.bg.setVisible(true); this.shopBtn.label.setVisible(true);

        const isNewHighScore = data.score >= data.highScore && data.score > 0;

        this.gameOverStats.setText(
            `Score: ${data.score}${isNewHighScore ? '  ★ NEW HIGH SCORE! ★' : ''}\n` +
            `High Score: ${data.highScore}\n` +
            `Stage Level: ${data.stageLevel || data.wave}\n` +
            `Levels Completed: ${data.levelsCompleted || 0}\n` +
            `Bosses Defeated: ${data.bossesDefeated || 0}\n` +
            `Zombies Killed: ${data.zombiesKilled}\n` +
            `Max Combo: ${data.maxCombo || 0}\n` +
            `Coins Earned: ${data.coinsEarned || 0} 💰`
        );

        // Animate in
        this.gameOverTitle.setAlpha(0);
        this.gameOverStats.setAlpha(0);
        this.gameOverOverlay.setAlpha(0);

        this.tweens.add({ targets: this.gameOverOverlay, alpha: 0.7, duration: 500 });
        this.tweens.add({ targets: this.gameOverTitle, alpha: 1, duration: 500, delay: 300 });
        this.tweens.add({ targets: this.gameOverStats, alpha: 1, duration: 500, delay: 500 });
    }
}
