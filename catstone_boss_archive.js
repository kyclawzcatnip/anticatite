/**
 * ============================================================================
 * SCW — CATSTONE MONSTROSITY BOSS ARCHIVE
 * ============================================================================
 * Complete implementation of the Catstone Monstrosity background wall boss,
 * Level 37 (32x14 full arena), integrated wall health bar, shaking water pipes,
 * water jet stream mechanics, tracking lasers, cat mines, and rat mines.
 * 
 * Preserved safely for future re-enabling or design modifications.
 * ============================================================================
 */

// 1. LEVEL 37 — THE CATSTONE MONSTROSITY ARENA LAYOUT (32x14 BLOCKS)
const CATSTONE_ARENA_LEVEL_DATA = [
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "K                              K",
    "K                              K",
    "K   UUUU                UUUU   K",
    "K                              K",
    "K         UUUUUUUUUUUU         K",
    "K                              K",
    "K                              K",
    "K  UUUU                    UUUUK",
    "K                              K",
    "K                              K",
    "K S                          X K",
    "K UUUUUUUUUUUUUUUUUUUUUUUUUUUUUK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK"
];

// 2. BOSS CREATION DATA FOR CATSTONE MONSTROSITY
function createCatstoneBossObject(x, y) {
    return {
        x: 256, y: 32,
        w: 512, h: 320,
        vx: 0, vy: 0,
        hp: 10,
        maxHp: 10,
        alive: true,
        catstone: true,
        phase: 'idle',
        phaseTimer: 90,
        dir: -1,
        frame: 0,
        flashTimer: 0,
        attackCount: 0,
        grounded: false,
        deathTimer: 0,
        bossPhase: 1,
        shakingPipeIndex: 0,
        shakingPipeTimer: 180,
        waterStreams: [],
        catMines: [],
        ratMines: [],
        laser1: { y: 350, trackingTimer: 180, activeTimer: 0, firing: false, lockedY: 350 },
        laser2: { y: 180, trackingTimer: 180, activeTimer: 0, firing: false, lockedY: 180 },
        mouthOpenTimer: 0
    };
}

// 3. CATSTONE MONSTROSITY UPDATE AI & ATTACK SYSTEM
function updateCatstoneBossArchive(boss, cat, cat2, coopMode, keys, keys2, T, frameCount, addParticle, addFloatingText, killCat, killCat2) {
    if (!boss || !boss.catstone) return;

    // Active pipe shaking timer & pipe selection
    if (boss.alive) {
        boss.shakingPipeTimer--;
        if (boss.shakingPipeTimer <= 0) {
            boss.shakingPipeTimer = 240 + Math.floor(Math.random() * 120);
            boss.shakingPipeIndex = Math.floor(Math.random() * 4);
        }
    }

    // 4 Ancient Water Pipes in 32x14 Arena (x, y)
    const pipes = [
        { x: 3 * T, y: 3 * T },
        { x: 26 * T, y: 3 * T },
        { x: 2 * T, y: 8 * T },
        { x: 27 * T, y: 8 * T }
    ];
    const activePipe = pipes[boss.shakingPipeIndex];

    // Steam/water droplets emitting around active shaking pipe
    if (boss.alive && frameCount % 6 === 0) {
        addParticle(activePipe.x + 16, activePipe.y + 16, '#00CCFF', 2, 4);
        addParticle(activePipe.x + 16, activePipe.y + 16, '#FFFFFF', 1, 3);
    }

    // Pipe interaction check (stomp top, scratch, fireball, pickaxe, or DOWN key near active pipe)
    const p1Hit = (!cat.dead && Math.abs(cat.x + cat.w / 2 - (activePipe.x + 16)) < 48 && Math.abs(cat.y + cat.h / 2 - (activePipe.y + 16)) < 48);
    const p2Hit = (coopMode && !cat2.dead && Math.abs(cat2.x + cat2.w / 2 - (activePipe.x + 16)) < 48 && Math.abs(cat2.y + cat2.h / 2 - (activePipe.y + 16)) < 48);

    if (boss.alive && ((p1Hit && (keys.glide || Math.abs(cat.vx) > 0.1)) || (p2Hit && (keys2.glide || Math.abs(cat2.vx) > 0.1)))) {
        if (!boss.pipeHitCooldown || boss.pipeHitCooldown <= 0) {
            boss.pipeHitCooldown = 90;
            if (window.audio) audio.playPowerUp();
            // High-Pressure Water Jet Stream from Pipe to Catstone face
            boss.waterStreams.push({
                x: activePipe.x + 16,
                y: activePipe.y + 16,
                targetX: boss.x + boss.w / 2,
                targetY: boss.y + 120,
                progress: 0,
                speed: 0.05
            });
            addFloatingText(activePipe.x + 16, activePipe.y - 10, '💧 WATER JET LAUNCHED!', '#00CCFF');
        }
    }
    if (boss.pipeHitCooldown > 0) boss.pipeHitCooldown--;

    // Update High-Pressure Water Streams
    for (let i = boss.waterStreams.length - 1; i >= 0; i--) {
        const ws = boss.waterStreams[i];
        ws.progress += ws.speed;
        const curX = ws.x + (ws.targetX - ws.x) * ws.progress;
        const curY = ws.y + (ws.targetY - ws.y) * ws.progress - Math.sin(ws.progress * Math.PI) * 60;
        addParticle(curX, curY, '#00CCFF', 3, 5);
        addParticle(curX, curY, '#FFFFFF', 2, 4);

        if (ws.progress >= 1) {
            // Water Impact on Catstone Monstrosity!
            boss.waterStreams.splice(i, 1);
            if (boss.alive) {
                boss.hp--;
                boss.flashTimer = 30;
                if (window.audio) audio.playGlitch();
                for (let p = 0; p < 35; p++) {
                    addParticle(ws.targetX + (Math.random() - 0.5) * 60, ws.targetY + (Math.random() - 0.5) * 60, ['#00CCFF', '#FFFFFF', '#88EEFF'][Math.floor(Math.random() * 3)], 5, 8);
                }
                addFloatingText(ws.targetX, ws.targetY - 20, '-1 DA DAMAGE!', '#FFD700');

                // Switch shaking pipe
                boss.shakingPipeIndex = (boss.shakingPipeIndex + 1 + Math.floor(Math.random() * 3)) % 4;

                // Boss Defeat
                if (boss.hp <= 0) {
                    boss.alive = false;
                    boss.deathTimer = 120;
                    if (window.audio) audio.playPowerUp();
                }
            }
        }
    }

    if (!boss.alive) return;

    // Attack 1: Tracking Lasers (Ground & High)
    if (boss.laser1) {
        if (!boss.laser1.firing) {
            boss.laser1.trackingTimer--;
            boss.laser1.targetY += (cat.y + cat.h / 2 - boss.laser1.targetY) * 0.05;
            if (boss.laser1.trackingTimer <= 0) {
                boss.laser1.firing = true;
                boss.laser1.activeTimer = 60;
                boss.laser1.lockedY = boss.laser1.targetY;
                if (window.audio) audio.playFireball();
            }
        } else {
            boss.laser1.activeTimer--;
            const beamY = boss.laser1.lockedY;
            if (!cat.dead && Math.abs(cat.y + cat.h / 2 - beamY) < 24) killCat();
            if (coopMode && !cat2.dead && Math.abs(cat2.y + cat2.h / 2 - beamY) < 24) killCat2();
            if (boss.laser1.activeTimer <= 0) {
                boss.laser1.firing = false;
                boss.laser1.trackingTimer = 240;
            }
        }
    }

    // Attack 2: Cat Mines (15 Mines)
    if (frameCount % 360 === 0) {
        boss.mouthOpenTimer = 60;
        for (let m = 0; m < 15; m++) {
            boss.catMines.push({
                x: boss.x + boss.w / 2,
                y: boss.y + 120,
                vx: (Math.random() - 0.5) * 10,
                vy: -3 - Math.random() * 5,
                timer: 600, // 10s countdown
                grounded: false
            });
        }
        if (window.audio) audio.playGlitch();
    }
    if (boss.mouthOpenTimer > 0) boss.mouthOpenTimer--;

    // Update Cat Mines
    for (let i = boss.catMines.length - 1; i >= 0; i--) {
        const cm = boss.catMines[i];
        cm.timer--;
        if (!cm.grounded) {
            cm.x += cm.vx;
            cm.y += cm.vy;
            cm.vy += 0.25;
            cm.vx *= 0.98;
            if (cm.y >= 352) { cm.y = 352; cm.grounded = true; cm.vx = 0; cm.vy = 0; }
        }
        const touchedP1 = !cat.dead && Math.abs(cat.x + cat.w / 2 - cm.x) < 18 && Math.abs(cat.y + cat.h / 2 - cm.y) < 18;
        const touchedP2 = coopMode && !cat2.dead && Math.abs(cat2.x + cat2.w / 2 - cm.x) < 18 && Math.abs(cat2.y + cat2.h / 2 - cm.y) < 18;

        if (cm.timer <= 0 || touchedP1 || touchedP2) {
            boss.catMines.splice(i, 1);
            if (window.audio) audio.playStomp();
            addParticle(cm.x, cm.y, '#FF4500', 15, 6);
            addParticle(cm.x, cm.y, '#FFD700', 10, 4);
            if (touchedP1) killCat();
            if (touchedP2) killCat2();
        }
    }

    // Attack 3: Rat Mines (Chasing Mines)
    if (frameCount % 240 === 0) {
        boss.ratMines.push({
            x: (Math.random() > 0.5 ? 96 : 864),
            y: 352,
            vx: 0,
            timer: 480
        });
    }
    for (let i = boss.ratMines.length - 1; i >= 0; i--) {
        const rm = boss.ratMines[i];
        rm.timer--;
        rm.vx += (cat.x - rm.x > 0 ? 0.4 : -0.4);
        rm.vx = Math.max(-3, Math.min(3, rm.vx));
        rm.x += rm.vx;

        const touchP1 = !cat.dead && Math.abs(cat.x + cat.w / 2 - rm.x) < 16 && Math.abs(cat.y + cat.h / 2 - rm.y) < 16;
        const touchP2 = coopMode && !cat2.dead && Math.abs(cat2.x + cat2.w / 2 - rm.x) < 16 && Math.abs(cat2.y + cat2.h / 2 - rm.y) < 16;
        if (rm.timer <= 0 || touchP1 || touchP2) {
            boss.ratMines.splice(i, 1);
            addParticle(rm.x, rm.y, '#FF2200', 12, 5);
            if (touchP1) killCat();
            if (touchP2) killCat2();
        }
    }
}

// 4. CATSTONE MONSTROSITY DRAWING ROUTINE
function drawCatstoneBossArchive(ctx, boss, cam, frameCount, W, H) {
    if (!boss || !boss.catstone) return;
    const bx = Math.round(boss.x - cam.x), by = Math.round(boss.y - (cam.y || 0));

    // 1. CARVED STONE MONSTROSITY FACE & WALL MACHINERY
    ctx.save();
    ctx.fillStyle = boss.alive ? (boss.flashTimer > 0 ? '#FF6666' : '#554840') : '#332E2B';
    ctx.strokeStyle = '#221C18';
    ctx.lineWidth = 4;

    // Giant Pointed Ears
    ctx.beginPath(); ctx.moveTo(bx + 60, by); ctx.lineTo(bx + 140, by - 80); ctx.lineTo(bx + 190, by + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + boss.w - 60, by); ctx.lineTo(bx + boss.w - 140, by - 80); ctx.lineTo(bx + boss.w - 190, by + 40); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Main Carved Stone Head Frame
    ctx.fillRect(bx + 40, by + 20, boss.w - 80, boss.h - 40);
    ctx.strokeRect(bx + 40, by + 20, boss.w - 80, boss.h - 40);

    // Ancient Machinery Gears Underneath Stone
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(bx + 120, by + 120, 24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + boss.w - 120, by + 120, 24, 0, Math.PI * 2); ctx.fill();

    // Mouth (Opens when launching Cat Mines)
    const mouthH = boss.mouthOpenTimer > 0 ? 50 : 16;
    ctx.fillStyle = '#110D0A';
    ctx.fillRect(bx + boss.w / 2 - 80, by + boss.h - 100, 160, mouthH);
    ctx.strokeStyle = '#FFD700'; ctx.strokeRect(bx + boss.w / 2 - 80, by + boss.h - 100, 160, mouthH);

    // Glowing Cat Eyes
    const eyeColor = !boss.alive ? '#222' : (boss.flashTimer > 0 ? '#FFFFFF' : (frameCount % 20 < 10 ? '#00FFFF' : '#FF00FF'));
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.ellipse(bx + 140, by + 100, 30, 20, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + boss.w - 140, by + 100, 30, 20, 0.2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // 2. INTEGRATED WALL HEALTH BAR (PART OF THE VAULT WALL ABOVE MONSTROSITY)
    const barX = Math.round(boss.x + boss.w / 2 - 200 - cam.x);
    const barY = Math.round(boss.y - 70 - (cam.y || 0));
    ctx.save();
    ctx.fillStyle = '#3A302A';
    ctx.strokeStyle = '#665544';
    ctx.lineWidth = 3;
    ctx.fillRect(barX - 12, barY - 10, 424, 44);
    ctx.strokeRect(barX - 12, barY - 10, 424, 44);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🗿 THE CATSTONE MONSTROSITY 🗿', barX + 200, barY - 14);

    for (let i = 0; i < boss.maxHp; i++) {
        const slotX = barX + i * 40;
        ctx.fillStyle = i < boss.hp ? (frameCount % 10 < 5 ? '#FFD700' : '#00FFFF') : '#111111';
        ctx.fillRect(slotX, barY, 34, 24);
        ctx.strokeStyle = '#665544';
        ctx.strokeRect(slotX, barY, 34, 24);
    }
    ctx.textAlign = 'left';
    ctx.restore();

    // 3. DRAW WATER STREAMS
    for (const ws of boss.waterStreams) {
        const curX = ws.x + (ws.targetX - ws.x) * ws.progress - cam.x;
        const curY = ws.y + (ws.targetY - ws.y) * ws.progress - Math.sin(ws.progress * Math.PI) * 60 - (cam.y || 0);
        ctx.fillStyle = '#00CCFF';
        ctx.beginPath(); ctx.arc(curX, curY, 12, 0, Math.PI * 2); ctx.fill();
    }

    // 4. DRAW TRACKING LASERS
    if (boss.laser1) {
        const ly = Math.round(boss.laser1.firing ? boss.laser1.lockedY - (cam.y || 0) : boss.laser1.targetY - (cam.y || 0));
        if (boss.laser1.firing) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.85)';
            ctx.fillRect(0, ly - 20, W, 40);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, ly - 6, W, 12);
        } else {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
            ctx.fillStyle = '#FF0000'; ctx.font = 'bold 8px monospace';
            ctx.fillText('⚠️ LASER LOCKING...', 10, ly - 4);
        }
    }

    // 5. DRAW CAT MINES
    for (const cm of boss.catMines) {
        const mx = Math.round(cm.x - cam.x), my = Math.round(cm.y - (cam.y || 0));
        ctx.fillStyle = '#443830';
        ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(mx - 8, my - 14, 4, 6); ctx.fillRect(mx + 4, my - 14, 4, 6);
        const secsLeft = Math.ceil(cm.timer / 60);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 9px monospace';
        ctx.fillText(String(secsLeft), mx - 3, my + 3);
    }

    // 6. DRAW RAT MINES
    for (const rm of boss.ratMines) {
        const rx = Math.round(rm.x - cam.x), ry = Math.round(rm.y - (cam.y || 0));
        ctx.fillStyle = '#8B0000';
        ctx.beginPath(); ctx.arc(rx, ry, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFD700'; ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }
}
