class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0d0d1a');

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'ZOMBIE KILLER ARENA', {
            fontFamily: 'monospace', fontSize: '32px', color: '#e94560', fontStyle: 'bold'
        }).setOrigin(0.5);

        const subText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontFamily: 'monospace', fontSize: '18px', color: '#16213e'
        }).setOrigin(0.5);

        const progressBarBg = this.add.rectangle(width / 2, height / 2 + 50, 320, 20, 0x16213e);
        const progressBar = this.add.rectangle(width / 2 - 155, height / 2 + 50, 0, 16, 0xe94560);
        progressBar.setOrigin(0, 0.5);

        this.load.on('progress', (value) => {
            progressBar.width = 310 * value;
            subText.setText(`Loading... ${Math.floor(value * 100)}%`);
        });
        this.load.on('complete', () => { subText.setText('Ready!'); });

        this.generateTextures();
        this.generateSounds();
    }

    generateTextures() {
        // ============================================================
        //  PLAYER — Detailed top-down character with body, arms, visor
        // ============================================================
        const pg = this.make.graphics({ add: false });

        // ===================================
        // IMPROVED PLAYER GRAPHICS (64x48)
        // ===================================

        // Glow / Aura
        pg.fillStyle(0x0088ff, 0.15);
        pg.fillCircle(32, 24, 22);

        // Body (Dark High-Tech Armor)
        pg.fillStyle(0x1a1a2e, 1);
        pg.fillCircle(32, 24, 14);

        // Armor Plates (Neon Blue)
        pg.fillStyle(0x00d4ff, 1);
        pg.beginPath();
        pg.moveTo(24, 14); pg.lineTo(40, 14); pg.lineTo(36, 34); pg.lineTo(28, 34);
        pg.closePath();
        pg.fillPath();

        // Helmet
        pg.fillStyle(0xffffff, 0.9);
        pg.fillCircle(32, 24, 7);
        pg.fillStyle(0x00d4ff, 1); // Visor
        pg.fillRect(34, 22, 5, 4);

        // Weapon Arms
        pg.fillStyle(0x555566, 1);
        pg.fillRect(38, 20, 18, 5); // Main gun

        // Muzzle
        pg.fillStyle(0xffaa00, 0.8);
        pg.fillCircle(56, 22.5, 2);

        pg.generateTexture('player', 64, 48);
        pg.destroy();

        // ============================================================
        //  BULLETS — Glowing projectiles
        // ============================================================
        // Pistol bullet — bright yellow glow
        this._makeGlowBullet('bullet', 0xffdd57, 0xffaa00, 5, 10);

        // Shotgun pellet — orange glow
        this._makeGlowBullet('bullet_shotgun', 0xff8833, 0xff5500, 4, 8);

        // SMG bullet — light yellow, small
        this._makeGlowBullet('bullet_smg', 0xffee88, 0xffcc00, 3, 6);

        // Assault rifle — white/blue glow
        this._makeGlowBullet('bullet_ar', 0xccddff, 0x6688ff, 5, 10);

        // Flamethrower — fiery orange-red with soft glow
        const fg = this.make.graphics({ add: false });
        fg.fillStyle(0xff2200, 0.2);
        fg.fillCircle(10, 10, 10);
        fg.fillStyle(0xff6600, 0.4);
        fg.fillCircle(10, 10, 7);
        fg.fillStyle(0xffaa00, 0.7);
        fg.fillCircle(10, 10, 4);
        fg.fillStyle(0xffdd44, 1);
        fg.fillCircle(10, 10, 2);
        fg.generateTexture('bullet_flame', 20, 20);
        fg.destroy();

        // Laser — cyan beam with glow
        const lg = this.make.graphics({ add: false });
        lg.fillStyle(0x00ffff, 0.15);
        lg.fillRect(0, 0, 24, 10);
        lg.fillStyle(0x00ffff, 0.4);
        lg.fillRect(0, 2, 24, 6);
        lg.fillStyle(0xaaffff, 0.9);
        lg.fillRect(0, 3, 24, 4);
        lg.fillStyle(0xffffff, 1);
        lg.fillRect(0, 4, 24, 2);
        lg.generateTexture('bullet_laser', 24, 10);
        lg.destroy();

        // ============================================================
        //  WEAPONS — Visuals for player's arm
        // ============================================================
        this._makeWeapon('weapon_pistol', 'pistol');
        this._makeWeapon('weapon_shotgun', 'shotgun');
        this._makeWeapon('weapon_smg', 'smg');
        this._makeWeapon('weapon_ar', 'ar');
        this._makeWeapon('weapon_sniper', 'sniper');

        // ============================================================
        //  ZOMBIES — Organic/detailed sprites
        // ============================================================
        // Normal zombie — green-brown undead with tattered look
        this._makeZombie('zombie', 30, {
            bodyColor: 0x6b4423, skinColor: 0x8fbc6b, eyeColor: 0xffff00, eyeGlow: 0xff0000,
            hasArms: true, hasMouth: true
        });

        // Runner zombie — lean, purple-ish, fast look
        this._makeZombie('zombie_runner', 26, {
            bodyColor: 0x5522aa, skinColor: 0x9955dd, eyeColor: 0xff0000, eyeGlow: 0xff4444,
            hasArms: true, hasMouth: true, lean: true
        });

        // Tank zombie — bulky, armored, dark
        this._makeTankZombie();

        // Boss zombie — huge, glowing eyes, menacing
        this._makeBossZombie();

        // ============================================================
        //  ENVIRONMENT — Rich ground tiles & props
        // ============================================================
        // Ground tile — detailed concrete/asphalt with cracks
        this._makeGroundTile('ground', 0x2a2a3e, 0x333348, 0x222235);

        // Ground variation tiles
        this._makeGroundTile('ground_dark', 0x222233, 0x2a2a3d, 0x1a1a28);
        this._makeGroundTile('ground_cracked', 0x2e2e42, 0x383850, 0x262638);

        // Grass patch
        const grass = this.make.graphics({ add: false });
        grass.fillStyle(0x1a3a1a, 0.5);
        grass.fillCircle(16, 16, 14);
        grass.fillStyle(0x224422, 0.4);
        grass.fillCircle(12, 12, 8);
        // Grass blades
        for (let i = 0; i < 8; i++) {
            const gx = 6 + Math.random() * 20;
            const gy = 8 + Math.random() * 16;
            grass.fillStyle(Phaser.Display.Color.GetColor(
                30 + Math.random() * 20, 60 + Math.random() * 40, 20 + Math.random() * 20
            ), 0.7);
            grass.fillRect(gx, gy, 1, 3 + Math.random() * 3);
        }
        grass.generateTexture('grass_patch', 32, 32);
        grass.destroy();

        // Puddle
        const puddle = this.make.graphics({ add: false });
        puddle.fillStyle(0x1a2244, 0.4);
        puddle.fillEllipse(20, 14, 36, 24);
        puddle.fillStyle(0x2244aa, 0.25);
        puddle.fillEllipse(18, 12, 28, 18);
        puddle.fillStyle(0x4466cc, 0.15);
        puddle.fillEllipse(14, 10, 12, 8);
        puddle.generateTexture('puddle', 40, 28);
        puddle.destroy();

        // Barrel
        const barrel = this.make.graphics({ add: false });
        barrel.fillStyle(0x000000, 0.3);
        barrel.fillEllipse(16, 30, 28, 10);
        barrel.fillStyle(0x664422, 1);
        barrel.fillRoundedRect(2, 4, 28, 24, 3);
        barrel.fillStyle(0x7a5533, 1);
        barrel.fillRoundedRect(4, 6, 24, 20, 2);
        barrel.lineStyle(2, 0x555544, 1);
        barrel.strokeRect(2, 8, 28, 2);
        barrel.strokeRect(2, 18, 28, 2);
        barrel.fillStyle(0x887744, 0.5);
        barrel.fillRect(6, 6, 4, 20);
        barrel.generateTexture('barrel', 32, 34);
        barrel.destroy();

        // Crate
        const crate = this.make.graphics({ add: false });
        crate.fillStyle(0x000000, 0.3);
        crate.fillRect(4, 28, 28, 6);
        crate.fillStyle(0x8B7355, 1);
        crate.fillRect(2, 2, 28, 26);
        crate.fillStyle(0x9B8365, 1);
        crate.fillRect(4, 4, 24, 22);
        crate.lineStyle(1, 0x6B5335, 1);
        crate.strokeRect(2, 2, 28, 26);
        // Cross planks
        crate.lineStyle(2, 0x7B6345, 1);
        crate.lineBetween(4, 4, 28, 26);
        crate.lineBetween(28, 4, 4, 26);
        // Nails
        crate.fillStyle(0xaaaaaa, 1);
        crate.fillCircle(6, 6, 1);
        crate.fillCircle(26, 6, 1);
        crate.fillCircle(6, 24, 1);
        crate.fillCircle(26, 24, 1);
        crate.generateTexture('crate', 32, 34);
        crate.destroy();

        // Rock
        const rock = this.make.graphics({ add: false });
        rock.fillStyle(0x000000, 0.2);
        rock.fillEllipse(14, 16, 24, 16);
        rock.fillStyle(0x555566, 1);
        rock.fillEllipse(12, 12, 22, 18);
        rock.fillStyle(0x666677, 1);
        rock.fillEllipse(10, 10, 16, 12);
        rock.fillStyle(0x777788, 0.5);
        rock.fillEllipse(8, 8, 8, 6);
        rock.generateTexture('rock', 26, 24);
        rock.destroy();

        // Dead tree
        const tree = this.make.graphics({ add: false });
        tree.fillStyle(0x000000, 0.2);
        tree.fillEllipse(20, 58, 24, 8);
        // Trunk
        tree.fillStyle(0x3a2a1a, 1);
        tree.fillRect(16, 20, 8, 40);
        tree.fillStyle(0x4a3a2a, 1);
        tree.fillRect(18, 20, 4, 40);
        // Branches
        tree.lineStyle(3, 0x3a2a1a, 1);
        tree.lineBetween(20, 25, 8, 10);
        tree.lineBetween(20, 25, 34, 8);
        tree.lineBetween(20, 30, 6, 22);
        tree.lineBetween(20, 32, 36, 20);
        tree.lineStyle(2, 0x3a2a1a, 1);
        tree.lineBetween(8, 10, 4, 4);
        tree.lineBetween(8, 10, 12, 4);
        tree.lineBetween(34, 8, 30, 2);
        tree.lineBetween(34, 8, 38, 2);
        tree.generateTexture('dead_tree', 42, 62);
        tree.destroy();

        // Fence post
        const fence = this.make.graphics({ add: false });
        fence.fillStyle(0x4a3a2a, 1);
        fence.fillRect(0, 0, 4, 20);
        fence.fillStyle(0x5a4a3a, 1);
        fence.fillRect(0, 0, 2, 20);
        // Wire
        fence.lineStyle(1, 0x888888, 0.6);
        fence.lineBetween(2, 5, 32, 5);
        fence.lineBetween(2, 12, 32, 12);
        // Second post
        fence.fillStyle(0x4a3a2a, 1);
        fence.fillRect(28, 0, 4, 20);
        fence.fillStyle(0x5a4a3a, 1);
        fence.fillRect(28, 0, 2, 20);
        fence.generateTexture('fence', 32, 20);
        fence.destroy();

        // Lamppost
        const lamp = this.make.graphics({ add: false });
        // Light glow
        lamp.fillStyle(0xffdd88, 0.08);
        lamp.fillCircle(10, 4, 30);
        lamp.fillStyle(0xffee99, 0.12);
        lamp.fillCircle(10, 4, 18);
        // Pole
        lamp.fillStyle(0x555555, 1);
        lamp.fillRect(8, 4, 4, 50);
        lamp.fillStyle(0x666666, 1);
        lamp.fillRect(9, 4, 2, 50);
        // Lamp head
        lamp.fillStyle(0x777777, 1);
        lamp.fillRect(4, 0, 12, 6);
        lamp.fillStyle(0xffdd88, 0.9);
        lamp.fillRect(6, 2, 8, 3);
        lamp.generateTexture('lamppost', 40, 56);
        lamp.destroy();

        // Blood splatter (persistent ground stain)
        for (let i = 1; i <= 3; i++) {
            const bs = this.make.graphics({ add: false });
            const size = 12 + i * 6;
            bs.fillStyle(0x550000, 0.5);
            bs.fillCircle(size / 2, size / 2, size / 2);
            for (let j = 0; j < 3 + i; j++) {
                const sx = size / 2 + (Math.random() - 0.5) * size * 0.8;
                const sy = size / 2 + (Math.random() - 0.5) * size * 0.8;
                bs.fillStyle(0x440000, 0.4);
                bs.fillCircle(sx, sy, 2 + Math.random() * 3);
            }
            bs.generateTexture('blood_splat_' + i, size, size);
            bs.destroy();
        }

        // ============================================================
        //  XP ORB — Glowing cyan gem
        // ============================================================
        const xg = this.make.graphics({ add: false });
        xg.fillStyle(0x00d4ff, 0.1);
        xg.fillCircle(8, 8, 8);
        xg.fillStyle(0x00d4ff, 0.25);
        xg.fillCircle(8, 8, 6);
        xg.fillStyle(0x44eeff, 0.6);
        xg.fillCircle(8, 8, 4);
        xg.fillStyle(0xaaffff, 1);
        xg.fillCircle(8, 8, 2);
        xg.fillStyle(0xffffff, 1);
        xg.fillCircle(7, 7, 1);
        xg.generateTexture('xp_orb', 16, 16);
        xg.destroy();

        // ============================================================
        //  COIN — Shiny gold
        // ============================================================
        const cg = this.make.graphics({ add: false });
        cg.fillStyle(0xffdd57, 0.15);
        cg.fillCircle(10, 10, 10);
        cg.fillStyle(0xffdd57, 0.3);
        cg.fillCircle(10, 10, 8);
        cg.fillStyle(0xffcc00, 0.8);
        cg.fillCircle(10, 10, 6);
        cg.fillStyle(0xffdd57, 1);
        cg.fillCircle(10, 10, 5);
        cg.fillStyle(0xffeeaa, 1);
        cg.fillCircle(8, 8, 2);
        cg.fillStyle(0xffaa00, 1);
        cg.lineStyle(1, 0xcc8800, 1);
        cg.strokeCircle(10, 10, 5);
        cg.generateTexture('coin', 20, 20);
        cg.destroy();

        // ============================================================
        //  PARTICLES
        // ============================================================
        // Dash trail
        const dg = this.make.graphics({ add: false });
        dg.fillStyle(0x00ff88, 0.15);
        dg.fillCircle(10, 10, 10);
        dg.fillStyle(0x00ff88, 0.4);
        dg.fillCircle(10, 10, 6);
        dg.fillStyle(0x88ffcc, 0.7);
        dg.fillCircle(10, 10, 3);
        dg.generateTexture('dash_trail', 20, 20);
        dg.destroy();

        // Blood particle
        const bp = this.make.graphics({ add: false });
        bp.fillStyle(0xcc0000, 0.8);
        bp.fillCircle(4, 4, 4);
        bp.fillStyle(0xff2222, 1);
        bp.fillCircle(3, 3, 2);
        bp.generateTexture('blood_particle', 8, 8);
        bp.destroy();

        // Hit particle (spark)
        const hp2 = this.make.graphics({ add: false });
        hp2.fillStyle(0xffffff, 0.3);
        hp2.fillCircle(6, 6, 6);
        hp2.fillStyle(0xffffaa, 0.7);
        hp2.fillCircle(6, 6, 4);
        hp2.fillStyle(0xffffff, 1);
        hp2.fillCircle(6, 6, 2);
        hp2.generateTexture('hit_particle', 12, 12);
        hp2.destroy();

        // Muzzle flash
        const mf = this.make.graphics({ add: false });
        mf.fillStyle(0xffdd57, 0.2);
        mf.fillCircle(8, 8, 8);
        mf.fillStyle(0xffee88, 0.5);
        mf.fillCircle(8, 8, 5);
        mf.fillStyle(0xffffff, 0.9);
        mf.fillCircle(8, 8, 2);
        mf.generateTexture('muzzle_flash', 16, 16);
        mf.destroy();

        // Ambient dust
        const dust = this.make.graphics({ add: false });
        dust.fillStyle(0xaaaaaa, 0.15);
        dust.fillCircle(3, 3, 3);
        dust.generateTexture('dust_particle', 6, 6);
        dust.destroy();

        // Fog particle
        const fogP = this.make.graphics({ add: false });
        fogP.fillStyle(0x334455, 0.04);
        fogP.fillCircle(40, 40, 40);
        fogP.fillStyle(0x445566, 0.03);
        fogP.fillCircle(35, 35, 30);
        fogP.generateTexture('fog_particle', 80, 80);
        fogP.destroy();

        // Light glow (player lamp)
        const glow = this.make.graphics({ add: false });
        glow.fillStyle(0xffeecc, 0.04);
        glow.fillCircle(64, 64, 64);
        glow.fillStyle(0xffeecc, 0.06);
        glow.fillCircle(64, 64, 48);
        glow.fillStyle(0xffeecc, 0.08);
        glow.fillCircle(64, 64, 32);
        glow.fillStyle(0xffffff, 0.05);
        glow.fillCircle(64, 64, 16);
        glow.generateTexture('player_glow', 128, 128);
        glow.destroy();

        // Vignette overlay
        const vig = this.make.graphics({ add: false });
        const vigSize = 800;
        vig.fillStyle(0x000000, 0);
        vig.fillRect(0, 0, vigSize, vigSize);
        // Draw concentric dark rings to simulate vignette
        for (let r = vigSize / 2; r > 0; r -= 2) {
            const alpha = Math.max(0, 0.4 * (1 - (r / (vigSize / 2)) * (r / (vigSize / 2))));
            vig.fillStyle(0x000000, alpha);
            vig.fillCircle(vigSize / 2, vigSize / 2, r);
        }
        vig.generateTexture('vignette', vigSize, vigSize);
        vig.destroy();

        // ============================================================
        //  PHASE 2 — Elite Zombie Aura Rings
        // ============================================================
        // Shielded — cyan ring
        this._makeAuraRing('elite_shield_aura', 0x00aaff, 40);
        // Exploder — orange ring
        this._makeAuraRing('elite_exploder_aura', 0xff6600, 40);
        // Regenerator — green ring
        this._makeAuraRing('elite_regen_aura', 0x00ff44, 40);
        // Speed Aura — yellow ring
        this._makeAuraRing('elite_speed_aura', 0xffff00, 40);

        // Shield bubble (for shielded elites)
        const shieldBub = this.make.graphics({ add: false });
        shieldBub.fillStyle(0x00aaff, 0.08);
        shieldBub.fillCircle(24, 24, 24);
        shieldBub.lineStyle(2, 0x00ccff, 0.5);
        shieldBub.strokeCircle(24, 24, 22);
        shieldBub.lineStyle(1, 0x88ddff, 0.3);
        shieldBub.strokeCircle(24, 24, 18);
        shieldBub.generateTexture('shield_bubble', 48, 48);
        shieldBub.destroy();

        // Explosion particle (for exploder death)
        const expP = this.make.graphics({ add: false });
        expP.fillStyle(0xff4400, 0.2);
        expP.fillCircle(12, 12, 12);
        expP.fillStyle(0xff6600, 0.5);
        expP.fillCircle(12, 12, 8);
        expP.fillStyle(0xffaa00, 0.8);
        expP.fillCircle(12, 12, 4);
        expP.fillStyle(0xffeeaa, 1);
        expP.fillCircle(12, 12, 2);
        expP.generateTexture('explosion_particle', 24, 24);
        expP.destroy();

        // Speed aura visual ring (for speed aura elites affecting nearby)
        const spdRing = this.make.graphics({ add: false });
        spdRing.lineStyle(1, 0xffff00, 0.15);
        for (let r = 10; r < 60; r += 8) {
            spdRing.strokeCircle(60, 60, r);
        }
        spdRing.generateTexture('speed_aura_ring', 120, 120);
        spdRing.destroy();

        // ============================================================
        //  PHASE 2 — Power Drop Pickups
        // ============================================================
        // Double Damage — red
        this._makePowerDrop('power_double_damage', 0xff3333, 0xff0000, '2x');
        // Freeze — cyan
        this._makePowerDrop('power_freeze', 0x00ccff, 0x0088cc, '❄');
        // Rapid Fire — yellow
        this._makePowerDrop('power_rapid_fire', 0xffdd00, 0xccaa00, '⚡');
        // Health Burst — green
        this._makePowerDrop('power_health', 0x00ff88, 0x00cc66, '+');
        // Coin Magnet — gold
        this._makePowerDrop('power_magnet', 0xffaa33, 0xcc8800, '⊕');

        // Phase 5: Weapon Mod Power-up Textures
        this._makePowerDrop('power_ricochet', 0xdddddd, 0xaaaaaa, ''); // Grey/Silver
        this._makePowerDrop('power_vampiric', 0xaa0033, 0xff0000, ''); // Dark Red
        this._makePowerDrop('power_frostbite', 0x00aaff, 0x00ffff, ''); // Cyan
        this._makePowerDrop('power_spread', 0xffaa00, 0xffff00, '');    // Orange/Gold

        // Ammo Box — military green
        const ab = this.make.graphics({ add: false });
        ab.fillStyle(0x335533, 1); // Box body
        ab.fillRoundedRect(0, 4, 24, 16, 2);
        ab.fillStyle(0x224422, 1); // Darker side
        ab.fillRect(0, 4, 6, 16);
        ab.fillStyle(0xddccaa, 1); // Label
        ab.fillRect(8, 8, 12, 8);
        ab.generateTexture('ammo_box', 24, 24);
        ab.destroy();

        // ============================================================
        //  PHASE 2 — Arena Event Textures
        // ============================================================
        // Meteor
        const met = this.make.graphics({ add: false });
        met.fillStyle(0xff2200, 0.2);
        met.fillCircle(16, 16, 16);
        met.fillStyle(0xff4400, 0.5);
        met.fillCircle(16, 16, 12);
        met.fillStyle(0xff8800, 0.8);
        met.fillCircle(16, 16, 8);
        met.fillStyle(0xffcc44, 1);
        met.fillCircle(16, 16, 4);
        met.generateTexture('meteor', 32, 32);
        met.destroy();

        // Meteor crater
        const crater = this.make.graphics({ add: false });
        crater.fillStyle(0x111111, 0.3);
        crater.fillCircle(20, 20, 20);
        crater.fillStyle(0x221100, 0.4);
        crater.fillCircle(20, 20, 15);
        crater.fillStyle(0x331100, 0.2);
        crater.fillCircle(20, 20, 8);
        crater.generateTexture('meteor_crater', 40, 40);
        crater.destroy();

        // Turret — small automated gun
        const turret = this.make.graphics({ add: false });
        turret.fillStyle(0x000000, 0.2);
        turret.fillEllipse(16, 30, 28, 8);
        turret.fillStyle(0x666688, 1);
        turret.fillCircle(16, 16, 10);
        turret.fillStyle(0x8888aa, 1);
        turret.fillCircle(16, 16, 7);
        turret.fillStyle(0x555577, 1);
        turret.fillRect(20, 14, 14, 4);
        turret.fillStyle(0xffdd57, 0.6);
        turret.fillCircle(33, 16, 2);
        turret.generateTexture('turret', 36, 34);
        turret.destroy();

        // Combo fire particle
        const combFire = this.make.graphics({ add: false });
        combFire.fillStyle(0xff4400, 0.3);
        combFire.fillCircle(6, 6, 6);
        combFire.fillStyle(0xffaa00, 0.6);
        combFire.fillCircle(6, 6, 4);
        combFire.fillStyle(0xffee44, 0.9);
        combFire.fillCircle(6, 6, 2);
        combFire.generateTexture('combo_fire', 12, 12);
        combFire.destroy();

        // Freeze effect particle
        const freezeP = this.make.graphics({ add: false });
        freezeP.fillStyle(0x88ddff, 0.3);
        freezeP.fillCircle(5, 5, 5);
        freezeP.fillStyle(0xccffff, 0.7);
        freezeP.fillCircle(5, 5, 3);
        freezeP.generateTexture('freeze_particle', 10, 10);
        freezeP.destroy();

        // ============================================================
        //  MOBILE UI  
        // ============================================================
        const jb = this.make.graphics({ add: false });
        jb.fillStyle(0xffffff, 0.1);
        jb.fillCircle(50, 50, 50);
        jb.lineStyle(2, 0xffffff, 0.2);
        jb.strokeCircle(50, 50, 50);
        jb.lineStyle(1, 0xffffff, 0.1);
        jb.strokeCircle(50, 50, 30);
        jb.generateTexture('joystick_base', 100, 100);
        jb.destroy();

        const jk = this.make.graphics({ add: false });
        jk.fillStyle(0xffffff, 0.3);
        jk.fillCircle(25, 25, 25);
        jk.fillStyle(0xffffff, 0.15);
        jk.fillCircle(25, 25, 15);
        jk.generateTexture('joystick_knob', 50, 50);
        jk.destroy();

        const mb = this.make.graphics({ add: false });
        mb.fillStyle(0xffffff, 0.15);
        mb.fillCircle(30, 30, 30);
        mb.lineStyle(2, 0xffffff, 0.3);
        mb.strokeCircle(30, 30, 30);
        mb.generateTexture('mobile_button', 60, 60);
        mb.destroy();
    }

    // ============ Helper: Glowing bullet ============
    _makeGlowBullet(key, coreColor, glowColor, coreR, size) {
        const g = this.make.graphics({ add: false });
        // Make it 2.5x wider than tall for "speed" look
        const w = size * 2.5;
        const h = size;
        const cy = h / 2;

        // Trail / Glow
        g.fillStyle(glowColor, 0.25);
        g.fillEllipse(w / 2, cy, w, h * 1.2);
        g.fillStyle(glowColor, 0.5);
        g.fillEllipse(w / 2 + 2, cy, w * 0.7, h * 0.7);

        // Core (brighter, forward)
        g.fillStyle(coreColor, 1);
        g.fillEllipse(w - coreR * 2, cy, coreR * 2.5, coreR * 1.5);

        // Center spark
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(w - coreR * 2, cy, coreR * 1.2, coreR * 0.8);

        g.generateTexture(key, w, h);
        g.destroy();
    }

    // ============ Helper: Standard zombie ============
    _makeZombie(key, size, opts) {
        const g = this.make.graphics({ add: false });
        const cx = size / 2, cy = size / 2;

        // Shadow
        g.fillStyle(0x000000, 0.4);
        g.fillEllipse(cx, cy + size * 0.4, size * 0.9, size * 0.4);

        // Body (irregular)
        g.fillStyle(opts.bodyColor, 1);
        // Base torso with some random variation implies tattered clothes
        g.fillCircle(cx, cy, size * 0.4);
        g.fillRect(cx - size / 3, cy - size / 3.5, size / 1.5, size / 1.5);

        // Head
        g.fillStyle(opts.skinColor, 1);
        g.fillCircle(cx, cy - size * 0.2, size * 0.3);

        // Arms reaching forward (Right - standard Phaser orientation)
        if (opts.hasArms) {
            g.fillStyle(opts.skinColor, 1);
            // Left arm (top)
            g.fillRect(cx + size * 0.1, cy - size * 0.35, size * 0.45, size * 0.14);
            // Right arm (bottom)
            g.fillRect(cx + size * 0.1, cy + size * 0.2, size * 0.45, size * 0.14);

            // Hands
            g.fillStyle(opts.skinColor, 1); // Hands same color or slightly darker
            g.fillCircle(cx + size * 0.55, cy - size * 0.28, size * 0.08);
            g.fillCircle(cx + size * 0.55, cy + size * 0.27, size * 0.08);
        }

        // Scary Eyes
        const eyeY = cy - size * 0.25;
        const eyeSpacing = size * 0.1;
        g.fillStyle(opts.eyeGlow, 0.6);
        g.fillCircle(cx - eyeSpacing, eyeY, size * 0.1); // Left glow
        g.fillCircle(cx + eyeSpacing + 2, eyeY, size * 0.1); // Right glow

        g.fillStyle(opts.eyeColor, 1);
        g.fillCircle(cx - eyeSpacing, eyeY, size * 0.05);
        g.fillCircle(cx + eyeSpacing + 2, eyeY, size * 0.05);

        // Blood Splatter
        g.fillStyle(0x880000, 0.8);
        g.fillCircle(cx - size * 0.2, cy + size * 0.2, size * 0.08);
        g.fillCircle(cx + size * 0.1, cy - size * 0.3, size * 0.05);

        // Mouth
        if (opts.hasMouth) {
            g.fillStyle(0x220000, 0.8);
            g.fillEllipse(cx + 4, cy - size * 0.1, size * 0.12, size * 0.06);
        }

        g.generateTexture(key, size * 1.5, size * 1.2);
        g.destroy();
    }

    // ============ Helper: Tank zombie ============
    _makeTankZombie() {
        const size = 44;
        const g = this.make.graphics({ add: false });
        const cx = size / 2, cy = size / 2;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(cx, cy + 5, size, size * 0.45);

        // Massive body
        g.fillStyle(0x551122, 1);
        g.fillEllipse(cx, cy, size * 0.85, size * 0.9);
        g.fillStyle(0x772233, 0.8);
        g.fillEllipse(cx, cy, size * 0.7, size * 0.75);

        // Armor plates
        g.fillStyle(0x443333, 0.7);
        g.fillRoundedRect(cx - 12, cy - 8, 24, 18, 3);

        // Huge arms
        g.fillStyle(0x662244, 1);
        g.fillEllipse(cx - 18, cy + 2, 10, 16);
        g.fillEllipse(cx + 18, cy + 2, 10, 16);

        // Head — small for a big body
        g.fillStyle(0x883344, 1);
        g.fillCircle(cx, cy - 10, 8);

        // Glowing eyes
        g.fillStyle(0xff0000, 0.4);
        g.fillCircle(cx - 4, cy - 12, 5);
        g.fillCircle(cx + 4, cy - 12, 5);
        g.fillStyle(0xffff00, 1);
        g.fillCircle(cx - 4, cy - 12, 3);
        g.fillCircle(cx + 4, cy - 12, 3);
        g.fillStyle(0xff0000, 1);
        g.fillCircle(cx - 4, cy - 12, 1.5);
        g.fillCircle(cx + 4, cy - 12, 1.5);

        g.generateTexture('zombie_tank', size, size);
        g.destroy();
    }

    // ============ Helper: Boss zombie ============
    _makeBossZombie() {
        const size = 60;
        const g = this.make.graphics({ add: false });
        const cx = size / 2, cy = size / 2;

        // Shadow
        g.fillStyle(0x000000, 0.35);
        g.fillEllipse(cx, cy + 8, size * 0.9, size * 0.35);

        // Body — hulking
        g.fillStyle(0x440011, 1);
        g.fillEllipse(cx, cy, size * 0.8, size * 0.85);
        g.fillStyle(0x660022, 0.9);
        g.fillEllipse(cx, cy, size * 0.65, size * 0.7);

        // Spiky shoulders
        g.fillStyle(0x880033, 1);
        g.fillTriangle(cx - 22, cy - 5, cx - 28, cy - 18, cx - 16, cy - 5);
        g.fillTriangle(cx + 22, cy - 5, cx + 28, cy - 18, cx + 16, cy - 5);

        // Bone armor
        g.fillStyle(0xccbb99, 0.6);
        g.fillRoundedRect(cx - 10, cy - 4, 20, 14, 2);

        // Arms
        g.fillStyle(0x771133, 1);
        g.fillEllipse(cx - 24, cy + 4, 12, 20);
        g.fillEllipse(cx + 24, cy + 4, 12, 20);
        // Claws
        g.fillStyle(0xccccaa, 0.8);
        g.fillTriangle(cx - 26, cy + 14, cx - 30, cy + 22, cx - 22, cy + 14);
        g.fillTriangle(cx + 26, cy + 14, cx + 30, cy + 22, cx + 22, cy + 14);

        // Head
        g.fillStyle(0xaa2244, 1);
        g.fillCircle(cx, cy - 14, 10);
        g.fillStyle(0xcc3355, 0.8);
        g.fillCircle(cx, cy - 14, 7);

        // Horns
        g.fillStyle(0xccbb88, 1);
        g.fillTriangle(cx - 8, cy - 18, cx - 14, cy - 30, cx - 4, cy - 18);
        g.fillTriangle(cx + 8, cy - 18, cx + 14, cy - 30, cx + 4, cy - 18);

        // Glowing eyes
        g.fillStyle(0xff0000, 0.5);
        g.fillCircle(cx - 5, cy - 16, 6);
        g.fillCircle(cx + 5, cy - 16, 6);
        g.fillStyle(0xff4444, 0.8);
        g.fillCircle(cx - 5, cy - 16, 4);
        g.fillCircle(cx + 5, cy - 16, 4);
        g.fillStyle(0xffff00, 1);
        g.fillCircle(cx - 5, cy - 16, 2);
        g.fillCircle(cx + 5, cy - 16, 2);

        // Mouth
        g.fillStyle(0x220000, 0.9);
        g.fillEllipse(cx, cy - 10, 8, 4);

        g.generateTexture('zombie_boss', size, size);
        g.destroy();
    }

    // ============ Helper: Weapon ============
    _makeWeapon(key, type) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x333333, 1); // Dark metal base

        switch (type) {
            case 'pistol':
                g.fillRect(0, 4, 14, 6);
                g.fillStyle(0x555555, 1); g.fillRect(2, 4, 10, 4);
                g.generateTexture(key, 14, 14);
                break;
            case 'shotgun':
                g.fillRect(0, 4, 20, 8);
                g.fillStyle(0x885533, 1); g.fillRect(4, 6, 8, 4); // Wooden pump
                g.fillStyle(0x111111, 1); g.fillCircle(18, 8, 3); // Muzzle
                g.generateTexture(key, 22, 16);
                break;
            case 'smg':
                g.fillRect(0, 4, 12, 8);
                g.fillStyle(0x222222, 1); g.fillRect(2, 10, 4, 6); // Mag
                g.fillStyle(0x444444, 1); g.fillRect(0, 4, 14, 4); // Barrel
                g.generateTexture(key, 14, 18);
                break;
            case 'ar':
                g.fillRect(0, 4, 24, 6);
                g.fillStyle(0x111111, 1); g.fillRect(8, 10, 6, 8); // Mag
                g.fillStyle(0x555555, 1); g.fillRect(0, 4, 26, 3); // Barrel shroud
                g.generateTexture(key, 28, 20);
                break;
            case 'sniper':
                g.fillRect(0, 6, 36, 5);
                g.fillStyle(0x111111, 1); g.fillRect(6, 2, 12, 4); // Scope
                g.fillStyle(0x222222, 1); g.fillRect(34, 5, 4, 7); // Muzzle brake
                g.generateTexture(key, 40, 16);
                break;
        }
        g.destroy();

        // Phase 5: Shield Bearer - Shield Texture
        const bs = this.make.graphics({ add: false });
        bs.fillStyle(0xcccccc, 1);
        bs.fillRoundedRect(0, 0, 16, 40, 4); // Tall shield
        bs.fillStyle(0x888888, 1);
        bs.fillRect(6, 4, 4, 32); // Stripe
        bs.generateTexture('enemy_shield', 16, 40);
        bs.destroy();

        // Phase 5: Explosive Barrel
        const bb = this.make.graphics({ add: false });
        bb.fillStyle(0xff4400, 1);
        bb.fillRoundedRect(0, 0, 32, 40, 6);
        bb.fillStyle(0x222222, 1);
        bb.fillRect(0, 8, 32, 4); // Rings
        bb.fillRect(0, 28, 32, 4);
        // Warning Icon
        bb.fillStyle(0xffff00, 1);
        bb.fillTriangle(16, 12, 10, 24, 22, 24);
        bb.generateTexture('barrel_explosive', 32, 40);
        bb.destroy();

        // Phase 5: Mini-map icons
        const mm = this.make.graphics({ add: false });
        mm.fillStyle(0xff0000, 1); mm.fillCircle(4, 4, 4);
        mm.generateTexture('mm_enemy', 8, 8);

        mm.clear();
        mm.fillStyle(0xffff00, 1);
        mm.fillRect(0, 0, 10, 10);
        mm.generateTexture('mm_objective', 10, 10);

        mm.clear(); mm.fillStyle(0x00ff00, 1); mm.fillRect(3, 0, 2, 8); mm.fillRect(0, 3, 8, 2);
        mm.generateTexture('mm_health', 8, 8);
        mm.destroy();
    }

    // ============ Helper: Ground tile with detail ============
    _makeGroundTile(key, baseColor, lightColor, darkColor) {
        const g = this.make.graphics({ add: false });
        const s = 64;

        g.fillStyle(baseColor, 1);
        g.fillRect(0, 0, s, s);

        // Subtle noise / variation patches
        for (let i = 0; i < 12; i++) {
            const rx = Math.random() * s;
            const ry = Math.random() * s;
            const rs = 2 + Math.random() * 6;
            g.fillStyle(Math.random() > 0.5 ? lightColor : darkColor, 0.2 + Math.random() * 0.2);
            g.fillCircle(rx, ry, rs);
        }

        // Cracks
        if (key === 'ground_cracked' || Math.random() < 0.3) {
            g.lineStyle(1, darkColor, 0.4);
            const startX = Math.random() * s;
            const startY = Math.random() * s;
            let cx2 = startX, cy2 = startY;
            for (let j = 0; j < 4; j++) {
                const nx = cx2 + (Math.random() - 0.5) * 20;
                const ny = cy2 + Math.random() * 15;
                g.lineBetween(cx2, cy2, nx, ny);
                cx2 = nx;
                cy2 = ny;
            }
        }

        // Grid line (subtle)
        g.lineStyle(1, lightColor, 0.12);
        g.strokeRect(0, 0, s, s);

        g.generateTexture(key, s, s);
        g.destroy();
    }

    // ============ Helper: Aura ring for elites ============
    _makeAuraRing(key, color, size) {
        const g = this.make.graphics({ add: false });
        const half = size / 2;
        g.lineStyle(3, color, 0.6);
        g.strokeCircle(half, half, half - 2);
        g.lineStyle(1, color, 0.3);
        g.strokeCircle(half, half, half - 6);
        g.fillStyle(color, 0.05);
        g.fillCircle(half, half, half);
        g.generateTexture(key, size, size);
        g.destroy();
    }

    // ============ Helper: Power drop pickup ============
    _makePowerDrop(key, coreColor, glowColor, icon) {
        const g = this.make.graphics({ add: false });
        const size = 28, half = 14;
        // Outer glow
        g.fillStyle(glowColor, 0.12);
        g.fillCircle(half, half, half);
        g.fillStyle(glowColor, 0.25);
        g.fillCircle(half, half, half * 0.75);
        // Hexagonal shape
        g.fillStyle(coreColor, 0.9);
        const pts = [];
        for (let a = 0; a < 6; a++) {
            pts.push(half + Math.cos(a * Math.PI / 3 - Math.PI / 6) * 8);
            pts.push(half + Math.sin(a * Math.PI / 3 - Math.PI / 6) * 8);
        }
        g.fillPoints([
            { x: pts[0], y: pts[1] }, { x: pts[2], y: pts[3] },
            { x: pts[4], y: pts[5] }, { x: pts[6], y: pts[7] },
            { x: pts[8], y: pts[9] }, { x: pts[10], y: pts[11] }
        ], true);
        // Inner highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(half - 2, half - 2, 3);
        g.generateTexture(key, size, size);
        // Phase 5: Weapon Mod Power-up Textures


        g.destroy();
    }

    generateSounds() {
        if (window.AudioContext || window.webkitAudioContext) {
            window.gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    create() {
        this.time.delayedCall(500, () => {
            this.scene.start('StartScene');
        });
    }
}
