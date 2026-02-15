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
