// Zombie Killer Arena — Main Entry Point
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: document.body,
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, StartScene, LevelSelectScene, UpgradeShopScene, LeaderboardScene, GameScene, UIScene, TutorialScene],
    render: {
        pixelArt: false,
        antialias: true,
    },
    input: {
        activePointers: 3
    },
    fps: {
        target: 60,
        forceSetTimeOut: false
    }
};

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
});
