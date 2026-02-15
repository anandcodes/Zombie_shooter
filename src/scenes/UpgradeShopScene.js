class UpgradeShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeShopScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a15');

        this.metaData = JSON.parse(localStorage.getItem('zombieArena_meta') || '{}');
        if (!this.metaData.coins) this.metaData.coins = 0;
        if (!this.metaData.upgrades) this.metaData.upgrades = {};

        // Title
        this.add.text(width / 2, 30, '🛒 UPGRADE SHOP', {
            fontFamily: 'monospace', fontSize: '28px', color: '#ffaa33', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // Coins
        this.coinsText = this.add.text(width / 2, 60, `💰 ${this.metaData.coins}`, {
            fontFamily: 'monospace', fontSize: '18px', color: '#ffdd57', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 80, 'Upgrades persist between runs!', {
            fontFamily: 'monospace', fontSize: '10px', color: '#555577'
        }).setOrigin(0.5);

        // Meta upgrades definition
        this.metaUpgrades = [
            { id: 'meta_hp', name: 'Max Health', desc: '+5% HP per level', icon: '❤️', maxLevel: 10, costBase: 50, costScale: 1.5, color: '#e94560' },
            { id: 'meta_damage', name: 'Weapon Damage', desc: '+5% damage per level', icon: '💥', maxLevel: 10, costBase: 60, costScale: 1.5, color: '#ff8800' },
            { id: 'meta_speed', name: 'Move Speed', desc: '+3% speed per level', icon: '🏃', maxLevel: 8, costBase: 40, costScale: 1.4, color: '#00d4ff' },
            { id: 'meta_xp', name: 'XP Gain', desc: '+10% XP per level', icon: '⭐', maxLevel: 10, costBase: 45, costScale: 1.3, color: '#00ff88' },
            { id: 'meta_coins', name: 'Coin Drop', desc: '+8% coin chance per level', icon: '💰', maxLevel: 8, costBase: 55, costScale: 1.6, color: '#ffdd57' },
            { id: 'meta_dash', name: 'Dash Cooldown', desc: '-5% dash CD per level', icon: '💨', maxLevel: 6, costBase: 70, costScale: 1.5, color: '#aaaaff' },
            { id: 'meta_armor', name: 'Armor', desc: '-3% damage taken per level', icon: '🛡️', maxLevel: 8, costBase: 65, costScale: 1.6, color: '#88aacc' },
            { id: 'meta_regen', name: 'Health Regen', desc: '+1 HP/5s per level', icon: '💚', maxLevel: 5, costBase: 80, costScale: 1.8, color: '#44ff88' },
        ];

        // Create upgrade cards
        this.upgradeCards = [];
        const startY = 110;
        const cardH = 55;
        const cardW = width - 60;

        this.metaUpgrades.forEach((upg, i) => {
            const y = startY + i * (cardH + 6);
            const currentLevel = this.metaData.upgrades[upg.id] || 0;
            const isMaxed = currentLevel >= upg.maxLevel;
            const cost = isMaxed ? 0 : Math.floor(upg.costBase * Math.pow(upg.costScale, currentLevel));
            const canAfford = this.metaData.coins >= cost && !isMaxed;

            // Card bg
            const card = this.add.rectangle(width / 2, y, cardW, cardH, 0x1a1a2e, 0.9);
            const border = this.add.rectangle(width / 2, y, cardW, cardH)
                .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(upg.color).color, 0.3);

            // Icon
            this.add.text(50, y, upg.icon, { fontSize: '22px' }).setOrigin(0.5);

            // Name + desc
            this.add.text(80, y - 12, upg.name, {
                fontFamily: 'monospace', fontSize: '13px', color: upg.color, fontStyle: 'bold'
            });
            this.add.text(80, y + 6, upg.desc, {
                fontFamily: 'monospace', fontSize: '9px', color: '#777799'
            });

            // Level pips
            const pipStartX = 350;
            for (let p = 0; p < upg.maxLevel; p++) {
                const filled = p < currentLevel;
                this.add.rectangle(pipStartX + p * 14, y, 10, 10,
                    filled ? Phaser.Display.Color.HexStringToColor(upg.color).color : 0x333355,
                    filled ? 0.9 : 0.4
                );
            }

            // Level text
            this.add.text(pipStartX + upg.maxLevel * 14 + 10, y, `${currentLevel}/${upg.maxLevel}`, {
                fontFamily: 'monospace', fontSize: '10px', color: isMaxed ? '#00ff88' : '#888888'
            }).setOrigin(0, 0.5);

            // Buy button
            const btnX = width - 70;
            if (isMaxed) {
                this.add.text(btnX, y, 'MAX', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#00ff88', fontStyle: 'bold'
                }).setOrigin(0.5);
            } else {
                const buyBg = this.add.rectangle(btnX, y, 80, 30, canAfford ? 0x224422 : 0x222222, 0.8)
                    .setInteractive(canAfford ? { useHandCursor: true } : {});
                const buyBorder = this.add.rectangle(btnX, y, 80, 30)
                    .setStrokeStyle(1, canAfford ? 0x00ff88 : 0x444444, 0.5);
                const buyText = this.add.text(btnX, y, `💰${cost}`, {
                    fontFamily: 'monospace', fontSize: '11px',
                    color: canAfford ? '#00ff88' : '#666666', fontStyle: 'bold'
                }).setOrigin(0.5);

                if (canAfford) {
                    buyBg.on('pointerover', () => { buyBg.setFillStyle(0x336633, 1); });
                    buyBg.on('pointerout', () => { buyBg.setFillStyle(0x224422, 0.8); });
                    buyBg.on('pointerdown', () => {
                        this.purchaseUpgrade(upg.id, cost);
                    });
                }
            }
        });

        // Back button
        const backBtn = this.add.rectangle(width / 2, height - 35, 200, 40, 0x333355, 0.8)
            .setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height - 35, 200, 40).setStrokeStyle(1, 0x555577, 0.4);
        this.add.text(width / 2, height - 35, '← BACK TO STAGES', {
            fontFamily: 'monospace', fontSize: '13px', color: '#aaaacc', fontStyle: 'bold'
        }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));
    }

    purchaseUpgrade(upgradeId, cost) {
        this.metaData.coins -= cost;
        if (!this.metaData.upgrades[upgradeId]) this.metaData.upgrades[upgradeId] = 0;
        this.metaData.upgrades[upgradeId]++;
        localStorage.setItem('zombieArena_meta', JSON.stringify(this.metaData));
        // Refresh scene to show updated state
        this.scene.restart();
    }
}
