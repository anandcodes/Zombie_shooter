class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Phase 3: Level system
        this.levelData = data.levelData || [];
        this.currentLevelIndex = (data.startLevel || 1) - 1;
        this.currentLevel = this.levelData[this.currentLevelIndex] || {};
        this.levelsCompleted = 0;
        this.bossesDefeated = 0;
        this.totalCoinsEarned = 0;
        this.stageClearActive = false;

        // Zombie latch-on mechanic
        this.attachedZombies = [];


        // Game state
        this.score = 0;
        this.wave = this.currentLevel.level || 1;
        this.gameOver = false;
        this.isPaused = false;

        // Meta upgrades application
        this.metaData = JSON.parse(localStorage.getItem('zombieArena_meta') || '{}');
        const mu = this.metaData.upgrades || {};
        const metaHP = 1 + (mu.meta_hp || 0) * 0.05;
        const metaDmg = 1 + (mu.meta_damage || 0) * 0.05;
        const metaSpd = 1 + (mu.meta_speed || 0) * 0.03;
        const metaXP = 1 + (mu.meta_xp || 0) * 0.10;
        const metaCoin = 1 + (mu.meta_coins || 0) * 0.08;
        const metaDash = 1 - (mu.meta_dash || 0) * 0.05;
        const metaArmor = 1 - (mu.meta_armor || 0) * 0.03;
        const metaRegen = (mu.meta_regen || 0);

        // Player stats (with meta bonuses)
        this.playerHP = Math.floor(100 * metaHP);
        this.playerMaxHP = Math.floor(100 * metaHP);
        this.playerSpeed = Math.floor(200 * metaSpd);
        this.playerXP = 0;
        this.playerLevel = 1;
        this.xpToNextLevel = 50;
        this.xpMultiplier = metaXP;
        this.coinDropMultiplier = metaCoin;
        this.armorMultiplier = metaArmor;
        this.regenAmount = metaRegen;
        this.lastRegenTick = 0;

        // Damage cooldown
        this.damageCooldown = 500;
        this.lastDamageTime = 0;

        // Dash
        this.dashSpeed = 600;
        this.dashDuration = 150;
        this.dashCooldown = Math.floor(2000 * metaDash);
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashEndTime = 0;
        this.canDash = true;

        // Weapons system (with meta damage)
        this.weapons = {
            pistol: { name: 'Pistol', fireRate: 400, bulletSpeed: 500, bulletDamage: Math.floor(25 * metaDmg), bulletLifetime: 1000, bulletTexture: 'bullet', spread: 0, pellets: 1, auto: false, ammo: Infinity, maxAmmo: Infinity },
            shotgun: { name: 'Shotgun', fireRate: 600, bulletSpeed: 450, bulletDamage: Math.floor(15 * metaDmg), bulletLifetime: 600, bulletTexture: 'bullet_shotgun', spread: 0.3, pellets: 5, auto: false, ammo: 30, maxAmmo: 30 },
            smg: { name: 'SMG', fireRate: 80, bulletSpeed: 550, bulletDamage: Math.floor(10 * metaDmg), bulletLifetime: 800, bulletTexture: 'bullet_smg', spread: 0.15, pellets: 1, auto: true, ammo: 120, maxAmmo: 120 },
            assault: { name: 'Assault Rifle', fireRate: 120, bulletSpeed: 600, bulletDamage: Math.floor(20 * metaDmg), bulletLifetime: 1200, bulletTexture: 'bullet_ar', spread: 0.08, pellets: 1, auto: true, ammo: 60, maxAmmo: 60 },
            assault: { name: 'Assault Rifle', fireRate: 120, bulletSpeed: 600, bulletDamage: Math.floor(20 * metaDmg), bulletLifetime: 1200, bulletTexture: 'bullet_ar', spread: 0.08, pellets: 1, auto: true, ammo: 60, maxAmmo: 60 },
            flamethrower: { name: 'Flamethrower', fireRate: 50, bulletSpeed: 300, bulletDamage: Math.floor(5 * metaDmg), bulletLifetime: 400, bulletTexture: 'bullet_flame', spread: 0.4, pellets: 1, auto: true, ammo: 200, maxAmmo: 200 },
            burst_rifle: { name: 'Burst Rifle', fireRate: 800, bulletSpeed: 700, bulletDamage: Math.floor(22 * metaDmg), bulletLifetime: 1400, bulletTexture: 'bullet_ar', spread: 0.05, pellets: 3, burst: true, auto: false, ammo: 45, maxAmmo: 45 },
            chain_gun: { name: 'Chain Gun', fireRate: 200, bulletSpeed: 600, bulletDamage: Math.floor(12 * metaDmg), bulletLifetime: 1000, bulletTexture: 'bullet_smg', spread: 0.15, pellets: 1, auto: true, ammo: 300, maxAmmo: 300, spinUp: 0 }
        };
        this.currentWeaponKey = 'pistol';
        this.lastFired = 0;
        this.unlockedWeapons = ['pistol'];

        // Upgrade pool
        this.upgradePool = [
            { id: 'hp_up', name: 'Max HP +25', icon: '❤️', apply: () => { this.playerMaxHP += 25; this.playerHP = Math.min(this.playerHP + 25, this.playerMaxHP); } },
            { id: 'speed_up', name: 'Speed +15%', icon: '🏃', apply: () => { this.playerSpeed *= 1.15; } },
            { id: 'damage_up', name: 'Damage +20%', icon: '💥', apply: () => { Object.values(this.weapons).forEach(w => w.bulletDamage *= 1.2); } },
            { id: 'fire_rate_up', name: 'Fire Rate +15%', icon: '🔥', apply: () => { Object.values(this.weapons).forEach(w => w.fireRate = Math.max(30, w.fireRate * 0.85)); } },
            { id: 'bullet_speed', name: 'Bullet Speed +20%', icon: '⚡', apply: () => { Object.values(this.weapons).forEach(w => w.bulletSpeed *= 1.2); } },
            { id: 'heal', name: 'Full Heal', icon: '💚', apply: () => { this.playerHP = this.playerMaxHP; } },
            { id: 'dash_cd', name: 'Dash CD -20%', icon: '💨', apply: () => { this.dashCooldown = Math.max(500, this.dashCooldown * 0.8); } },
            { id: 'bullet_life', name: 'Range +25%', icon: '🎯', apply: () => { Object.values(this.weapons).forEach(w => w.bulletLifetime *= 1.25); } },
            {
                id: 'unlock_shotgun', name: 'Unlock Shotgun', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('shotgun')) {
                        this.unlockedWeapons.push('shotgun');
                        this.currentWeaponKey = 'shotgun';
                        this.events.emit('weaponSwitch', 'shotgun');
                    }
                    this.weapons.shotgun.ammo = this.weapons.shotgun.maxAmmo;
                }, once: true
            },
            {
                id: 'unlock_smg', name: 'Unlock SMG', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('smg')) {
                        this.unlockedWeapons.push('smg');
                        this.currentWeaponKey = 'smg';
                        this.events.emit('weaponSwitch', 'smg');
                    }
                    this.weapons.smg.ammo = this.weapons.smg.maxAmmo;
                }, once: true
            },
            {
                id: 'unlock_assault', name: 'Unlock Assault Rifle', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('assault')) {
                        this.unlockedWeapons.push('assault');
                        this.currentWeaponKey = 'assault';
                        this.events.emit('weaponSwitch', 'assault');
                    }
                    this.weapons.assault.ammo = this.weapons.assault.maxAmmo;
                }, once: true
            },
            {
                id: 'unlock_flamethrower', name: 'Unlock Flamethrower', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('flamethrower')) {
                        this.unlockedWeapons.push('flamethrower');
                        this.currentWeaponKey = 'flamethrower';
                        this.events.emit('weaponSwitch', 'flamethrower');
                    }
                    this.weapons.flamethrower.ammo = this.weapons.flamethrower.maxAmmo;
                }, once: true
            },
            {
                id: 'unlock_burst_rifle', name: 'Unlock Burst Rifle', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('burst_rifle')) {
                        this.unlockedWeapons.push('burst_rifle');
                        this.currentWeaponKey = 'burst_rifle';
                        this.events.emit('weaponSwitch', 'burst_rifle');
                    }
                    this.weapons.burst_rifle.ammo = this.weapons.burst_rifle.maxAmmo;
                }, once: true
            },
            {
                id: 'unlock_chain_gun', name: 'Unlock Chain Gun', icon: '🔫', apply: () => {
                    if (!this.unlockedWeapons.includes('chain_gun')) {
                        this.unlockedWeapons.push('chain_gun');
                        this.currentWeaponKey = 'chain_gun';
                        this.events.emit('weaponSwitch', 'chain_gun');
                    }
                    this.weapons.chain_gun.ammo = this.weapons.chain_gun.maxAmmo;
                }, once: true
            },
            { id: 'ammo_up', name: 'Refill All Ammo', icon: '📦', apply: () => { Object.values(this.weapons).forEach(w => w.ammo = w.maxAmmo); } },
            { id: 'max_ammo_up', name: 'Max Ammo +30%', icon: '🎒', apply: () => { Object.values(this.weapons).forEach(w => { if (w.maxAmmo !== Infinity) { w.maxAmmo = Math.floor(w.maxAmmo * 1.3); w.ammo = w.maxAmmo; } }); } },
        ];
        this.usedOnceUpgrades = [];

        // Zombie stats — direct from readme formula per level
        this.zombieBaseHP = this.currentLevel.enemyHP || 25;
        this.zombieBaseDamage = 10 + (this.currentLevel.level || 1);
        this.zombieBaseSpeed = this.currentLevel.enemySpeed || 40;
        this.maxEnemiesOnScreen = this.currentLevel.maxEnemies || 8;
        this.enemyPool = this.currentLevel.enemyPool || ['normal'];

        // Level management (replaces wave management)
        this.zombiesSpawnedThisWave = 0;
        this.zombiesPerWave = this.currentLevel.killTarget || 30;
        this.zombiesKilledThisWave = 0;
        this.totalZombiesKilled = 0;

        // XP curve from readme: 40 * (1.18 ^ playerLevel)
        this.xpToNextLevel = Math.floor(40 * Math.pow(1.18, this.playerLevel));

        // Boss state
        this.bossActive = false;
        this.bossRef = null;
        this.bossPhase = 1;
        this.bossLastAttack = 0;
        this.bossAttackCooldown = 2000;

        // Sound settings
        this.soundEnabled = true;

        // ===== PHASE 2: System 1 — Combo =====
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2000;
        this.comboMultiplier = 1;
        this.maxComboMultiplier = 5;
        this.comboGlowActive = false;

        // ===== PHASE 2: System 2 — Elite Zombies =====
        this.eliteModifiers = ['shielded', 'exploder', 'regenerator', 'speed_aura'];
        this.eliteSpawnChance = 0.1;

        // ===== PHASE 2: System 3 — Synergies =====
        this.collectedUpgradeIds = [];
        this.activeSynergies = [];
        this.synergies = [
            { id: 'bullet_storm', name: 'Bullet Storm', requires: ['fire_rate_up', 'damage_up'], desc: 'Extra pellet per shot', active: false },
            { id: 'chain_lightning', name: 'Chain Lightning', requires: ['bullet_speed', 'bullet_life'], desc: 'Bullets chain to nearby', active: false },
            { id: 'shockwave_shot', name: 'Shockwave Shot', requires: ['unlock_shotgun', 'damage_up'], desc: 'Shotgun knockback', active: false },
            { id: 'blade_dash', name: 'Blade Dash', requires: ['dash_cd', 'speed_up'], desc: 'Dash damages enemies', active: false },
        ];

        // ===== PHASE 2: System 4 — Power Drops =====
        this.powerDropChance = 0.15;
        this.activePower = null;
        this.powerTimer = 0;
        this.powerTypes = [
            { id: 'double_damage', name: 'Double Damage', duration: 5000, texture: 'power_double_damage', color: '#ff3333' },
            { id: 'freeze', name: 'Freeze Zombies', duration: 3000, texture: 'power_freeze', color: '#00ccff' },
            { id: 'rapid_fire', name: 'Rapid Fire', duration: 4000, texture: 'power_rapid_fire', color: '#ffdd00' },
            { id: 'health_burst', name: 'Health Burst', duration: 0, texture: 'power_health', color: '#00ff88' },
            { id: 'coin_magnet', name: 'Coin Magnet', duration: 5000, texture: 'power_magnet', color: '#ffaa33' },
            // Phase 5: Weapon Mods
            { id: 'mod_ricochet', name: 'Ricochet Rounds', duration: 8000, texture: 'power_ricochet', color: '#dddddd' },
            { id: 'mod_vampiric', name: 'Vampiric Touch', duration: 8000, texture: 'power_vampiric', color: '#aa0033' },
            { id: 'mod_frostbite', name: 'Frostbite', duration: 6000, texture: 'power_frostbite', color: '#00aaff' },
            { id: 'mod_spread', name: 'Spread Shot', duration: 6000, texture: 'power_spread', color: '#ffaa00' },
        ];

        // ===== PHASE 2: System 5 — Arena Events =====
        this.arenaEventActive = false;
        this.arenaEventType = null;
        this.arenaEventTimer = 0;
        this.lastArenaEventWave = 0;
        this.turrets = [];
    }

    create() {
        const worldWidth = 4000;
        const worldHeight = 600;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Visual Overhaul: Bloom + Lights
        if (this.cameras.main.postFX) {
            this.cameras.main.postFX.addBloom({ intensity: 1.5, blurStrength: 1.2 });
            this.cameras.main.postFX.addVignette(0.5, 0.5, 0.7);
        }

        // Setup Lights
        this.lights.enable();
        this.lights.setAmbientColor(0x333333); // Dark ambient
        this.playerLight = this.lights.addLight(0, 0, 400, 0xffffff, 2);

        // ===== ENVIRONMENT LAYERS =====
        this.createEnvironment(worldWidth, worldHeight);

        // Create player
        this.createPlayer(100, worldHeight / 2);

        // Groups
        this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 100, runChildUpdate: false });
        this.zombies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, runChildUpdate: false });
        this.xpOrbs = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 50 });
        this.coins = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 30 });

        // Phase 5: Interactive Environment
        this.barrels = this.physics.add.group({ key: 'barrel_explosive', immovable: true });
        // Place some barrels
        for (let i = 0; i < 15; i++) {
            const bx = Phaser.Math.Between(100, worldWidth - 100);
            const by = Phaser.Math.Between(100, worldHeight - 100);
            const barrel = this.barrels.create(bx, by, 'barrel_explosive');
            barrel.setDepth(5).setPipeline('Light2D');
            barrel.hp = 30; // Health before exploding
        }
        this.physics.add.collider(this.bullets, this.barrels, this.bulletHitBarrel, null, this);
        this.physics.add.collider(this.player, this.barrels); // Player collision with barrels
        this.physics.add.collider(this.zombies, this.barrels); // Zombies collision with barrels

        // Phase 5: Mini-Map Setup
        this.minimapSize = 120;
        this.minimapScale = 0.08;
        this.minimapContainer = this.add.container(worldWidth - 140, worldHeight - 140).setDepth(1000).setScrollFactor(0);

        // Reposition for UI (top-left or bottom-right depending on preference, stick to bottom-left relative to screen)
        // Actually, let's fix position in createUI or just use fixed screen coordinates
        const mmX = 20;
        const mmY = 160; // Below other HUD elements
        this.minimapContainer.setPosition(mmX, mmY);

        const mmBg = this.add.rectangle(0, 0, this.minimapSize, this.minimapSize, 0x000000, 0.6).setOrigin(0);
        const mmBorder = this.add.rectangle(0, 0, this.minimapSize, this.minimapSize).setStrokeStyle(2, 0x444444).setOrigin(0);
        this.minimapContainer.add([mmBg, mmBorder]);

        this.mmPlayer = this.add.circle(0, 0, 3, 0x00ff00);
        this.minimapContainer.add(this.mmPlayer);

        this.mmDots = []; // Pool of dots

        // Phase 2: Power drops
        this.powerDrops = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 10 });
        this.ammoDrops = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 10 });

        // ===== PARTICLE SYSTEMS =====
        this.bloodParticles = this.add.particles(0, 0, 'blood_particle', {
            speed: { min: 60, max: 180 }, lifespan: 500,
            scale: { start: 1.2, end: 0 }, alpha: { start: 0.9, end: 0 },
            rotate: { min: 0, max: 360 }, emitting: false
        }).setDepth(7);

        this.hitParticles = this.add.particles(0, 0, 'hit_particle', {
            speed: { min: 100, max: 250 }, lifespan: 250,
            scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
            emitting: false
        }).setDepth(12);

        // Ambient dust particles (floating in the scene)
        this.dustEmitter = this.add.particles(0, 0, 'dust_particle', {
            x: { min: 0, max: worldWidth },
            y: { min: 0, max: worldHeight },
            lifespan: 6000,
            speed: { min: 5, max: 20 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.3, end: 0 },
            frequency: 200,
            quantity: 1
        }).setDepth(2);

        // ===== INPUT =====
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
            dash: Phaser.Input.Keyboard.KeyCodes.SPACE, pause: Phaser.Input.Keyboard.KeyCodes.P,
            weapon1: Phaser.Input.Keyboard.KeyCodes.ONE, weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
            weapon3: Phaser.Input.Keyboard.KeyCodes.THREE, weapon4: Phaser.Input.Keyboard.KeyCodes.FOUR,
            weapon5: Phaser.Input.Keyboard.KeyCodes.FIVE, mute: Phaser.Input.Keyboard.KeyCodes.M
        });

        // Auto-Aim / Auto-Fire (Default ON)
        this.autoAim = true; this.autoFire = true;
        this.input.keyboard.on('keydown-F', () => {
            this.autoAim = !this.autoAim; this.autoFire = this.autoAim;
            const msg = this.autoAim ? 'AUTO-AIM: ON' : 'AUTO-AIM: OFF';
            this.showDamageNumber(this.player.x, this.player.y - 40, msg, '#00ff88');
        });

        // Manual Level Advance Listener
        this.events.on('nextLevel', () => {
            if (this.stageClearActive) {
                if (this.currentLevelIndex + 1 >= this.levelData.length) {
                    this.events.emit('victory', {
                        score: this.score, levelsCompleted: this.levelsCompleted,
                        bossesDefeated: this.bossesDefeated, totalCoins: this.totalCoinsEarned
                    });
                } else {
                    this.advanceToNextLevel();
                }
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (!this.gameOver && !this.isPaused && !this.upgradeMenuActive && !this.stageClearActive) this.shootBullet(pointer);
        });

        this.cursors.pause.on('down', () => { if (!this.gameOver && !this.upgradeMenuActive) this.togglePause(); });
        this.cursors.mute.on('down', () => { this.soundEnabled = !this.soundEnabled; this.events.emit('muteToggle', this.soundEnabled); });
        this.cursors.weapon1.on('down', () => this.switchWeapon(0));
        this.cursors.weapon2.on('down', () => this.switchWeapon(1));
        this.cursors.weapon3.on('down', () => this.switchWeapon(2));
        this.cursors.weapon4.on('down', () => this.switchWeapon(3));
        this.cursors.weapon5.on('down', () => this.switchWeapon(4));

        // ===== CAMERA =====
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.3);
        this.cameras.main.setBackgroundColor('#0d0d1a');

        // ===== ATMOSPHERIC OVERLAYS =====
        // Vignette overlay on top of everything (follows camera)
        this.vignetteOverlay = this.add.image(400, 300, 'vignette')
            .setScrollFactor(0).setDepth(90).setDisplaySize(800, 600).setAlpha(0.6);

        // Fog layers (parallax scrolling for depth)
        this.fogLayer1 = [];
        this.fogLayer2 = [];
        for (let i = 0; i < 15; i++) {
            const fx = Phaser.Math.Between(0, worldWidth);
            const fy = Phaser.Math.Between(0, worldHeight);
            const fog = this.add.image(fx, fy, 'fog_particle')
                .setDepth(6).setAlpha(0.3 + Math.random() * 0.2)
                .setScale(2 + Math.random() * 3);
            this.fogLayer1.push(fog);
        }
        for (let i = 0; i < 8; i++) {
            const fx = Phaser.Math.Between(0, worldWidth);
            const fy = Phaser.Math.Between(0, worldHeight);
            const fog = this.add.image(fx, fy, 'fog_particle')
                .setDepth(11).setAlpha(0.1 + Math.random() * 0.15)
                .setScale(3 + Math.random() * 4);
            this.fogLayer2.push(fog);
        }

        // ===== COLLISIONS =====
        this.physics.add.overlap(this.bullets, this.zombies, this.bulletHitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.zombieHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.xpOrbs, this.collectXP, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.powerDrops, this.collectPowerDrop, null, this);
        this.physics.add.overlap(this.player, this.ammoDrops, this.collectAmmo, null, this);

        // Level manager (Phase 3 — replaces wave manager)
        if (this.currentLevel.isBoss) {
            // Boss level: spawn boss immediately
            this.time.delayedCall(1500, () => this.spawnBoss());
        } else {
            // Normal level: spawn zombies with level-specific rate
            const spawnRate = this.currentLevel.spawnRate || 1500;
            this.waveTimer = this.time.addEvent({ delay: spawnRate, callback: this.spawnZombie, callbackScope: this, loop: true });
        }
        this.events.emit('levelStart', { level: this.currentLevel.level, theme: this.currentLevel.theme, isBoss: this.currentLevel.isBoss });

        this.upgradeMenuActive = false;
        this.isMobile = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
        if (this.isMobile) this.setupMobileControls();

        this.damageTexts = [];
    }

    // ==================== ENVIRONMENT ====================
    createEnvironment(worldWidth, worldHeight) {
        // Phase 3: Level theme tinting
        const groundTint = this.currentLevel.groundColor || 0x1a1a2e;
        const fogTint = this.currentLevel.fogTint || 0x334455;

        // Base ground - tileSprite with main ground texture
        const ground = this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'ground');
        ground.setDepth(0).setTint(groundTint).setPipeline('Light2D');

        // Overlay with varied ground patches for visual interest
        const groundVariants = ['ground_dark', 'ground_cracked'];
        for (let i = 0; i < 240; i++) {
            const vx = Phaser.Math.Between(32, worldWidth - 32);
            const vy = Phaser.Math.Between(32, worldHeight - 32);
            const variant = Phaser.Utils.Array.GetRandom(groundVariants);
            this.add.image(vx, vy, variant)
                .setDepth(0.1).setAlpha(0.5 + Math.random() * 0.3)
                .setScale(1 + Math.random() * 0.5)
                .setAngle(Phaser.Math.Between(0, 3) * 90);
        }

        // Grass patches scattered around
        for (let i = 0; i < 300; i++) {
            const gx = Phaser.Math.Between(20, worldWidth - 20);
            const gy = Phaser.Math.Between(20, worldHeight - 20);
            this.add.image(gx, gy, 'grass_patch')
                .setDepth(0.2).setAlpha(0.4 + Math.random() * 0.3)
                .setScale(0.7 + Math.random() * 1.2)
                .setAngle(Phaser.Math.Between(0, 360));
        }

        // Puddles
        for (let i = 0; i < 80; i++) {
            const px = Phaser.Math.Between(60, worldWidth - 60);
            const py = Phaser.Math.Between(60, worldHeight - 60);
            this.add.image(px, py, 'puddle')
                .setDepth(0.3).setAlpha(0.5 + Math.random() * 0.3)
                .setScale(0.8 + Math.random() * 1.5)
                .setAngle(Phaser.Math.Between(0, 360));
        }

        // Environmental props — scattered around the world
        // Barrels
        for (let i = 0; i < 100; i++) {
            const bx = Phaser.Math.Between(50, worldWidth - 50);
            const by = Phaser.Math.Between(50, worldHeight - 50);
            this.add.image(bx, by, 'barrel').setDepth(4).setScale(0.9 + Math.random() * 0.3);
        }

        // Crates
        for (let i = 0; i < 120; i++) {
            const cx = Phaser.Math.Between(50, worldWidth - 50);
            const cy = Phaser.Math.Between(50, worldHeight - 50);
            this.add.image(cx, cy, 'crate').setDepth(4)
                .setScale(0.8 + Math.random() * 0.4)
                .setAngle(Phaser.Math.Between(0, 3) * 90);
        }

        // Rocks
        for (let i = 0; i < 160; i++) {
            const rx = Phaser.Math.Between(30, worldWidth - 30);
            const ry = Phaser.Math.Between(30, worldHeight - 30);
            this.add.image(rx, ry, 'rock').setDepth(3)
                .setScale(0.5 + Math.random() * 1.2)
                .setAngle(Phaser.Math.Between(0, 360))
                .setAlpha(0.7 + Math.random() * 0.3)
                .setPipeline('Light2D');
        }

        // Dead trees
        for (let i = 0; i < 60; i++) {
            const tx = Phaser.Math.Between(80, worldWidth - 80);
            const ty = Phaser.Math.Between(80, worldHeight - 80);
            this.add.image(tx, ty, 'dead_tree').setDepth(4)
                .setScale(0.8 + Math.random() * 0.5)
                .setAlpha(0.6 + Math.random() * 0.3)
                .setPipeline('Light2D');
        }

        // Fence segments
        for (let i = 0; i < 50; i++) {
            const fx = Phaser.Math.Between(100, worldWidth - 100);
            const fy = Phaser.Math.Between(100, worldHeight - 100);
            const fenceAngle = Phaser.Math.Between(0, 1) * 90;
            for (let j = 0; j < Phaser.Math.Between(2, 5); j++) {
                const offX = fenceAngle === 0 ? j * 30 : 0;
                const offY = fenceAngle === 90 ? j * 30 : 0;
                this.add.image(fx + offX, fy + offY, 'fence').setDepth(4)
                    .setAngle(fenceAngle).setAlpha(0.7)
                    .setPipeline('Light2D');
            }
        }

        // Lampposts with actual light glow
        for (let i = 0; i < 40; i++) {
            const lx = Phaser.Math.Between(100, worldWidth - 100);
            const ly = Phaser.Math.Between(100, worldHeight - 100);
            // Light glow on ground
            this.add.image(lx, ly, 'player_glow')
                .setDepth(0.5).setScale(3).setAlpha(0.15).setTint(0xffddaa);
            // Lamppost itself
            this.add.image(lx, ly, 'lamppost').setDepth(5).setAlpha(0.85).setPipeline('Light2D');
            // Add actual light source
            this.lights.addLight(lx, ly - 20, 180, 0xffdd88, 1.2);
        }

        // World border visual — dark edge ring
        const borderGraphics = this.add.graphics().setDepth(1);
        borderGraphics.lineStyle(8, fogTint, 0.5);
        borderGraphics.strokeRect(4, 4, worldWidth - 8, worldHeight - 8);
        borderGraphics.lineStyle(3, 0x880000, 0.3);
        borderGraphics.strokeRect(12, 12, worldWidth - 24, worldHeight - 24);


    }

    createPlayer(x, y) {
        this.player = this.physics.add.sprite(x, y, 'player').setPipeline('Light2D');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setCircle(12, 20, 12);

        // Player light glow that follows
        this.playerGlow = this.add.image(x, y, 'player_glow')
            .setDepth(9).setScale(2.5).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);

        // Visual Overhaul: Visible Weapon Sprite
        this.weaponSprite = this.add.sprite(x, y, 'weapon_pistol').setDepth(11);
        this.weaponSprite.setOrigin(0.2, 0.5); // Pivot around handle area
    }

    // ==================== MOBILE CONTROLS ====================
    setupMobileControls() {
        const height = this.cameras.main.height;
        const width = this.cameras.main.width;

        this.joystickBase = this.add.image(120, height - 120, 'joystick_base').setScrollFactor(0).setDepth(500).setAlpha(0.6);
        this.joystickKnob = this.add.image(120, height - 120, 'joystick_knob').setScrollFactor(0).setDepth(501).setAlpha(0.8);
        this.joystickData = { active: false, dx: 0, dy: 0 };

        this.joystickZone = this.add.rectangle(120, height - 120, 200, 200, 0x000000, 0).setScrollFactor(0).setDepth(502).setInteractive();
        this.joystickZone.on('pointerdown', () => { this.joystickData.active = true; });
        this.joystickZone.on('pointermove', (pointer) => {
            if (!this.joystickData.active) return;
            const dx = pointer.x - 120, dy = pointer.y - (height - 120);
            const dist = Math.sqrt(dx * dx + dy * dy), maxDist = 40;
            const clampedDist = Math.min(dist, maxDist), angle = Math.atan2(dy, dx);
            this.joystickKnob.x = 120 + Math.cos(angle) * clampedDist;
            this.joystickKnob.y = (height - 120) + Math.sin(angle) * clampedDist;
            this.joystickData.dx = Math.cos(angle) * (clampedDist / maxDist);
            this.joystickData.dy = Math.sin(angle) * (clampedDist / maxDist);
        });
        this.joystickZone.on('pointerup', () => {
            this.joystickData.active = false; this.joystickData.dx = 0; this.joystickData.dy = 0;
            this.joystickKnob.x = 120; this.joystickKnob.y = height - 120;
        });

        this.shootBtn = this.add.image(width - 80, height - 120, 'mobile_button').setScrollFactor(0).setDepth(500).setAlpha(0.7).setInteractive();
        this.add.text(width - 80, height - 120, '🔫', { fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.mobileShootActive = false;
        this.shootBtn.on('pointerdown', () => { this.mobileShootActive = true; });
        this.shootBtn.on('pointerup', () => { this.mobileShootActive = false; });

        this.dashBtn = this.add.image(width - 160, height - 120, 'mobile_button').setScrollFactor(0).setDepth(500).setAlpha(0.7).setInteractive();
        this.add.text(width - 160, height - 120, '💨', { fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.dashBtn.on('pointerdown', () => { this.performDash(); });
    }

    // ==================== UPDATE LOOP ====================
    update(time, delta) {
        if (this.gameOver || this.isPaused || this.upgradeMenuActive) return;

        this.handlePlayerMovement(time);
        this.handlePlayerRotation();
        this.handleContinuousShooting(time);
        this.handleDash(time);
        this.updateZombies();
        this.updateAttachedZombies(time, delta);
        this.cleanupBullets();
        this.cleanupOrbs();
        this.updateVisuals(time, delta);

        if (!this.canDash && time > this.dashCooldownTimer) this.canDash = true;

        // Phase 2: Combo timer decay
        if (this.comboCount > 0 && time > this.comboTimer) {
            this.comboCount = 0; this.comboMultiplier = 1;
            this.events.emit('comboEnd');
            if (this.comboGlowActive) { this.comboGlowActive = false; this.player.clearTint(); }
        }

        // Phase 2: Power-up timer
        if (this.activePower && this.activePower.duration > 0 && time > this.powerTimer) {
            this.deactivatePower();
        }

        // Phase 2: Arena event timer
        if (this.arenaEventActive && time > this.arenaEventTimer) {
            this.endArenaEvent();
        }

        // Phase 2: Elite zombie updates (regen, speed aura)
        this.updateEliteZombies(time, delta);

        // Phase 2: Turret auto-fire
        this.updateTurrets(time);

        // Phase 2: Coin magnet
        if (this.activePower && this.activePower.id === 'coin_magnet') {
            this.coins.getChildren().forEach(c => {
                if (!c.active) return;
                const angle = Phaser.Math.Angle.Between(c.x, c.y, this.player.x, this.player.y);
                this.physics.velocityFromRotation(angle, 200, c.body.velocity);
            });
            this.xpOrbs.getChildren().forEach(o => {
                if (!o.active) return;
                const angle = Phaser.Math.Angle.Between(o.x, o.y, this.player.x, this.player.y);
                this.physics.velocityFromRotation(angle, 200, o.body.velocity);
            });
        }

        // Phase 3: Boss AI updates
        if (this.bossActive && this.bossRef && this.bossRef.active) {
            this.updateBoss(time, delta);
        }

        // Phase 3: Health regen from meta upgrade
        if (this.regenAmount > 0 && time > this.lastRegenTick + 5000) {
            this.lastRegenTick = time;
            this.playerHP = Math.min(this.playerHP + this.regenAmount, this.playerMaxHP);
        }

        const weapon = this.weapons[this.currentWeaponKey];
        this.events.emit('updateUI', {
            hp: this.playerHP, maxHP: this.playerMaxHP, xp: this.playerXP, xpToNext: this.xpToNextLevel,
            level: this.playerLevel, score: this.score, wave: this.wave, weaponName: weapon.name,
            ammo: weapon.ammo, maxAmmo: weapon.maxAmmo, dashReady: this.canDash, dashCooldown: this.dashCooldown,
            dashCooldownRemaining: Math.max(0, this.dashCooldownTimer - time),
            weaponIndex: this.unlockedWeapons.indexOf(this.currentWeaponKey),
            unlockedWeapons: this.unlockedWeapons, soundEnabled: this.soundEnabled,
            comboCount: this.comboCount, comboMultiplier: this.comboMultiplier,
            activePower: this.activePower, activeSynergies: this.activeSynergies,
            arenaEvent: this.arenaEventActive ? this.arenaEventType : null,
            // Phase 3 data
            currentLevel: this.currentLevel,
            killProgress: this.zombiesKilledThisWave,
            killTarget: this.zombiesPerWave,
            bossMaxHP: this.bossRef ? this.bossRef.maxHP : 0,
            levelsCompleted: this.levelsCompleted
        });

        // Phase 5: Mini-map Update (every 5 frames to save perf)
        if (time % 5 === 0) this.updateMinimap();
    }

    // ==================== VISUALS UPDATE ====================
    updateVisuals(time, delta) {
        // Player glow follows player
        if (this.playerGlow) {
            this.playerGlow.x = this.player.x;
            this.playerGlow.y = this.player.y;
            // Subtle pulse
            this.playerGlow.setAlpha(0.15 + Math.sin(time * 0.003) * 0.05);
        }

        // Update Light Position
        if (this.playerLight) {
            this.playerLight.x = this.player.x;
            this.playerLight.y = this.player.y;
        }

        // Slowly drift fog layers
        const dt = delta / 1000;
        this.fogLayer1.forEach((fog, i) => {
            fog.x += (10 + i * 2) * dt;
            fog.y += (5 + i) * dt;
            if (fog.x > this.worldWidth + 100) fog.x = -100;
            if (fog.y > this.worldHeight + 100) fog.y = -100;
        });
        this.fogLayer2.forEach((fog, i) => {
            fog.x -= (8 + i * 1.5) * dt;
            fog.y += (3 + i * 0.5) * dt;
            if (fog.x < -100) fog.x = this.worldWidth + 100;
            if (fog.y > this.worldHeight + 100) fog.y = -100;
        });
    }

    // ==================== MOVEMENT ====================
    handlePlayerMovement(time) {
        if (this.isDashing) return;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;
        if (this.isMobile && this.joystickData.active) { vx = this.joystickData.dx; vy = this.joystickData.dy; }
        if (vx !== 0 && vy !== 0) { const len = Math.sqrt(vx * vx + vy * vy); if (len > 1) { vx /= len; vy /= len; } }
        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.dash)) this.performDash();
    }

    handlePlayerRotation() {
        let angle = this.player.rotation;
        let angleSet = false;

        // 1. Auto-aim priority
        if (this.autoAim) {
            const { enemy, dist } = this.getNearestEnemy();
            if (enemy && dist < 600) {
                angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                angleSet = true;
            }
        }

        // 2. Mobile Joystick (if no auto-aim target)
        if (!angleSet && this.isMobile) {
            const vx = this.player.body.velocity.x;
            const vy = this.player.body.velocity.y;
            if (Math.abs(vx) > 10 || Math.abs(vy) > 10) {
                angle = Math.atan2(vy, vx);
                angleSet = true;
            }
        }

        // 3. Mouse Pointer (fallback)
        if (!angleSet && !this.isMobile) {
            const pointer = this.input.activePointer;
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        }

        this.player.setRotation(angle);

        // Sync weapon
        if (this.weaponSprite) {
            this.weaponSprite.setPosition(this.player.x, this.player.y);
            this.weaponSprite.setRotation(angle);
            const offset = 20;
            this.weaponSprite.x += Math.cos(angle) * offset;
            this.weaponSprite.y += Math.sin(angle) * offset;
            this.weaponSprite.setFlipY(Math.abs(angle) > 1.57);
        }
    }

    handleDash(time) {
        if (this.isDashing) {
            if (time > this.dashEndTime) {
                this.isDashing = false;
                this.player.body.maxSpeed = this.playerSpeed; // Reset speed
                this.player.body.setVelocity(0, 0);
            }
        }
    }

    performDash() {
        if (this.isDashing || this.time.now < this.dashCooldownTimer) return;
        this.isDashing = true;
        this.dashCooldownTimer = this.time.now + this.dashCooldown;
        this.dashEndTime = this.time.now + this.dashDuration;

        let angle = this.player.rotation;
        // Direction from inputs if pressed
        if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown) {
            const dx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
            const dy = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
            if (dx !== 0 || dy !== 0) angle = Math.atan2(dy, dx);
        } else if (this.isMobile && this.joystickData && this.joystickData.active) {
            angle = Math.atan2(this.joystickData.dy, this.joystickData.dx);
        }

        this.physics.velocityFromRotation(angle, this.dashSpeed, this.player.body.velocity);
        this.playSound('dash');

        // Visual dash trail
        this.time.addEvent({
            delay: 40, repeat: 4, callback: () => {
                const trail = this.add.image(this.player.x, this.player.y, 'player').setAlpha(0.6).setTint(0x00ffff).setScale(this.player.scaleX);
                this.tweens.add({ targets: trail, alpha: 0, duration: 250, onComplete: () => trail.destroy() });
            }
        });
    }

    // ==================== SHOOTING ====================
    getNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        const p = this.player;
        this.zombies.getChildren().forEach(z => {
            if (z.active) {
                const d = Phaser.Math.Distance.Between(p.x, p.y, z.x, z.y);
                if (d < minDist) { minDist = d; nearest = z; }
            }
        });
        return { enemy: nearest, dist: minDist };
    }

    handleContinuousShooting(time) {
        const weapon = this.weapons[this.currentWeaponKey];
        // Rapid fire power-up halves fire rate
        const effectiveFireRate = (this.activePower && this.activePower.id === 'rapid_fire') ? weapon.fireRate * 0.4 : weapon.fireRate;

        // Auto-aim / Auto-fire logic
        const { enemy, dist } = this.getNearestEnemy();
        const autoRange = 550; // Increased Auto-fire range
        let autoAngle = null;
        let shouldShoot = false;

        // Auto-aim at nearest enemy
        if (this.autoAim && enemy && dist < 600) { // Aim range slightly larger than shoot range
            autoAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        }

        // Determine if we should shoot
        if (this.isMobile && this.mobileShootActive) {
            shouldShoot = true; // Mobile joystick button
        } else if (this.input.activePointer.isDown) {
            shouldShoot = true; // Mouse hold
        } else if (this.autoFire && enemy && dist < autoRange && !this.gameOver && !this.isPaused) {
            shouldShoot = true; // Auto-fire
        }

        if (shouldShoot && time > this.lastFired + effectiveFireRate && (weapon.ammo > 0 || weapon.ammo === Infinity)) {
            // Pass autoAngle if we have a target, otherwise shootBullet will calculate from pointer
            this.shootBullet(this.input.activePointer, autoAngle);
            this.lastFired = time;
        }
        this.justClicked = false;
    }

    switchWeapon(index) {
        if (index < this.unlockedWeapons.length) {
            this.currentWeaponKey = this.unlockedWeapons[index];
            this.events.emit('weaponSwitch', this.currentWeaponKey); this.playSound('switch');

            // Update visual
            if (this.weaponSprite) {
                this.weaponSprite.setTexture(`weapon_${this.currentWeaponKey}`);
                // Adjust origin based on weapon type if needed (optional polish)
            }
        }
    }

    shootBullet(pointer, overrideAngle) {
        const weapon = this.weapons[this.currentWeaponKey];
        if (weapon.ammo <= 0 && weapon.ammo !== Infinity) return;

        const time = this.time.now;
        // Double check fire rate (though handleContinuousShooting checks it too)
        // We update lastFired in handleContinuousShooting, so we can skip this check or keep it for safety
        // if (time < this.lastFired + weapon.fireRate) return; 

        let angle;
        if (overrideAngle !== undefined && overrideAngle !== null) {
            angle = overrideAngle;
        } else if (this.isMobile) {
            angle = this.player.rotation;
        } else {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        }

        if (weapon.burst) {
            // Burst fire logic
            this.time.addEvent({
                delay: 100, repeat: 2,
                callback: () => this.fireBullet(angle, weapon)
            });
        } else if (weapon.name === 'Chain Gun') {
            // Spin up mechanic
            if (this.input.activePointer.isDown) {
                weapon.spinUp = Math.min((weapon.spinUp || 0) + 0.1, 1);
                // Fire rate increases (delay decreases) as spinUp increases
                // Base delay 200ms -> Min delay 50ms
                const currentDelay = 200 - (150 * weapon.spinUp);
                // Simplified: Fire multiple pellets if fully spun
                if (weapon.spinUp > 0.8 && Math.random() < 0.5) {
                    this.fireBullet(angle + 0.1, weapon); // Extra shot
                }
            } else {
                weapon.spinUp = Math.max((weapon.spinUp || 0) - 0.05, 0);
            }

            const spreadAngle = angle + (Math.random() - 0.5) * weapon.spread;
            this.fireBullet(spreadAngle, weapon);
        } else {
            for (let i = 0; i < weapon.pellets; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * weapon.spread;
                this.fireBullet(spreadAngle, weapon);
            }
        }

        if (weapon.ammo !== Infinity) weapon.ammo--;

        // Phase 5: Spread Shot Mod
        if (this.activePower && this.activePower.id === 'mod_spread') {
            this.fireBullet(angle - 0.2, weapon);
            this.fireBullet(angle + 0.2, weapon);
        }

        // Muzzle flash with glow effect
        const mfX = this.player.x + Math.cos(angle) * 20;
        const mfY = this.player.y + Math.sin(angle) * 20;
        const muzzle = this.add.image(mfX, mfY, 'muzzle_flash')
            .setDepth(11).setScale(1.5).setBlendMode(Phaser.BlendModes.ADD).setRotation(angle);
        this.tweens.add({ targets: muzzle, alpha: 0, scale: 0.5, duration: 80, onComplete: () => muzzle.destroy() });

        this.playSound('shoot');
        if (weapon.ammo === 0 && weapon.ammo !== Infinity) {
            this.switchWeapon(0);
            this.showDamageNumber(this.player.x, this.player.y - 40, 'NO AMMO!', '#ff0000');
        }
    }

    fireBullet(angle, weapon) {
        // Create bullet at player position + offset
        const offset = 20;
        const x = this.player.x + Math.cos(angle) * offset;
        const y = this.player.y + Math.sin(angle) * offset;

        const bullet = this.bullets.get(x, y, weapon.bulletTexture);
        if (bullet) {
            bullet.setActive(true).setVisible(true);
            bullet.setRotation(angle);
            this.physics.velocityFromRotation(angle, weapon.bulletSpeed, bullet.body.velocity);
            bullet.damage = weapon.bulletDamage;
            bullet.knockback = weapon.weaponKnockback || 0;
            bullet.pierce = weapon.pierce || 0;
            bullet.born = this.time.now;
            bullet.lifespan = weapon.bulletLifetime;

            // Stats
            // weapon.shotsFired++; 
        }
    }

    // ==================== ZOMBIE SYSTEM ====================
    spawnZombie(x, y) {
        if (this.gameOver || this.isPaused || this.upgradeMenuActive || this.stageClearActive) return;
        if (!this.currentLevel.isBoss && this.zombiesSpawnedThisWave >= this.zombiesPerWave) return;

        // Readme: Never exceed maxEnemies on screen
        const aliveZombies = this.zombies.getChildren().filter(z => z.active).length;
        if (aliveZombies >= (this.maxEnemiesOnScreen || 25)) return;

        const camera = this.cameras.main; const margin = 120;

        // Find valid spawn pos if not provided
        if (x === undefined || y === undefined) {
            let attempts = 0;
            // Linear Level Logic: Bias towards spawning ahead
            do {
                attempts++;
                if (this.worldWidth > 2000) { // Linear
                    // 70% chance to spawn ahead, 30% behind/around
                    if (Math.random() < 0.7) {
                        x = this.cameras.main.scrollX + this.cameras.main.width + margin;
                        y = Phaser.Math.Between(50, this.worldHeight - 50);
                    } else {
                        x = this.cameras.main.scrollX - margin;
                        y = Phaser.Math.Between(50, this.worldHeight - 50);
                    }
                } else { // Classic arena
                    const side = Phaser.Math.Between(0, 3);
                    switch (side) {
                        case 0: x = Phaser.Math.Between(camera.scrollX - margin, camera.scrollX + camera.width + margin); y = camera.scrollY - margin; break;
                        case 1: x = camera.scrollX + camera.width + margin; y = Phaser.Math.Between(camera.scrollY - margin, camera.scrollY + camera.height + margin); break;
                        case 2: x = Phaser.Math.Between(camera.scrollX - margin, camera.scrollX + camera.width + margin); y = camera.scrollY + camera.height + margin; break;
                        case 3: x = camera.scrollX - margin; y = Phaser.Math.Between(camera.scrollY - margin, camera.scrollY + camera.height + margin); break;
                    }
                }
                x = Phaser.Math.Clamp(x, 20, this.worldWidth - 20); y = Phaser.Math.Clamp(y, 20, this.worldHeight - 20);
            } while (attempts < 2);
        }

        // Determine Type based on level/wave or random
        let type = 'normal';
        const wave = this.wave;
        const roll = Math.random();

        // Progressive difficulty spawn logic
        if (wave >= 12 && roll < 0.05) type = 'summoner';
        else if (wave >= 10 && roll < 0.08) type = 'tank';
        else if (wave >= 9 && roll < 0.10) type = 'shield_bearer';
        else if (wave >= 8 && roll < 0.12) type = 'charger';
        else if (wave >= 7 && roll < 0.14) type = 'stalker';
        else if (wave >= 6 && roll < 0.15) type = 'spitter';
        else if (wave >= 4 && roll < 0.20) type = 'burster';
        else if (wave >= 2 && roll < 0.25) type = 'runner';

        // Use pool if defined
        if (this.currentLevel.enemyPool && this.currentLevel.enemyPool.length > 0) {
            type = Phaser.Utils.Array.GetRandom(this.currentLevel.enemyPool);
        }

        let zombie = this.zombies.get(x, y, 'zombie');
        if (!zombie) return;

        zombie.setActive(true).setVisible(true);
        zombie.enableBody(true, x, y, true, true);

        let hp = this.zombieBaseHP;
        let speed = this.zombieBaseSpeed;
        let damage = this.zombieBaseDamage;
        let xpReward = 10 + this.currentLevel.level;
        let bodySize = 26;
        let texture = 'zombie';
        let tint = 0xffffff;
        let scale = 1;

        switch (type) {
            case 'runner': texture = 'zombie_runner'; hp *= 0.6; speed *= 1.8; damage *= 0.8; xpReward += 5; bodySize = 20; break;
            case 'tank': texture = 'zombie_tank'; hp *= 3; speed *= 0.6; damage *= 1.5; scale = 1.3; xpReward += 20; bodySize = 36; break;
            case 'burster': texture = 'zombie'; hp *= 0.8; speed *= 1.2; tint = 0xff4400; xpReward += 10;
                zombie.eliteModifier = 'exploder'; zombie.isElite = true; break;
            case 'charger': texture = 'zombie_tank'; hp *= 1.5; speed *= 0.9; scale = 0.9; tint = 0x5555ff; xpReward += 15; bodySize = 30;
                zombie.chargeCooldown = 0; zombie.isCharging = false; break;
            case 'spitter': texture = 'zombie_runner'; hp *= 0.7; speed *= 0.8; tint = 0x00ff00; xpReward += 15;
                zombie.attackCooldown = 0; break;
            case 'summoner': texture = 'zombie_boss'; hp *= 1.2; speed *= 0.5; scale = 0.8; tint = 0xaa00aa; xpReward += 25;
                zombie.summonCooldown = 0; break;
            case 'shield_bearer': texture = 'zombie_tank'; hp *= 1.4; speed *= 0.7; scale = 1.1; tint = 0x555555; xpReward += 20; bodySize = 32;
                // Add Shield visual
                const shield = this.add.image(0, 20, 'enemy_shield').setOrigin(0.5, 0.5);
                zombie.shieldVisual = shield; // Link to zombie to update pos
                break;
            case 'stalker': texture = 'zombie_runner'; hp *= 0.5; speed *= 1.4; tint = 0x333333; xpReward += 18;
                zombie.stalkTimer = 0; zombie.isHidden = false; zombie.setAlpha(0.8);
                break;
        }

        zombie.setTexture(texture);
        zombie.hp = hp; zombie.maxHP = hp; zombie.damage = damage; zombie.speed = speed;
        zombie.xpReward = xpReward; zombie.zombieType = type;
        zombie.setScale(scale).setTint(tint);
        if (type !== 'stalker') zombie.setAlpha(1); // Stalker has its own alpha logic
        zombie.setPipeline('Light2D');

        zombie.body.setSize(bodySize, bodySize);
        zombie.body.setOffset((zombie.width - bodySize) / 2, (zombie.height - bodySize) / 2);

        zombie.isAttached = false;
        zombie.isBossZombie = false;

        // Phase 2: Elite zombie chance
        if (this.wave >= 3 && Math.random() < this.eliteSpawnChance && ['normal', 'runner'].includes(type)) {
            this.makeElite(zombie);
        }

        this.zombiesSpawnedThisWave++;
    }

    updateZombies() {
        if (!this.player.active) return;
        const player = this.player;

        this.zombies.getChildren().forEach(zombie => {
            if (!zombie.active) return;

            const dist = Phaser.Math.Distance.Between(zombie.x, zombie.y, player.x, player.y);

            // Charger Logic
            if (zombie.zombieType === 'charger') {
                if (zombie.isCharging) {
                    if (zombie.body.speed < 50) {
                        zombie.isCharging = false;
                        zombie.chargeCooldown = 2000;
                        zombie.speed = zombie.origSpeed || this.zombieBaseSpeed * 0.8;
                        zombie.setTint(0x888888);
                        this.time.delayedCall(1000, () => { if (zombie.active) zombie.clearTint(); });
                    }
                } else {
                    if (dist < 400 && dist > 100 && (!zombie.chargeCooldown || zombie.chargeCooldown <= 0)) {
                        zombie.isCharging = true;
                        zombie.origSpeed = zombie.speed;
                        this.physics.moveToObject(zombie, player, 500);
                        const telegraph = this.add.circle(zombie.x, zombie.y, 10, 0xff0000, 0.5).setDepth(10);
                        this.tweens.add({ targets: telegraph, scale: 3, alpha: 0, duration: 500, onComplete: () => telegraph.destroy() });
                        this.time.delayedCall(1500, () => { if (zombie.active) zombie.isCharging = false; });
                    } else {
                        if (zombie.chargeCooldown > 0) zombie.chargeCooldown -= 16;
                        this.physics.moveToObject(zombie, player, zombie.speed);
                    }
                }
            }
            // Spitter Logic
            else if (zombie.zombieType === 'spitter') {
                if (dist < 300) {
                    zombie.body.setVelocity(0, 0); // Stop to shoot
                    if (!zombie.attackCooldown || zombie.attackCooldown <= 0) {
                        this.spitProjectile(zombie, player);
                        zombie.attackCooldown = 2000;
                    } else {
                        zombie.attackCooldown -= 16;
                    }
                } else {
                    this.physics.moveToObject(zombie, player, zombie.speed);
                }
            }
            // Summoner Logic
            else if (zombie.zombieType === 'summoner') {
                // Keep distance
                if (dist < 250) {
                    const angle = Phaser.Math.Angle.Between(player.x, player.y, zombie.x, zombie.y);
                    this.physics.velocityFromRotation(angle, zombie.speed, zombie.body.velocity);
                } else if (dist > 400) {
                    this.physics.moveToObject(zombie, player, zombie.speed);
                } else {
                    zombie.body.setVelocity(0, 0); // Stand still
                }

                if (!zombie.summonCooldown || zombie.summonCooldown <= 0) {
                    this.summonZombies(zombie);
                    zombie.summonCooldown = 5000;
                } else {
                    zombie.summonCooldown -= 16;
                }
            }
            // Shield Bearer Logic
            else if (zombie.zombieType === 'shield_bearer') {
                this.physics.moveToObject(zombie, player, zombie.speed);
                if (zombie.shieldVisual) {
                    const angle = zombie.rotation;
                    // Position shield in front of zombie
                    zombie.shieldVisual.x = zombie.x + Math.cos(angle) * 15;
                    zombie.shieldVisual.y = zombie.y + Math.sin(angle) * 15;
                    zombie.shieldVisual.rotation = angle;
                }
            }
            // Stalker Logic
            else if (zombie.zombieType === 'stalker') {
                this.physics.moveToObject(zombie, player, zombie.speed);
                const distToP = Phaser.Math.Distance.Between(zombie.x, zombie.y, player.x, player.y);

                // Cloak if far, Decloak to attack
                if (distToP > 250) {
                    if (!zombie.isHidden && zombie.alpha > 0.1) {
                        zombie.alpha -= 0.05;
                    }
                    zombie.isHidden = true;
                } else {
                    // Ambush!
                    if (zombie.isHidden) {
                        zombie.isHidden = false;
                        zombie.setTint(0xffffff); // Flash white
                        this.time.delayedCall(200, () => { if (zombie.active) zombie.clearTint(); });
                    }
                    if (zombie.alpha < 1) zombie.alpha += 0.1;
                }
            }
            // Attached Logic
            else if (zombie.isAttached) {
                // Handled in updateAttachedZombies
            }
            // Default Logic
            else {
                this.physics.moveToObject(zombie, player, zombie.speed);
            }

            // Sync rotation
            zombie.rotation = Phaser.Math.Angle.Between(zombie.x, zombie.y, player.x, player.y);
        });
    }

    spitProjectile(spitter, target) {
        if (!this.enemyProjectiles) {
            this.enemyProjectiles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });
            this.physics.add.overlap(this.player, this.enemyProjectiles, (player, proj) => {
                proj.destroy();
                this.takeDamage(10);
            });
        }
        const proj = this.enemyProjectiles.get(spitter.x, spitter.y, 'bullet_flame'); // Re-use flame texture
        if (proj) {
            proj.setActive(true).setVisible(true).setTint(0x00ff00);
            this.physics.moveToObject(proj, target, 300);
            this.time.delayedCall(2000, () => { if (proj.active) proj.destroy(); });
        }
    }

    summonZombies(summoner) {
        // Spawn 2 normal zombies around summoner
        for (let i = 0; i < 2; i++) {
            const ox = Phaser.Math.Between(-40, 40);
            const oy = Phaser.Math.Between(-40, 40);
            this.spawnZombie(summoner.x + ox, summoner.y + oy);
        }
        // Visual effect
        const circle = this.add.circle(summoner.x, summoner.y, 40, 0xaa00aa, 0.3);
        this.tweens.add({ targets: circle, scale: 2, alpha: 0, duration: 500, onComplete: () => circle.destroy() });
    }

    // ==================== COLLISION ====================
    bulletHitZombie(bullet, zombie) {
        if (!bullet.active || !zombie.active) return;
        bullet.setActive(false).setVisible(false); bullet.body.enable = false;

        let damage = bullet.damage;

        // Phase 5: Shield Logic
        if (zombie.zombieType === 'shield_bearer') {
            const angleToBullet = Phaser.Math.Angle.Between(zombie.x, zombie.y, bullet.x, bullet.y);
            const angleDiff = Phaser.Math.Angle.Wrap(angleToBullet - zombie.rotation);
            // Front arc protection (approx 90 degrees)
            if (Math.abs(angleDiff) < 0.8) {
                this.showDamageNumber(zombie.x, zombie.y - 20, 'BLOCKED', '#aaaaaa');
                this.playSound('hit'); // Metal sound ideally
                return; // No damage
            }
        }

        // Phase 5: Stalker Weakness
        if (zombie.zombieType === 'stalker' && !zombie.isHidden) {
            damage *= 1.5; // Critical hit when decloaked
            this.showDamageNumber(zombie.x, zombie.y - 30, 'CRIT!', '#ff0000');
        }

        // Phase 5: Weapon Mod Effects
        if (this.activePower) {
            const ap = this.activePower.id;
            if (ap === 'double_damage') damage *= 2;

            if (ap === 'mod_vampiric') {
                // Heal 1 HP occasionally
                if (Math.random() < 0.3) {
                    this.playerHP = Math.min(this.playerHP + 1, this.playerMaxHP);
                    this.showDamageNumber(this.player.x, this.player.y - 20, '+1', '#ff0033');
                }
            }

            if (ap === 'mod_frostbite') {
                // Slow down zombie
                if (zombie.speed > 5) {
                    zombie.speed *= 0.5;
                    zombie.setTint(0x00aaff);
                    this.time.delayedCall(1000, () => { if (zombie.active) zombie.speed = Math.max(zombie.speed * 2, 10); zombie.clearTint(); });
                }
            }

            if (ap === 'mod_ricochet') {
                // Bounce logic: Find nearest other zombie
                const nearest = this.getNearestZombieExcluding(zombie, 200);
                if (nearest) {
                    // Create new bounce bullet
                    const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, nearest.x, nearest.y);
                    const bounce = this.bullets.get(zombie.x, zombie.y, bullet.texture.key);
                    if (bounce) {
                        bounce.setActive(true).setVisible(true).setBodySize(bullet.width, bullet.height);
                        this.physics.velocityFromRotation(angle, 400, bounce.body.velocity);
                        bounce.damage = damage * 0.5; // Reduced damage on bounce
                        bounce.lifetime = 300;
                        bounce.spawnTime = this.time.now;
                        bounce.setRotation(angle);
                    }
                }
            }
        }
        // Phase 2: Shielded elite — absorbs 50% damage
        if (zombie.eliteModifier === 'shielded' && zombie.shieldHP > 0) {
            zombie.shieldHP -= damage * 0.5;
            damage *= 0.5;
            if (zombie.shieldHP <= 0 && zombie.shieldSprite) {
                zombie.shieldSprite.destroy(); zombie.shieldSprite = null;
                this.showDamageNumber(zombie.x, zombie.y - 20, 'SHIELD BROKEN!', '#00ccff');
            }
        }
        zombie.hp -= damage;

        this.hitParticles.emitParticleAt(bullet.x, bullet.y, 6);
        this.showDamageNumber(zombie.x, zombie.y - 15, Math.round(damage), zombie.isElite ? '#ff8800' : '#ffffff');

        zombie.setTint(0xffffff);
        this.time.delayedCall(80, () => { if (zombie.active) zombie.clearTint(); });

        // Phase 2: Shockwave synergy — shotgun knockback
        if (this.activeSynergies.includes('shockwave_shot') && this.currentWeaponKey === 'shotgun') {
            const knockAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, zombie.x, zombie.y);
            zombie.body.velocity.x += Math.cos(knockAngle) * 300;
            zombie.body.velocity.y += Math.sin(knockAngle) * 300;
        }

        this.playSound('hit');
        if (zombie.hp <= 0) this.killZombie(zombie);
    }

    killZombie(zombie) {
        this.bloodParticles.emitParticleAt(zombie.x, zombie.y, zombie.zombieType === 'boss' ? 25 : 10);
        const splatKey = 'blood_splat_' + Phaser.Math.Between(1, 3);
        const splat = this.add.image(zombie.x, zombie.y, splatKey)
            .setDepth(1).setAlpha(0.6).setScale(0.8 + Math.random() * 0.8)
            .setAngle(Phaser.Math.Between(0, 360));
        this.tweens.add({ targets: splat, alpha: 0.15, duration: 30000 });

        if (zombie.zombieType === 'boss') this.cameras.main.shake(400, 0.02);

        // Phase 2: Exploder elite — damages nearby zombies & player
        if (zombie.eliteModifier === 'exploder') {
            this.cameras.main.shake(200, 0.015);
            this.explode(zombie.x, zombie.y, 100, 50);
        }

        // Cleanup shield visual
        if (zombie.shieldVisual) {
            zombie.shieldVisual.destroy();
            zombie.shieldVisual = null;
        }

        // Phase 5: Weapon Mod Effects
        if (this.activePower) {
            const ap = this.activePower.id;
            if (ap === 'double_damage') damage *= 2;

            if (ap === 'mod_vampiric') {
                // Heal 1 HP occasionally
                if (Math.random() < 0.3) {
                    this.playerHP = Math.min(this.playerHP + 1, this.playerMaxHP);
                    this.showDamageNumber(this.player.x, this.player.y - 20, '+1', '#ff0033');
                }
            }

            if (ap === 'mod_frostbite') {
                // Slow down zombie
                if (zombie.speed > 5) {
                    zombie.speed *= 0.5;
                    zombie.setTint(0x00aaff);
                    this.time.delayedCall(1000, () => { if (zombie.active) zombie.speed = Math.max(zombie.speed * 2, 10); zombie.clearTint(); });
                }
            }

            if (ap === 'mod_ricochet') {
                // Bounce logic: Find nearest other zombie
                const nearest = this.getNearestZombieExcluding(zombie, 200);
                if (nearest) {
                    // Create new bounce bullet
                    const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, nearest.x, nearest.y);
                    const bounce = this.bullets.get(zombie.x, zombie.y, bullet.texture.key);
                    if (bounce) {
                        bounce.setActive(true).setVisible(true).setBodySize(bullet.width, bullet.height);
                        this.physics.velocityFromRotation(angle, 400, bounce.body.velocity);
                        bounce.damage = damage * 0.5; // Reduced damage on bounce
                        bounce.lifetime = 300;
                        bounce.spawnTime = this.time.now;
                        bounce.setRotation(angle);
                    }
                }
            }
        }

        // Cleanup elite visuals
        if (zombie.auraSprite) zombie.auraSprite.destroy();
        if (zombie.shieldSprite) zombie.shieldSprite.destroy();
        if (zombie.speedRing) zombie.speedRing.destroy();
        if (zombie.hpBarBg) { zombie.hpBarBg.destroy(); zombie.hpBarFill.destroy(); }

        // Phase 2: Combo system
        const time = this.time.now;
        this.comboCount++;
        this.comboTimer = time + this.comboTimeout;
        this.comboMultiplier = Math.min(1 + this.comboCount * 0.1, this.maxComboMultiplier);
        this.events.emit('comboUpdate', { count: this.comboCount, multiplier: this.comboMultiplier });
        if (this.comboCount >= 5 && !this.comboGlowActive) {
            this.comboGlowActive = true;
            this.player.setTint(0xff8800);
        }
        // Combo sound pitch increases
        if (this.comboCount > 1) this.playSoundPitched('kill', 1 + this.comboCount * 0.05);
        else this.playSound('kill');

        // XP orb with combo multiplier
        const xpOrb = this.xpOrbs.get(zombie.x, zombie.y, 'xp_orb');
        if (xpOrb) {
            xpOrb.setActive(true).setVisible(true).setDepth(3); xpOrb.body.enable = true;
            xpOrb.xpValue = Math.floor(zombie.xpReward * this.comboMultiplier);
            xpOrb.spawnTime = time;
            xpOrb.setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({ targets: xpOrb, y: xpOrb.y - 10, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // Handle attached zombie death
        const attachedIndex = this.attachedZombies.indexOf(zombie);
        if (attachedIndex > -1) {
            this.attachedZombies.splice(attachedIndex, 1);
        }

        // Coin drop
        if (Math.random() < 0.3) {
            const coin = this.coins.get(zombie.x + Phaser.Math.Between(-10, 10), zombie.y + Phaser.Math.Between(-10, 10), 'coin');
            if (coin) {
                coin.setActive(true).setVisible(true).setDepth(3); coin.body.enable = true;
                coin.coinValue = zombie.zombieType === 'boss' ? 50 : 10;
                this.tweens.add({ targets: coin, angle: 360, duration: 2000, repeat: -1 });
            }
        }

        // Phase 2: Power drop
        if (Math.random() < this.powerDropChance) this.spawnPowerDrop(zombie.x, zombie.y);

        // Ammo Drop (5% chance)
        if (Math.random() < 0.05) this.spawnAmmoDrop(zombie.x, zombie.y);

        const scoreGain = Math.floor(10 * this.wave * this.comboMultiplier * (zombie.zombieType === 'boss' ? 10 : zombie.zombieType === 'tank' ? 3 : 1));
        this.score += scoreGain; this.zombiesKilledThisWave++; this.totalZombiesKilled++;
        const comboStr = this.comboCount > 1 ? ` x${this.comboCount}` : '';
        this.showDamageNumber(zombie.x, zombie.y - 30, `+${scoreGain}${comboStr}`, '#ffdd57');

        // Phase 3: Check level completion
        if (zombie.isBossZombie) {
            this.bossActive = false; this.bossRef = null; this.bossesDefeated++;
            this.completeLevel();
        } else if (this.zombiesKilledThisWave >= this.zombiesPerWave && !this.currentLevel.isBoss) {
            this.completeLevel();
        }

        // Kill flash
        const kf = this.add.rectangle(400, 300, 800, 600, 0xffffff, 0.04).setScrollFactor(0).setDepth(80);
        this.tweens.add({ targets: kf, alpha: 0, duration: 100, onComplete: () => kf.destroy() });

        this.tweens.add({
            targets: zombie, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 200,
            ease: 'Power2', onComplete: () => {
                zombie.setActive(false).setVisible(false);
                zombie.disableBody(true, true);
            }
        });
    }

    zombieHitPlayer(player, zombie) {
        if (this.gameOver || this.isDashing) return;

        // Attack/Attach Mechanic
        // 40% chance to attach if not already attached and not dash-immune
        if (!zombie.isAttached && Math.random() < 0.4 && this.attachedZombies.length < 3) {
            zombie.isAttached = true;
            zombie.body.enable = false; // Disable physics so they don't push
            this.attachedZombies.push(zombie);
            this.showDamageNumber(player.x, player.y - 40, 'GRABBED!', '#ff0000');
            this.playSound('hurt');
            return; // Don't deal initial impact damage if grabbing
        }

        // Normal damage if not attached (or if max attached)
        const time = this.time.now;
        if (time < this.lastDamageTime + this.damageCooldown) return;
        this.lastDamageTime = time;
        const dmg = Math.floor(zombie.damage * (this.armorMultiplier || 1));
        this.playerHP -= dmg;
        player.setTint(0xff0000);
        this.time.delayedCall(150, () => { if (player.active) player.clearTint(); });
        this.cameras.main.shake(150, 0.01);

        // Red flash on damage
        const flash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.15)
            .setScrollFactor(0).setDepth(80);
        this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

        this.playSound('hurt');
        if (this.playerHP <= 0) { this.playerHP = 0; this.triggerGameOver(); }
    }

    // ==================== COLLECTIBLES ====================
    collectXP(player, orb) {
        if (!orb.active) return;
        const xpGain = Math.floor(orb.xpValue * (this.xpMultiplier || 1));
        this.playerXP += xpGain;
        this.showDamageNumber(orb.x, orb.y - 10, `+${xpGain} XP`, '#00d4ff');
        orb.setActive(false).setVisible(false); orb.body.enable = false;
        this.playSound('xp');
        if (this.playerXP >= this.xpToNextLevel) this.levelUp();
    }

    collectCoin(player, coin) {
        if (!coin.active) return;
        const coinValue = Math.floor(coin.coinValue * (this.coinDropMultiplier || 1));
        this.score += coinValue; this.totalCoinsEarned += coinValue;
        this.showDamageNumber(coin.x, coin.y - 10, `+${coinValue}`, '#ffdd57');
        coin.setActive(false).setVisible(false); coin.body.enable = false;
        this.playSound('coin');
    }



    showUpgradeMenu() {
        this.upgradeMenuActive = true; this.physics.pause();
        let available = this.upgradePool.filter(u => !(u.once && this.usedOnceUpgrades.includes(u.id)));
        Phaser.Utils.Array.Shuffle(available);
        this.events.emit('showUpgrades', available.slice(0, 3));
    }

    applyUpgrade(upgradeId) {
        const upgrade = this.upgradePool.find(u => u.id === upgradeId);
        if (upgrade) { upgrade.apply(); if (upgrade.once) this.usedOnceUpgrades.push(upgrade.id); }
        // Phase 2: Track for synergies
        if (!this.collectedUpgradeIds.includes(upgradeId)) this.collectedUpgradeIds.push(upgradeId);
        this.checkSynergies();
        this.upgradeMenuActive = false; this.physics.resume();
        this.events.emit('hideUpgrades'); this.playSound('upgrade');
    }

    // ==================== PHASE 3: LEVEL COMPLETION ====================
    completeLevel() {
        if (this.stageClearActive) return;
        this.stageClearActive = true;
        this.levelsCompleted++;

        // Stop spawning
        if (this.waveTimer) this.waveTimer.destroy();

        // Freeze remaining zombies
        this.zombies.getChildren().forEach(z => {
            if (z.active) { z.speed = 0; z.body.setVelocity(0, 0); }
        });

        // Bonus awards — readme coin formula: levelId * 5 + kills * 0.8
        const lvlId = this.currentLevel.level || 1;
        const bonusScore = 100 * lvlId;
        const bonusCoins = Math.floor(lvlId * 5 + this.zombiesKilledThisWave * 0.8);
        this.score += bonusScore;
        this.totalCoinsEarned += bonusCoins;
        this.playerHP = Math.min(this.playerHP + 25, this.playerMaxHP);

        // Refill ammo
        Object.values(this.weapons).forEach(w => { if (w.maxAmmo !== Infinity) w.ammo = Math.min(w.ammo + Math.floor(w.maxAmmo * 0.5), w.maxAmmo); });

        // Save meta progress
        if (!this.metaData.coins) this.metaData.coins = 0;
        this.metaData.coins += bonusCoins;
        if (!this.metaData.highestLevel || this.currentLevelIndex + 2 > this.metaData.highestLevel) {
            this.metaData.highestLevel = this.currentLevelIndex + 2;
        }
        this.metaData.highScore = Math.max(this.metaData.highScore || 0, this.score);
        localStorage.setItem('zombieArena_meta', JSON.stringify(this.metaData));

        // Emit stage clear event
        this.events.emit('stageClear', {
            level: this.currentLevel.level,
            isBoss: this.currentLevel.isBoss,
            bonusScore: bonusScore,
            bonusCoins: bonusCoins,
            totalScore: this.score
        });

        this.cameras.main.flash(400, 0, 255, 150, true);
        this.playSound('levelup');

        // Clean up remaining zombies
        this.time.delayedCall(500, () => {
            this.zombies.getChildren().forEach(z => {
                if (z.active) {
                    this.tweens.add({ targets: z, alpha: 0, duration: 500, onComplete: () => z.destroy() });
                }
            });
        });

        // Advance to next level after delay
        // Advance to next level after UI interaction (handled by UIScene 'nextLevel' event)
        // this.time.delayedCall(3000, () => { ... });
    }

    // Phase 5: Barrel Logic
    bulletHitBarrel(bullet, barrel) {
        if (!bullet.active || !barrel.active) return;
        bullet.setActive(false).setVisible(false);
        barrel.hp -= bullet.damage;
        barrel.setTint(0xff8888);
        this.time.delayedCall(50, () => { if (barrel.active) barrel.clearTint(); });

        if (barrel.hp <= 0) {
            this.explode(barrel.x, barrel.y, 180, 80);
            barrel.destroy();
        }
    }

    // Phase 5: Mini-map Logic
    updateMinimap() {
        if (!this.minimapContainer.visible) return;

        // Player dot (relative to world)
        // Map world coordinates to minimap coordinates
        // World: 0 -> worldWidth / 2 -> worldWidth
        // MM: 0 -> 60 -> 120 (size)
        // We want the player CENTRED on minimap? Or map entire world?
        // Map entire world approach first (simple radar)

        const scaleX = this.minimapSize / this.worldWidth;
        const scaleY = this.minimapSize / this.worldHeight;

        this.mmPlayer.x = this.player.x * scaleX;
        this.mmPlayer.y = this.player.y * scaleY;

        // Clear old dots
        this.mmDots.forEach(d => d.destroy());
        this.mmDots = [];

        // Enemies
        const maxDots = 20; // Limit rendering
        let count = 0;
        this.zombies.getChildren().forEach(z => {
            if (!z.active || count > maxDots) return;
            // Only show nearby enemies or elites?
            // Show all for now but capped
            const dot = this.add.image(z.x * scaleX, z.y * scaleY, 'mm_enemy').setTint(z.isElite ? 0xffaa00 : 0xff0000);
            this.minimapContainer.add(dot);
            this.mmDots.push(dot);
            count++;
        });

        // Boss
        if (this.bossRef && this.bossRef.active) {
            const bossDot = this.add.image(this.bossRef.x * scaleX, this.bossRef.y * scaleY, 'mm_objective').setScale(1.5);
            this.minimapContainer.add(bossDot);
            this.mmDots.push(bossDot);
        }
    }

    advanceToNextLevel() {
        this.currentLevelIndex++;
        this.currentLevel = this.levelData[this.currentLevelIndex];
        this.wave = this.currentLevel.level;
        this.zombiesSpawnedThisWave = 0;
        this.zombiesKilledThisWave = 0;
        this.zombiesPerWave = this.currentLevel.killTarget || 30;
        this.stageClearActive = false;

        // Scale zombie stats from level data
        this.zombieBaseHP = this.currentLevel.enemyHP || 25;
        this.zombieBaseDamage = 10 + (this.currentLevel.level || 1);
        this.zombieBaseSpeed = this.currentLevel.enemySpeed || 40;
        this.maxEnemiesOnScreen = this.currentLevel.maxEnemies || 8;
        this.enemyPool = this.currentLevel.enemyPool || ['normal'];

        // Start new spawner or boss
        if (this.currentLevel.isBoss) {
            this.time.delayedCall(1500, () => this.spawnBoss());
        } else {
            const spawnRate = this.currentLevel.spawnRate || 1500;
            this.waveTimer = this.time.addEvent({ delay: spawnRate, callback: this.spawnZombie, callbackScope: this, loop: true });
        }

        this.events.emit('levelStart', { level: this.currentLevel.level, theme: this.currentLevel.theme, isBoss: this.currentLevel.isBoss });

        // Arena events on stage changes (mid-stage levels)
        if (this.currentLevel.level % 5 === 3) {
            this.triggerArenaEvent();
        }
    }

    // ==================== PHASE 3: BOSS SYSTEM ====================
    spawnBoss() {
        if (this.gameOver) return;
        this.bossActive = true; this.bossPhase = 1;
        // Boss state machine: IDLE → SELECT_ATTACK → TELEGRAPH → EXECUTE → COOLDOWN
        this.bossState = 'IDLE';
        this.bossStateTimer = 0;
        this.bossCurrentAttack = null;
        this.bossTelegraphObj = null;

        const camera = this.cameras.main;
        const bx = camera.scrollX + camera.width / 2 + Phaser.Math.Between(-150, 150);
        const by = camera.scrollY - 80;

        const boss = this.zombies.create(bx, by, 'zombie_boss');
        if (!boss) return;
        boss.setDepth(9).setScale(1.8).setPipeline('Light2D');

        // Readme: bossHP = 600 + (levelId * 120)
        const lvlId = this.currentLevel.level || 5;
        const bossHP = this.currentLevel.bossHP || (600 + lvlId * 120);
        boss.hp = bossHP; boss.maxHP = bossHP;
        boss.damage = this.zombieBaseDamage * 2.5; boss.speed = 35;
        boss.xpReward = 200 + this.currentLevel.stage * 80;
        boss.zombieType = 'boss'; boss.isBossZombie = true;
        boss.isElite = false; boss.eliteModifier = null;
        boss.body.setSize(50, 50);

        // Stage-specific boss tint
        const bossTints = [0xcc4444, 0x44aa88, 0xaaaa44, 0xaa6644, 0x44cc44, 0xff4400];
        boss.setTint(bossTints[(this.currentLevel.stage || 1) - 1] || 0xcc4444);

        this.bossRef = boss;
        const bossName = this.currentLevel.bossName || `Boss — Stage ${this.currentLevel.stage}`;

        // Boss entrance animation
        boss.setAlpha(0);
        this.tweens.add({
            targets: boss, alpha: 1, scaleX: 2.2, scaleY: 2.2, duration: 800, ease: 'Back.easeOut',
            onComplete: () => { boss.setScale(1.8); }
        });

        this.cameras.main.shake(400, 0.015);
        this.playSound('gameover');
        this.events.emit('bossSpawn', { name: bossName, hp: bossHP });

        // Also spawn some minion zombies during boss fight
        this.waveTimer = this.time.addEvent({
            delay: 3000, callback: () => {
                if (this.bossActive && !this.gameOver && !this.stageClearActive) {
                    this.spawnZombie();
                }
            }, callbackScope: this, loop: true
        });
    }

    updateBoss(time, delta) {
        const boss = this.bossRef;
        if (!boss || !boss.active) return;

        const hpPercent = boss.hp / boss.maxHP;
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);

        // Readme: Boss Rage Mode at HP <= 40%
        if (hpPercent <= 0.40 && this.bossPhase < 3) {
            this.bossPhase = 3;
            boss.setTint(0xff2200);
            this.cameras.main.shake(200, 0.01);
        } else if (hpPercent <= 0.65 && this.bossPhase < 2) {
            this.bossPhase = 2;
            boss.setTint(0xff6600);
        }

        // State machine durations (ms) — faster in rage mode
        const rageMult = this.bossPhase >= 3 ? 0.6 : 1;
        const IDLE_TIME = 800 * rageMult;
        const TELEGRAPH_TIME = 600 * rageMult;
        const EXECUTE_TIME = 500;
        const COOLDOWN_TIME = 1200 * rageMult;

        // Boss state machine: IDLE → SELECT_ATTACK → TELEGRAPH → EXECUTE → COOLDOWN
        switch (this.bossState) {
            case 'IDLE': {
                // Chase player slowly
                this.physics.velocityFromRotation(angle, boss.speed * (this.bossPhase >= 3 ? 1.5 : 1), boss.body.velocity);
                boss.setRotation(angle);
                if (time > this.bossStateTimer + IDLE_TIME) {
                    this.bossState = 'SELECT_ATTACK';
                    this.bossStateTimer = time;
                }
                break;
            }
            case 'SELECT_ATTACK': {
                // Pick an attack based on phase and distance
                const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
                const attacks = ['charge', 'ground_slam'];
                if (dist > 100) attacks.push('charge'); // weight charge for distance
                if (this.bossPhase >= 2) attacks.push('hook_throw');
                if (this.bossPhase >= 3) attacks.push('hook_throw', 'ground_slam'); // more attacks in rage
                this.bossCurrentAttack = Phaser.Utils.Array.GetRandom(attacks);

                boss.body.setVelocity(0, 0); // stop moving during telegraph
                this.bossState = 'TELEGRAPH';
                this.bossStateTimer = time;

                // Show telegraph visual
                this.showBossTelegraph(boss, this.bossCurrentAttack, angle);
                break;
            }
            case 'TELEGRAPH': {
                // Wait for telegraph to finish
                if (time > this.bossStateTimer + TELEGRAPH_TIME) {
                    this.bossState = 'EXECUTE';
                    this.bossStateTimer = time;
                    this.executeBossAttack(boss, this.bossCurrentAttack, angle);
                }
                break;
            }
            case 'EXECUTE': {
                if (time > this.bossStateTimer + EXECUTE_TIME) {
                    this.bossState = 'COOLDOWN';
                    this.bossStateTimer = time;
                }
                break;
            }
            case 'COOLDOWN': {
                // Slowly drift toward player
                this.physics.velocityFromRotation(angle, boss.speed * 0.5, boss.body.velocity);
                boss.setRotation(angle);
                if (time > this.bossStateTimer + COOLDOWN_TIME) {
                    this.bossState = 'IDLE';
                    this.bossStateTimer = time;
                }
                break;
            }
        }
    }

    showBossTelegraph(boss, attack, angle) {
        // Destroy previous telegraph
        if (this.bossTelegraphObj) { this.bossTelegraphObj.destroy(); this.bossTelegraphObj = null; }

        switch (attack) {
            case 'charge': {
                // Red line from boss to player direction
                const endX = boss.x + Math.cos(angle) * 250;
                const endY = boss.y + Math.sin(angle) * 250;
                const g = this.add.graphics().setDepth(11);
                g.lineStyle(4, 0xff0000, 0.6);
                g.lineBetween(boss.x, boss.y, endX, endY);
                this.bossTelegraphObj = g;
                this.tweens.add({ targets: g, alpha: { from: 0.3, to: 0.8 }, duration: 200, yoyo: true, repeat: 2, onComplete: () => { if (g.active) g.destroy(); } });
                break;
            }
            case 'ground_slam': {
                const warn = this.add.circle(boss.x, boss.y, 120, 0xff0000, 0.08).setDepth(3);
                this.bossTelegraphObj = warn;
                this.tweens.add({ targets: warn, alpha: 0.3, scaleX: 1.2, scaleY: 1.2, duration: 500, onComplete: () => { if (warn.active) warn.destroy(); } });
                break;
            }
            case 'hook_throw': {
                // Warning indicator on player position
                const warn = this.add.circle(this.player.x, this.player.y, 30, 0xff6600, 0.15).setDepth(3);
                this.bossTelegraphObj = warn;
                this.tweens.add({ targets: warn, alpha: 0.4, scaleX: 1.5, scaleY: 1.5, duration: 500, onComplete: () => { if (warn.active) warn.destroy(); } });
                break;
            }
        }
    }

    executeBossAttack(boss, attack, angle) {
        if (!boss.active || this.gameOver) return;
        const rageDmgMult = this.bossPhase >= 3 ? 1.5 : 1;

        switch (attack) {
            case 'charge': {
                // Charge: telegraphTime=600, damage=25, cooldown=1200
                const chargeAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                this.physics.velocityFromRotation(chargeAngle, 450, boss.body.velocity);
                this.cameras.main.shake(100, 0.008);
                this.time.delayedCall(400, () => {
                    if (boss.active) {
                        boss.body.setVelocity(0, 0);
                        // Damage check at charge end
                        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y) < 60) {
                            if (!this.isDashing) {
                                this.playerHP -= Math.floor(25 * rageDmgMult);
                                this.cameras.main.shake(150, 0.01);
                            }
                        }
                    }
                });
                break;
            }
            case 'ground_slam': {
                // Ground Slam: telegraphTime=600, damage=30, cooldown=1200
                const slamR = 120;
                const slam = this.add.circle(boss.x, boss.y, slamR, 0xff4400, 0.5).setDepth(3);
                this.tweens.add({
                    targets: slam, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300, onComplete: () => slam.destroy()
                });
                this.cameras.main.shake(200, 0.015);
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y) < slamR) {
                    if (!this.isDashing) {
                        this.playerHP -= Math.floor(30 * rageDmgMult);
                    }
                }
                // Knockback nearby non-boss zombies
                this.zombies.getChildren().forEach(z => {
                    if (!z.active || z === boss) return;
                    if (Phaser.Math.Distance.Between(z.x, z.y, boss.x, boss.y) < slamR) {
                        const ka = Phaser.Math.Angle.Between(boss.x, boss.y, z.x, z.y);
                        z.body.setVelocity(Math.cos(ka) * 300, Math.sin(ka) * 300);
                    }
                });
                break;
            }
            case 'hook_throw': {
                // Hook Throw: telegraphTime=600, damage=20, cooldown=1200
                const projCount = 3 + this.bossPhase;
                for (let i = 0; i < projCount; i++) {
                    const spreadAngle = angle + (i - (projCount - 1) / 2) * 0.35;
                    const px = boss.x + Math.cos(spreadAngle) * 50;
                    const py = boss.y + Math.sin(spreadAngle) * 50;
                    const proj = this.add.circle(px, py, 7, 0xff6600, 0.9).setDepth(10);
                    const targetX = px + Math.cos(spreadAngle) * 320;
                    const targetY = py + Math.sin(spreadAngle) * 320;
                    this.tweens.add({
                        targets: proj, x: targetX, y: targetY,
                        alpha: 0, duration: 700, onComplete: () => {
                            if (Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 35) {
                                if (!this.isDashing) this.playerHP -= Math.floor(20 * rageDmgMult);
                            }
                            proj.destroy();
                        }
                    });
                }
                break;
            }
        }
    }

    // ==================== CLEANUP ====================
    cleanupBullets() {
        const time = this.time.now;
        this.bullets.getChildren().forEach((bullet) => {
            if (bullet.active && time > bullet.spawnTime + bullet.lifetime) {
                bullet.setActive(false).setVisible(false); bullet.body.enable = false;
            }
        });
    }

    cleanupOrbs() {
        const time = this.time.now;
        this.xpOrbs.getChildren().forEach((orb) => {
            if (orb.active && time > orb.spawnTime + 15000) { orb.setActive(false).setVisible(false); orb.body.enable = false; }
        });
    }

    // ==================== FEEDBACK ====================
    showDamageNumber(x, y, text, color = '#ffffff') {
        const dmgText = this.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: '14px', color: color,
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);
        // Static/Less Moving Damage Numbers
        this.tweens.add({
            targets: dmgText, y: y - 10, alpha: 0, scale: 1.4,
            duration: 700, ease: 'Power2', onComplete: () => dmgText.destroy()
        });
    }

    // ==================== SOUND ====================
    playSound(type) {
        if (!this.soundEnabled || !window.gameAudioCtx) return;
        const ctx = window.gameAudioCtx; if (ctx.state === 'suspended') return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            switch (type) {
                case 'shoot': osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
                case 'hit': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.08); gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); osc.start(now); osc.stop(now + 0.08); break;
                case 'kill': osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); osc.start(now); osc.stop(now + 0.2); break;
                case 'hurt': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.3); gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
                case 'explosion': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); osc.start(now); osc.stop(now + 0.5); break;
                case 'xp': osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(900, now + 0.08); gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); osc.start(now); osc.stop(now + 0.08); break;
                case 'coin': osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(1200, now + 0.05); gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); osc.start(now); osc.stop(now + 0.15); break;
                case 'levelup': osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2); osc.frequency.setValueAtTime(1200, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); osc.start(now); osc.stop(now + 0.5); break;
                case 'dash': osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); osc.start(now); osc.stop(now + 0.15); break;
                case 'switch': osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(700, now + 0.05); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
                case 'upgrade': osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(800, now + 0.15); osc.frequency.setValueAtTime(1000, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
                case 'gameover': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(50, now + 1); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1); osc.start(now); osc.stop(now + 1); break;
            }
        } catch (e) { }
    }

    // ==================== PAUSE ====================
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) this.physics.pause(); else this.physics.resume();
        this.events.emit('pauseToggle', this.isPaused);
    }

    // ==================== GAME OVER ====================
    triggerGameOver() {
        this.gameOver = true; this.player.setTint(0xff0000); this.physics.pause();
        if (this.waveTimer) this.waveTimer.destroy();
        // Cleanup turrets
        this.turrets.forEach(t => { if (t.sprite) t.sprite.destroy(); });
        this.turrets = [];

        // Save meta progress (coins earned during run)
        if (!this.metaData.coins) this.metaData.coins = 0;
        this.metaData.coins += this.totalCoinsEarned;
        this.metaData.highScore = Math.max(this.metaData.highScore || 0, this.score);
        localStorage.setItem('zombieArena_meta', JSON.stringify(this.metaData));
        localStorage.setItem('zombieArena_highScore', Math.max(this.score, parseInt(localStorage.getItem('zombieArena_highScore') || '0')).toString());

        // Save leaderboard entry (System 7)
        const lbKey = 'zombieArena_leaderboard';
        const lb = JSON.parse(localStorage.getItem(lbKey) || '[]');
        lb.push({ score: this.score, levels: this.levelsCompleted, date: Date.now() });
        // Keep top 20 stored locally
        lb.sort((a, b) => b.score - a.score);
        if (lb.length > 20) lb.pop();
        localStorage.setItem(lbKey, JSON.stringify(lb));

        this.playSound('gameover');
        this.cameras.main.shake(500, 0.02);
        this.time.delayedCall(500, () => { this.cameras.main.fade(800, 50, 0, 0); });
        this.events.emit('gameOver', {
            score: this.score, wave: this.wave, level: this.playerLevel,
            zombiesKilled: this.totalZombiesKilled,
            highScore: Math.max(this.score, this.metaData.highScore || 0),
            maxCombo: this.comboCount, synergies: this.activeSynergies,
            levelsCompleted: this.levelsCompleted, bossesDefeated: this.bossesDefeated,
            coinsEarned: this.totalCoinsEarned, stageLevel: this.currentLevel.level
        });
    }

    // ==================== PHASE 2: SYSTEM 2 — ELITE ZOMBIES ====================
    makeElite(zombie) {
        zombie.isElite = true;
        zombie.eliteModifier = Phaser.Utils.Array.GetRandom(this.eliteModifiers);
        zombie.hp *= 2; zombie.maxHP *= 2;
        zombie.xpReward *= 2.5;
        zombie.setScale(1.2);

        // Aura ring visual
        let auraKey;
        switch (zombie.eliteModifier) {
            case 'shielded': auraKey = 'elite_shield_aura'; break;
            case 'exploder': auraKey = 'elite_exploder_aura'; break;
            case 'regenerator': auraKey = 'elite_regen_aura'; break;
            case 'speed_aura': auraKey = 'elite_speed_aura'; break;
        }
        zombie.auraSprite = this.add.image(zombie.x, zombie.y, auraKey).setDepth(7).setAlpha(0.7);
        this.tweens.add({ targets: zombie.auraSprite, angle: 360, duration: 3000, repeat: -1 });

        // Health bar
        zombie.hpBarBg = this.add.rectangle(zombie.x, zombie.y - 22, 30, 4, 0x333333).setDepth(15);
        zombie.hpBarFill = this.add.rectangle(zombie.x, zombie.y - 22, 30, 4, 0xff0000).setDepth(16).setOrigin(0, 0.5);
        zombie.hpBarFill.x = zombie.x - 15;

        // Modifier-specific setup
        if (zombie.eliteModifier === 'shielded') {
            zombie.shieldHP = zombie.maxHP * 0.5;
            zombie.shieldSprite = this.add.image(zombie.x, zombie.y, 'shield_bubble').setDepth(9).setAlpha(0.6);
        }
        if (zombie.eliteModifier === 'speed_aura') {
            zombie.speedRing = this.add.image(zombie.x, zombie.y, 'speed_aura_ring').setDepth(6).setAlpha(0.3);
        }
        if (zombie.eliteModifier === 'regenerator') {
            zombie.lastRegenTime = 0;
        }
    }

    updateEliteZombies(time, delta) {
        this.zombies.getChildren().forEach(zombie => {
            if (!zombie.active || !zombie.isElite) return;
            // Update visual positions
            if (zombie.auraSprite) { zombie.auraSprite.x = zombie.x; zombie.auraSprite.y = zombie.y; }
            if (zombie.shieldSprite) { zombie.shieldSprite.x = zombie.x; zombie.shieldSprite.y = zombie.y; }
            if (zombie.speedRing) { zombie.speedRing.x = zombie.x; zombie.speedRing.y = zombie.y; }
            if (zombie.hpBarBg) {
                zombie.hpBarBg.x = zombie.x; zombie.hpBarBg.y = zombie.y - 22;
                zombie.hpBarFill.x = zombie.x - 15; zombie.hpBarFill.y = zombie.y - 22;
                zombie.hpBarFill.width = 30 * (zombie.hp / zombie.maxHP);
            }
            // Regenerator: slow heal
            if (zombie.eliteModifier === 'regenerator' && time > (zombie.lastRegenTime || 0) + 1000) {
                zombie.hp = Math.min(zombie.hp + zombie.maxHP * 0.03, zombie.maxHP);
                zombie.lastRegenTime = time;
            }
            // Speed aura: boost nearby zombies
            if (zombie.eliteModifier === 'speed_aura') {
                this.zombies.getChildren().forEach(other => {
                    if (!other.active || other === zombie) return;
                    const d = Phaser.Math.Distance.Between(zombie.x, zombie.y, other.x, other.y);
                    if (d < 150) other.speed = Math.max(other.speed, (other.speed || 80) * 1.002);
                });
            }
        });
    }

    // ==================== PHASE 2: SYSTEM 3 — SYNERGIES ====================
    checkSynergies() {
        this.synergies.forEach(syn => {
            if (syn.active) return;
            const hasAll = syn.requires.every(r => this.collectedUpgradeIds.includes(r));
            if (hasAll) {
                syn.active = true;
                this.activeSynergies.push(syn.id);
                this.events.emit('synergyActivated', syn);
                this.showDamageNumber(this.player.x, this.player.y - 50, `⚡ ${syn.name}!`, '#ffaa00');
                this.cameras.main.flash(200, 255, 170, 0, true);
                this.playSound('levelup');
            }
        });
    }

    // ==================== PHASE 2: SYSTEM 4 — POWER DROPS ====================
    spawnPowerDrop(x, y) {
        const type = Phaser.Utils.Array.GetRandom(this.powerTypes);
        const drop = this.powerDrops.get(x, y, type.texture);
        if (!drop) return;
        drop.setActive(true).setVisible(true).setDepth(4); drop.body.enable = true;
        drop.powerType = type;
        drop.setBlendMode(Phaser.BlendModes.ADD);
        drop.setPipeline('Light2D');
        // Pulse animation
        this.tweens.add({ targets: drop, scaleX: 1.3, scaleY: 1.3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        // Timeout — disappear after 8s
        drop.spawnTime = this.time.now;
        this.time.delayedCall(8000, () => { if (drop.active) { drop.setActive(false).setVisible(false); drop.body.enable = false; } });
    }

    collectPowerDrop(player, drop) {
        if (!drop.active) return;
        const type = drop.powerType;
        drop.setActive(false).setVisible(false); drop.body.enable = false;

        if (type.id === 'health_burst') {
            this.playerHP = Math.min(this.playerHP + 40, this.playerMaxHP);
            this.showDamageNumber(player.x, player.y - 20, '+40 HP', type.color);
            this.cameras.main.flash(150, 0, 255, 130, true);
        } else {
            this.activePower = type;
            this.powerTimer = this.time.now + type.duration;
            if (type.id === 'freeze') {
                this.zombies.getChildren().forEach(z => {
                    if (z.active) { z.origSpeed = z.speed; z.speed = 0; z.setTint(0x88ddff); }
                });
            }
            this.events.emit('powerActivated', type);
        }
        this.showDamageNumber(player.x, player.y - 30, type.name + '!', type.color);
        this.playSound('upgrade');
    }

    deactivatePower() {
        if (!this.activePower) return;
        if (this.activePower.id === 'freeze') {
            this.zombies.getChildren().forEach(z => {
                if (z.active) { z.speed = z.origSpeed || 80; z.clearTint(); }
            });
        }
        this.events.emit('powerDeactivated');
        this.activePower = null;
    }

    spawnAmmoDrop(x, y) {
        const drop = this.ammoDrops.get(x, y, 'ammo_box');
        if (!drop) return;
        drop.setActive(true).setVisible(true).setDepth(4); drop.body.enable = true;
        drop.setBlendMode(Phaser.BlendModes.NORMAL);
        this.tweens.add({ targets: drop, y: drop.y - 5, duration: 800, yoyo: true, repeat: -1 });
        drop.spawnTime = this.time.now;
        this.time.delayedCall(15000, () => { if (drop.active) { drop.setActive(false).setVisible(false); drop.body.enable = false; } });
    }

    collectAmmo(player, drop) {
        if (!drop.active) return;
        drop.setActive(false).setVisible(false); drop.body.enable = false;

        // Refill 30% of max ammo for all unlocked weapons (except pistol)
        let refilled = false;
        this.unlockedWeapons.forEach(key => {
            const w = this.weapons[key];
            if (w.maxAmmo !== Infinity) {
                const amount = Math.floor(w.maxAmmo * 0.3);
                if (w.ammo < w.maxAmmo) {
                    w.ammo = Math.min(w.ammo + amount, w.maxAmmo);
                    refilled = true;
                }
            }
        });

        if (refilled) {
            this.showDamageNumber(player.x, player.y - 30, 'AMMO +', '#ddccaa');
            this.playSound('upgrade'); // Reuse upgrade sound or coin sound
        } else {
            this.showDamageNumber(player.x, player.y - 30, 'MAX AMMO', '#ffffff');
        }
    }

    // ==================== PHASE 2: SYSTEM 5 — ARENA EVENTS ====================
    triggerArenaEvent() {
        const events = ['darkness', 'meteor_strikes', 'turret_spawn', 'slow_motion'];
        this.arenaEventType = Phaser.Utils.Array.GetRandom(events);
        this.arenaEventActive = true;
        const duration = Phaser.Math.Between(10000, 15000);
        this.arenaEventTimer = this.time.now + duration;

        this.events.emit('arenaEvent', { type: this.arenaEventType, duration: duration });

        switch (this.arenaEventType) {
            case 'darkness':
                this.vignetteOverlay.setAlpha(0.9);
                if (this.playerGlow) this.playerGlow.setScale(4).setAlpha(0.4);
                break;
            case 'meteor_strikes':
                this.meteorTimer = this.time.addEvent({
                    delay: 800, loop: true,
                    callback: () => {
                        if (!this.arenaEventActive) return;
                        const mx = Phaser.Math.Between(this.cameras.main.scrollX - 50, this.cameras.main.scrollX + 850);
                        const my = Phaser.Math.Between(this.cameras.main.scrollY - 50, this.cameras.main.scrollY + 650);
                        // Warning circle
                        const warn = this.add.circle(mx, my, 30, 0xff0000, 0.15).setDepth(3);
                        this.tweens.add({
                            targets: warn, alpha: 0.4, scale: 0.5, duration: 600, onComplete: () => {
                                warn.destroy();
                                const met = this.add.image(mx, my, 'meteor').setDepth(13).setScale(2).setBlendMode(Phaser.BlendModes.ADD);
                                this.tweens.add({ targets: met, alpha: 0, scale: 0.3, duration: 300, onComplete: () => met.destroy() });
                                this.cameras.main.shake(100, 0.008);
                                const crater = this.add.image(mx, my, 'meteor_crater').setDepth(1.5).setAlpha(0.5);
                                this.tweens.add({ targets: crater, alpha: 0, duration: 10000 });
                                // Damage nearby zombies
                                this.zombies.getChildren().forEach(z => {
                                    if (!z.active) return;
                                    if (Phaser.Math.Distance.Between(z.x, z.y, mx, my) < 60) { z.hp -= 30; if (z.hp <= 0) this.killZombie(z); }
                                });
                                const pd = Phaser.Math.Distance.Between(this.player.x, this.player.y, mx, my);
                                if (pd < 50 && !this.isDashing) { this.playerHP -= 10; }
                            }
                        });
                    }
                });
                break;
            case 'turret_spawn':
                for (let i = 0; i < 2; i++) {
                    const tx = this.player.x + Phaser.Math.Between(-150, 150);
                    const ty = this.player.y + Phaser.Math.Between(-150, 150);
                    const turretSprite = this.add.image(tx, ty, 'turret').setDepth(5).setPipeline('Light2D');
                    this.turrets.push({ sprite: turretSprite, x: tx, y: ty, lastFire: 0 });
                }
                break;
            case 'slow_motion':
                this.physics.world.timeScale = 2; // Slows physics
                this.time.timeScale = 0.5;
                break;
        }
    }

    endArenaEvent() {
        switch (this.arenaEventType) {
            case 'darkness':
                this.vignetteOverlay.setAlpha(0.6);
                if (this.playerGlow) this.playerGlow.setScale(2.5).setAlpha(0.2);
                break;
            case 'meteor_strikes':
                if (this.meteorTimer) this.meteorTimer.destroy();
                break;
            case 'turret_spawn':
                this.turrets.forEach(t => { if (t.sprite) t.sprite.destroy(); });
                this.turrets = [];
                break;
            case 'slow_motion':
                this.physics.world.timeScale = 1;
                this.time.timeScale = 1;
                break;
        }
        this.arenaEventActive = false;
        this.arenaEventType = null;
        this.events.emit('arenaEventEnd');
    }

    updateTurrets(time) {
        this.turrets.forEach(turret => {
            if (!turret.sprite || !turret.sprite.active) return;
            // Find closest zombie
            let closest = null, closestDist = 300;
            this.zombies.getChildren().forEach(z => {
                if (!z.active) return;
                const d = Phaser.Math.Distance.Between(turret.x, turret.y, z.x, z.y);
                if (d < closestDist) { closest = z; closestDist = d; }
            });
            if (closest && time > turret.lastFire + 400) {
                turret.lastFire = time;
                const angle = Phaser.Math.Angle.Between(turret.x, turret.y, closest.x, closest.y);
                turret.sprite.setRotation(angle);
                const bullet = this.bullets.get(turret.x, turret.y, 'bullet_ar');
                if (bullet) {
                    bullet.setActive(true).setVisible(true).setDepth(5).setScale(1).setAlpha(1);
                    bullet.body.enable = true;
                    this.physics.velocityFromRotation(angle, 500, bullet.body.velocity);
                    bullet.setRotation(angle); bullet.spawnTime = time; bullet.damage = 15; bullet.lifetime = 800;
                }
            }
        });
    }

    // ==================== PHASE 2: SYSTEM 6 — ENHANCED FEEDBACK ====================
    // Camera punch on dash
    performDash() {
        if (!this.canDash || this.isDashing || this.gameOver) return;
        const time = this.time.now;
        this.isDashing = true; this.canDash = false;

        // Shake off attached zombies
        if (this.attachedZombies.length > 0) {
            this.attachedZombies.forEach(z => {
                if (z.active) {
                    z.isAttached = false;
                    z.body.enable = true;
                    // Fling them away
                    const flingAngle = Phaser.Math.Between(0, 360);
                    this.physics.velocityFromRotation(flingAngle, 500, z.body.velocity);
                    this.showDamageNumber(z.x, z.y, 'SHAKE OFF!', '#ffffff');
                }
            });
            this.attachedZombies = [];
        }
        this.dashEndTime = time + this.dashDuration; this.dashCooldownTimer = time + this.dashCooldown;
        let vx = this.player.body.velocity.x, vy = this.player.body.velocity.y;
        const len = Math.sqrt(vx * vx + vy * vy);
        if (len < 10) { vx = Math.cos(this.player.rotation); vy = Math.sin(this.player.rotation); }
        else { vx /= len; vy /= len; }
        this.player.setVelocity(vx * this.dashSpeed, vy * this.dashSpeed);
        this.player.setAlpha(0.4);

        // Camera punch
        this.cameras.main.shake(80, 0.006);

        // Blade dash synergy — damage enemies in path
        if (this.activeSynergies.includes('blade_dash')) {
            this.time.addEvent({
                delay: 30, repeat: 4,
                callback: () => {
                    this.zombies.getChildren().forEach(z => {
                        if (!z.active) return;
                        if (Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y) < 50) {
                            z.hp -= 20; if (z.hp <= 0) this.killZombie(z);
                            else this.showDamageNumber(z.x, z.y - 10, '20', '#ff8800');
                        }
                    });
                }
            });
        }

        this.time.addEvent({
            delay: 25, repeat: 5,
            callback: () => {
                const trail = this.add.image(this.player.x, this.player.y, 'dash_trail')
                    .setDepth(9).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({ targets: trail, alpha: 0, scale: 0.2, duration: 250, onComplete: () => trail.destroy() });
            }
        });
        this.playSound('dash');
        this.time.delayedCall(this.dashDuration, () => { this.isDashing = false; this.player.setAlpha(1); });
    }

    // Pitched kill sound for combo
    playSoundPitched(type, pitchMult) {
        if (!this.soundEnabled || !window.gameAudioCtx) return;
        const ctx = window.gameAudioCtx; if (ctx.state === 'suspended') return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(150 * pitchMult, now);
            osc.frequency.exponentialRampToValueAtTime(40 * pitchMult, now + 0.15);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } catch (e) { }
    }

    // Slow-motion on level up
    levelUp() {
        this.playerLevel++; this.playerXP -= this.xpToNextLevel;
        // Readme XP curve: 40 * (1.18 ^ playerLevel)
        this.xpToNextLevel = Math.floor(40 * Math.pow(1.18, this.playerLevel));
        this.playerHP = Math.min(this.playerHP + 20, this.playerMaxHP);

        // Phase 2: Brief slow-motion on level up
        this.physics.world.timeScale = 2.5;
        this.time.delayedCall(400, () => { if (!this.arenaEventActive || this.arenaEventType !== 'slow_motion') this.physics.world.timeScale = 1; });

        this.cameras.main.flash(300, 0, 212, 255, true);
        this.playSound('levelup');
        this.events.emit('levelUp', this.playerLevel);
        this.showUpgradeMenu();
    }

    updateAttachedZombies(time, delta) {
        if (this.attachedZombies.length === 0) return;

        // Damage timer for attached zombies
        if (!this.nextAttachDamage) this.nextAttachDamage = 0;

        for (let i = this.attachedZombies.length - 1; i >= 0; i--) {
            const z = this.attachedZombies[i];
            if (!z.active) {
                this.attachedZombies.splice(i, 1);
                continue;
            }

            // Stick to player with slight random jitter
            z.x = this.player.x + Phaser.Math.Between(-20, 20);
            z.y = this.player.y + Phaser.Math.Between(-20, 20);
        }

        if (time > this.nextAttachDamage) {
            if (this.attachedZombies.length > 0) {
                const dmgPerZombie = 2; // Low continuous damage
                const totalDmg = this.attachedZombies.length * dmgPerZombie;
                this.playerHP = Math.max(0, this.playerHP - totalDmg);
                this.cameras.main.shake(50, 0.005);
                this.player.setTint(0xff5555);
                this.time.delayedCall(100, () => this.player.clearTint());

                // Show damage msg
                if (Math.random() < 0.3) this.showDamageNumber(this.player.x, this.player.y - 30, `-${totalDmg}`, '#ff0000');

                if (this.playerHP <= 0) this.triggerGameOver();
            }
            this.nextAttachDamage = time + 500; // Tick every 0.5s
        }
    }

    // Helper for Ricochet
    getNearestZombieExcluding(excludeZombie, maxDist) {
        let nearest = null;
        let minDist = maxDist;
        this.zombies.getChildren().forEach(z => {
            if (!z.active || z === excludeZombie) return;
            const dist = Phaser.Math.Distance.Between(excludeZombie.x, excludeZombie.y, z.x, z.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = z;
            }
        });
        return nearest;
    }

    // ==================== MISSING METHODS ====================
    takeDamage(amount) {
        if (this.gameOver) return;
        const time = this.time.now;
        if (time < this.lastDamageTime + 200) return;
        this.lastDamageTime = time;

        const actualDamage = Math.floor(amount * (this.armorMultiplier || 1));
        this.playerHP = Math.max(0, this.playerHP - actualDamage);

        this.cameras.main.shake(100, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(150, () => { if (this.player.active) this.player.clearTint(); });
        this.playSound('hurt');

        if (this.playerHP <= 0) {
            this.triggerGameOver();
        }
    }

    explode(x, y, radius, damage) {
        this.playSound('explosion'); // Use synthesized sound
        this.cameras.main.shake(150, 0.02);

        // Explosion visual
        if (this.hitParticles) {
            this.hitParticles.emitParticleAt(x, y, 20);
        }
        // Visual Circle
        const exp = this.add.circle(x, y, radius, 0xff4400, 0.6);
        this.tweens.add({ targets: exp, scale: 1.5, alpha: 0, duration: 300, onComplete: () => exp.destroy() });

        // Damage enemies
        this.zombies.getChildren().forEach(z => {
            if (!z.active) return;
            const dist = Phaser.Math.Distance.Between(x, y, z.x, z.y);
            if (dist <= radius) {
                z.hp -= damage;
                z.setTint(0xffaa00);
                this.showDamageNumber(z.x, z.y - 40, damage, '#ffaa00');
                if (z.hp <= 0) {
                    this.events.emit('enemyKilled');
                    z.destroy();
                } else {
                    this.time.delayedCall(100, () => { if (z.active) z.clearTint(); });
                }
            }
        });

        // Damage player
        const pDist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (pDist <= radius * 0.8) {
            this.takeDamage(Math.floor(damage * 0.5));
        }
    }

    triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setScrollFactor(0).setDepth(1000);
        this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
            fontFamily: 'monospace', fontSize: '64px', color: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        const restartBtn = this.add.text(width / 2, height / 2 + 50, 'Click to Restart', {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }

    showDamageNumber(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: '18px', color: color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    playSound(key) {
        if (this.soundEnabled && this.sound.get(key)) {
            this.sound.play(key);
        }
    }

    playSoundPitched(key, rate) {
        if (this.soundEnabled && this.sound.get(key)) {
            this.sound.play(key, { rate: rate });
        }
    }

    spawnPowerDrop(x, y) {
        const type = Phaser.Utils.Array.GetRandom(this.powerTypes);
        const drop = this.powerDrops.get(x, y, type.texture);
        if (drop) {
            drop.setActive(true).setVisible(true).setDepth(5);
            drop.body.enable = true;
            drop.powerType = type;
            drop.spawnTime = this.time.now;
            this.tweens.add({ targets: drop, y: y - 5, duration: 1000, yoyo: true, repeat: -1 });
        }
    }

    spawnAmmoDrop(x, y) {
        const drop = this.ammoDrops.get(x, y, 'ammo_box');
        if (drop) {
            drop.setActive(true).setVisible(true).setDepth(5);
            drop.body.enable = true;
            drop.spawnTime = this.time.now;
            this.tweens.add({ targets: drop, y: y - 5, duration: 1000, yoyo: true, repeat: -1 });
        }
    }
}

