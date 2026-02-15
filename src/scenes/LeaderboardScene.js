class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a15');

        // Title
        this.add.text(width / 2, 40, '🏆 LEADERBOARD', {
            fontFamily: 'monospace', fontSize: '28px', color: '#00d4ff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // Load scores
        const storedScores = JSON.parse(localStorage.getItem('zombieArena_leaderboard') || '[]');
        // Sort effectively: Higher score is better. If score tie, more levels completed is better.
        storedScores.sort((a, b) => b.score - a.score || b.levels - a.levels);
        const topScores = storedScores.slice(0, 10);

        // Header
        const startY = 90;
        this.add.text(width / 2, startY, 'RANK   SCORE      LEVEL       DATE', {
            fontFamily: 'monospace', fontSize: '12px', color: '#555577'
        }).setOrigin(0.5);

        this.add.rectangle(width / 2, startY + 15, width - 60, 1, 0x333355).setAlpha(0.5);

        // List entries
        if (topScores.length === 0) {
            this.add.text(width / 2, height / 2, 'No scores yet.\nPlay a game to set a record!', {
                fontFamily: 'monospace', fontSize: '14px', color: '#888888', align: 'center'
            }).setOrigin(0.5);
        } else {
            topScores.forEach((entry, index) => {
                const y = startY + 40 + index * 30;
                const color = index === 0 ? '#ffdd57' : (index === 1 ? '#c0c0c0' : (index === 2 ? '#cd7f32' : '#ffffff'));

                // Rank
                this.add.text(60, y, `#${index + 1}`, {
                    fontFamily: 'monospace', fontSize: '14px', color: color, fontStyle: 'bold'
                }).setOrigin(0, 0.5);

                // Score
                this.add.text(140, y, entry.score.toLocaleString(), {
                    fontFamily: 'monospace', fontSize: '14px', color: color
                }).setOrigin(0, 0.5);

                // Level
                this.add.text(240, y, `Lvl ${entry.levels}`, {
                    fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa'
                }).setOrigin(0, 0.5);

                // Date
                const dateStr = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                this.add.text(320, y, dateStr, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#777799'
                }).setOrigin(0, 0.5);
            });
        }

        // Back button
        const backBtn = this.add.rectangle(width / 2, height - 50, 200, 40, 0x333355, 0.8)
            .setInteractive({ useHandCursor: true });
        this.add.rectangle(width / 2, height - 50, 200, 40).setStrokeStyle(1, 0x555577, 0.4);
        const backText = this.add.text(width / 2, height - 50, '← BACK', {
            fontFamily: 'monospace', fontSize: '14px', color: '#aaaacc', fontStyle: 'bold'
        }).setOrigin(0.5);

        backBtn.on('pointerover', () => { backBtn.setFillStyle(0x444466, 1); backText.setColor('#ffffff'); });
        backBtn.on('pointerout', () => { backBtn.setFillStyle(0x333355, 0.8); backText.setColor('#aaaacc'); });
        backBtn.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }
}
