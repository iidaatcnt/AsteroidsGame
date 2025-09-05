// Asteroids風ゲーム - ゲームロジック

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// ゲーム状態
let score = 0;
let lives = 3;
let keys = {};
let invulnerable = 0; // 無敵時間
let gameOver = false;
let isDemo = false;
let lastUserInput = Date.now();
let demoActionTimer = 0;
let demoTarget = null;

// 宇宙船
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    size: 8
};

// 弾丸配列
let bullets = [];

// 小惑星配列
let asteroids = [];

// 初期小惑星を生成
function createAsteroid(x, y, size) {
    return {
        x: x || Math.random() * canvas.width,
        y: y || Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: size || 40,
        angle: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
}

// 初期小惑星を配置
for (let i = 0; i < 8; i++) {
    asteroids.push(createAsteroid());
}

// キーボードイベント
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // ユーザー入力を記録
    lastUserInput = Date.now();
    
    // デモモード中の場合は終了
    if (isDemo) {
        stopDemo();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// 宇宙船を描画
function drawShip() {
    if (invulnerable > 0 && Math.floor(invulnerable / 5) % 2) {
        return; // 点滅効果
    }
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    // デモモード中は光る輪郭を追加
    if (isDemo) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, ship.size * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, -ship.size/2);
    ctx.lineTo(-ship.size/2, 0);
    ctx.lineTo(-ship.size, ship.size/2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

// 小惑星を描画
function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = asteroid.size * (0.8 + Math.sin(i * 3) * 0.2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

// 弾丸を描画
function drawBullet(bullet) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
}

// ラップアラウンド（画面端処理）
function wrapPosition(obj) {
    if (obj.x < 0) obj.x = canvas.width;
    if (obj.x > canvas.width) obj.x = 0;
    if (obj.y < 0) obj.y = canvas.height;
    if (obj.y > canvas.height) obj.y = 0;
}

// 衝突判定
function checkCollision(obj1, obj2, distance) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
}

// 弾丸発射
function shootBullet() {
    const bullet = {
        x: ship.x + Math.cos(ship.angle) * ship.size,
        y: ship.y + Math.sin(ship.angle) * ship.size,
        vx: Math.cos(ship.angle) * 8 + ship.vx,
        vy: Math.sin(ship.angle) * 8 + ship.vy,
        life: 60
    };
    bullets.push(bullet);
}

// 宇宙船がダメージを受ける
function damageShip() {
    if (invulnerable > 0) return; // 無敵時間中は無効
    
    lives--;
    invulnerable = 120; // 2秒間無敵
    
    // 宇宙船を中央にリセット
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
    
    if (lives <= 0) {
        gameOver = true;
    }
}

// ゲームをリセット
function resetGame() {
    lives = 3;
    score = 0;
    gameOver = false;
    invulnerable = 0;
    asteroids = [];
    bullets = [];
    
    // 宇宙船をリセット
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
    
    // 初期小惑星を生成
    for (let i = 0; i < 8; i++) {
        asteroids.push(createAsteroid());
    }
    
    // デモモードでない場合は入力時間を更新
    if (!isDemo) {
        lastUserInput = Date.now();
    }
}

// ゲームオーバー画面を描画
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px Arial';
    ctx.fillText('最終スコア: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '18px Arial';
    ctx.fillText('スペースキーを押して再スタート', canvas.width / 2, canvas.height / 2 + 60);
}

// デモモードのAI制御
function updateDemoAI() {
    demoActionTimer++;
    
    // 10フレームごとに行動を更新（よりスムーズな動き）
    if (demoActionTimer < 10) return;
    demoActionTimer = 0;
    
    // 最も近い小惑星をターゲットにする
    let nearestAsteroid = null;
    let nearestDistance = Infinity;
    let bestTarget = null;
    let bestTargetScore = -Infinity;
    
    asteroids.forEach(asteroid => {
        const dx = asteroid.x - ship.x;
        const dy = asteroid.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestAsteroid = asteroid;
        }
        
        // 狙いやすいターゲットを選ぶ（距離と角度を考慮）
        const angle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angle - ship.angle));
        const score = 1000 / distance - angleDiff * 100;
        
        if (score > bestTargetScore && distance < 400) {
            bestTargetScore = score;
            bestTarget = asteroid;
        }
    });
    
    // デフォルトで全てのキーをオフ
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['ArrowUp'] = false;
    keys['Space'] = false;
    
    if (nearestAsteroid) {
        // 危険な距離の小惑星がある場合
        if (nearestDistance < 80) {
            // 緊急回避が必要
            const avoidAngle = Math.atan2(
                ship.y - nearestAsteroid.y,
                ship.x - nearestAsteroid.x
            );
            
            // 回避方向に回転
            const angleDiff = normalizeAngle(avoidAngle - ship.angle);
            if (Math.abs(angleDiff) > 0.3) {
                if (angleDiff > 0) {
                    keys['ArrowRight'] = true;
                } else {
                    keys['ArrowLeft'] = true;
                }
            }
            
            // 短時間だけ推進して回避
            if (Math.abs(angleDiff) < Math.PI / 4) {
                keys['ArrowUp'] = true;
            }
        } else if (bestTarget) {
            // 狙いやすいターゲットに向けて回転して射撃
            const targetX = bestTarget.x;
            const targetY = bestTarget.y;
            
            // 少し先の位置を予測
            const predictTime = Math.min(nearestDistance / 8, 30);
            const predictedX = targetX + bestTarget.vx * predictTime;
            const predictedY = targetY + bestTarget.vy * predictTime;
            
            const targetAngle = Math.atan2(
                predictedY - ship.y,
                predictedX - ship.x
            );
            
            const angleDiff = normalizeAngle(targetAngle - ship.angle);
            
            // 精密な回転制御
            if (Math.abs(angleDiff) > 0.1) {
                if (Math.abs(angleDiff) > 0.5) {
                    // 大きく向きが違う場合は速く回転
                    if (angleDiff > 0) {
                        keys['ArrowRight'] = true;
                    } else {
                        keys['ArrowLeft'] = true;
                    }
                } else {
                    // 微調整（1フレームおきに回転）
                    if (Date.now() % 100 < 50) {
                        if (angleDiff > 0) {
                            keys['ArrowRight'] = true;
                        } else {
                            keys['ArrowLeft'] = true;
                        }
                    }
                }
            } else {
                // 狙いが定まったら射撃
                const distance = Math.sqrt(
                    Math.pow(predictedX - ship.x, 2) + 
                    Math.pow(predictedY - ship.y, 2)
                );
                
                // 距離が適切なら射撃
                if (distance < 350 && distance > 50) {
                    keys['Space'] = true;
                }
            }
            
            // 速度制御（ほとんど移動しない）
            const currentSpeed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
            
            // 速度が速すぎる場合のみブレーキ（逆方向に推進）
            if (currentSpeed > 2) {
                const velocityAngle = Math.atan2(ship.vy, ship.vx);
                const reverseAngle = velocityAngle + Math.PI;
                const brakeDiff = normalizeAngle(reverseAngle - ship.angle);
                
                if (Math.abs(brakeDiff) < Math.PI / 4) {
                    // ブレーキをかける方向を向いている場合のみ推進
                    if (Date.now() % 100 < 30) { // 短時間だけ
                        keys['ArrowUp'] = true;
                    }
                }
            }
            
            // 画面端に近い場合は中央へ移動
            const edgeDistance = 100;
            if (ship.x < edgeDistance || ship.x > canvas.width - edgeDistance ||
                ship.y < edgeDistance || ship.y > canvas.height - edgeDistance) {
                
                const centerAngle = Math.atan2(
                    canvas.height / 2 - ship.y,
                    canvas.width / 2 - ship.x
                );
                const centerDiff = normalizeAngle(centerAngle - ship.angle);
                
                if (Math.abs(centerDiff) < Math.PI / 6) {
                    // 中央を向いている時だけ少し推進
                    if (Date.now() % 100 < 20) {
                        keys['ArrowUp'] = true;
                    }
                }
            }
        }
    }
}

// 角度を-PIからPIの範囲に正規化
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// デモモードのチェック
function checkDemoMode() {
    if (gameOver || isDemo) return;
    
    // 5秒間操作がなければデモモード開始
    if (Date.now() - lastUserInput > 5000) {
        startDemo();
    }
}

// デモモード開始
function startDemo() {
    isDemo = true;
    demoActionTimer = 0;
    resetGame();
    document.getElementById('demoText').style.display = 'block';
}

// デモモード終了
function stopDemo() {
    if (isDemo) {
        isDemo = false;
        document.getElementById('demoText').style.display = 'none';
        resetGame();
        // 全てのキーをリセット
        Object.keys(keys).forEach(key => keys[key] = false);
    }
}

// ゲームループ
function gameLoop() {
    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // デモモードのチェック
    checkDemoMode();
    
    // ゲームオーバー時の処理
    if (gameOver) {
        if (isDemo) {
            // デモモード中は自動リスタート
            setTimeout(() => {
                resetGame();
                isDemo = true;
            }, 2000);
        } else {
            drawGameOver();
        }
        
        // スペースキーで再スタート
        if (keys['Space']) {
            if (!keys.spacePressed) {
                resetGame();
                keys.spacePressed = true;
            }
        } else {
            keys.spacePressed = false;
        }
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // デモモード中はAIが操作
    if (isDemo) {
        updateDemoAI();
    }

    // 無敵時間を減らす
    if (invulnerable > 0) {
        invulnerable--;
    }

    // 宇宙船の操作
    if (keys['ArrowLeft']) {
        ship.angle -= 0.15;
    }
    if (keys['ArrowRight']) {
        ship.angle += 0.15;
    }
    if (keys['ArrowUp']) {
        const thrust = 0.3;
        ship.vx += Math.cos(ship.angle) * thrust;
        ship.vy += Math.sin(ship.angle) * thrust;
        
        // 推進エフェクト
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-ship.size, -3);
        ctx.lineTo(-ship.size - 8, 0);
        ctx.lineTo(-ship.size, 3);
        ctx.stroke();
        ctx.restore();
    }
    if (keys['Space']) {
        if (!keys.spacePressed) {
            shootBullet();
            keys.spacePressed = true;
        }
    } else {
        keys.spacePressed = false;
    }

    // 摩擦と最大速度制限
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    const maxSpeed = 8;
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    if (speed > maxSpeed) {
        ship.vx = (ship.vx / speed) * maxSpeed;
        ship.vy = (ship.vy / speed) * maxSpeed;
    }

    // 宇宙船の位置更新
    ship.x += ship.vx;
    ship.y += ship.vy;
    wrapPosition(ship);

    // 弾丸の更新
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        
        wrapPosition(bullet);
        
        if (bullet.life <= 0) {
            bullets.splice(i, 1);
        }
    }

    // 小惑星の更新
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.angle += asteroid.rotationSpeed;
        wrapPosition(asteroid);
    });

    // 弾丸と小惑星の衝突判定
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            if (checkCollision(bullet, asteroid, asteroid.size)) {
                bullets.splice(i, 1);
                
                // スコア加算
                score += Math.floor(100 / (asteroid.size / 10));
                
                // 小惑星を分裂
                if (asteroid.size > 15) {
                    for (let k = 0; k < 2; k++) {
                        const newAsteroid = createAsteroid(
                            asteroid.x,
                            asteroid.y,
                            asteroid.size / 2
                        );
                        asteroids.push(newAsteroid);
                    }
                }
                
                asteroids.splice(j, 1);
                break;
            }
        }
    }

    // 宇宙船と小惑星の衝突判定
    if (invulnerable === 0) {
        for (let j = 0; j < asteroids.length; j++) {
            const asteroid = asteroids[j];
            if (checkCollision(ship, asteroid, asteroid.size + ship.size)) {
                damageShip();
                break;
            }
        }
    }

    // 新しい小惑星を追加（全て破壊された場合）
    if (asteroids.length === 0) {
        for (let i = 0; i < Math.min(10, 5 + Math.floor(score / 1000)); i++) {
            asteroids.push(createAsteroid());
        }
    }

    // 描画
    drawShip();
    bullets.forEach(drawBullet);
    asteroids.forEach(drawAsteroid);

    // スコアとライフ更新
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();