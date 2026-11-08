// app/space-shooter/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Định nghĩa các kiểu dữ liệu
interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  type: 'normal' | 'fast' | 'tank';
  hitCount?: number;
}

interface Explosion {
  x: number;
  y: number;
  frames: number;
}

// Kích thước game
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const BULLET_SIZE = 5;
const ENEMY_SIZE = 90;

// Emoji fallback (khi ảnh chưa tải xong)
const ENEMY_EMOJI = {
  normal: '👾',
  fast: '👻',
  tank: '🤖',
};

export default function SpaceShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(5);
  const [level, setLevel] = useState<number>(1);

  // State lưu ảnh enemy
  const [enemyImages, setEnemyImages] = useState({
    normal: null as HTMLImageElement | null,
    fast: null as HTMLImageElement | null,
    tank: null as HTMLImageElement | null,
  });

  const playerRef = useRef<Player>({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - 80,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const shootCooldownRef = useRef<number>(0);
  const enemySpawnCooldownRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  // Tải ảnh enemy
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
      });
    };

    Promise.all([
      loadImage('/image/hinhCun.webp'),
      loadImage('/image/hinhCun.webp'),
      loadImage('/image/hinhCun.webp'),
    ])
      .then(([normal, fast, tank]) => {
        setEnemyImages({ normal, fast, tank });
      })
      .catch((err) => {
        console.warn('Không tải được ảnh, sẽ dùng emoji fallback', err);
      });
  }, []);

  // Khởi tạo game
  const initGame = useCallback(() => {
    playerRef.current = {
      x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    explosionsRef.current = [];
    keysRef.current.clear();
    shootCooldownRef.current = 0;
    enemySpawnCooldownRef.current = 0;
    frameRef.current = 0;
    setScore(0);
    setLives(5);
    setLevel(1);
    setGameOver(false);
  }, []);

  // Bắt đầu game
  const startGame = useCallback(() => {
    initGame();
    setGameStarted(true);
    setGameOver(false);
  }, [initGame]);

  // Bắn đạn (chỉ khi nhấn space)
  const shoot = useCallback(() => {
    if (shootCooldownRef.current > 0) return;
    if (!keysRef.current.has(' ')) return; // CHỈ BẮN KHI NHẤN SPACE

    bulletsRef.current.push({
      x: playerRef.current.x + PLAYER_WIDTH / 2 - BULLET_SIZE / 2,
      y: playerRef.current.y,
      width: BULLET_SIZE,
      height: BULLET_SIZE * 2,
      active: true,
    });
    shootCooldownRef.current = 10;
  }, []);

  // Tạo enemy mới
  const spawnEnemy = useCallback(() => {
    const rand = Math.random();
    let type: 'normal' | 'fast' | 'tank' = 'normal';

    if (level >= 5) {
      if (rand < 0.2) type = 'tank';
      else if (rand < 0.4) type = 'fast';
    } else if (level >= 3) {
      if (rand < 0.3) type = 'fast';
    }

    enemiesRef.current.push({
      x: Math.random() * (GAME_WIDTH - ENEMY_SIZE),
      y: -ENEMY_SIZE,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      active: true,
      type,
      hitCount: 0,
    });
  }, [level]);

  // Cập nhật game logic
  const updateGame = useCallback(() => {
    if (!gameStarted || gameOver) return;

    // Di chuyển player
    const speed = 8;
    if (keysRef.current.has('ArrowLeft') && playerRef.current.x > 0) {
      playerRef.current.x -= speed;
    }
    if (keysRef.current.has('ArrowRight') && playerRef.current.x < GAME_WIDTH - PLAYER_WIDTH) {
      playerRef.current.x += speed;
    }
    if (keysRef.current.has('ArrowUp') && playerRef.current.y > GAME_HEIGHT - 200) {
      playerRef.current.y -= speed;
    }
    if (keysRef.current.has('ArrowDown') && playerRef.current.y < GAME_HEIGHT - PLAYER_HEIGHT) {
      playerRef.current.y += speed;
    }

    // Bắn đạn (gọi mỗi frame nhưng bên trong shoot đã kiểm tra cooldown và phím)
    shoot();

    // Cooldown
    if (shootCooldownRef.current > 0) shootCooldownRef.current--;

    // Spawn enemy
    const spawnRate = Math.max(20, 50 - level * 2);
    if (enemySpawnCooldownRef.current <= 0) {
      spawnEnemy();
      enemySpawnCooldownRef.current = spawnRate;
    } else {
      enemySpawnCooldownRef.current--;
    }

    // Cập nhật đạn
    bulletsRef.current = bulletsRef.current.filter((bullet) => {
      bullet.y -= 7;
      return bullet.y > 0 && bullet.active;
    });

    // Cập nhật enemy
    for (let i = 0; i < enemiesRef.current.length; i++) {
      const enemy = enemiesRef.current[i];
      let speed = 2;
      if (enemy.type === 'fast') speed = 5;
      else if (enemy.type === 'tank') speed = 1.5;

      enemy.y += speed + level * 0.2;

      if (enemy.y > GAME_HEIGHT) {
        enemiesRef.current.splice(i, 1);
        i--;
      }
    }

    // Va chạm đạn - enemy
    for (let i = 0; i < bulletsRef.current.length; i++) {
      const bullet = bulletsRef.current[i];
      for (let j = 0; j < enemiesRef.current.length; j++) {
        const enemy = enemiesRef.current[j];
        if (
          bullet.active &&
          enemy.active &&
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          bullet.active = false;

          if (enemy.type === 'tank') {
            enemy.hitCount = (enemy.hitCount || 0) + 1;
            if (enemy.hitCount >= 3) {
              enemy.active = false;
              explosionsRef.current.push({ x: enemy.x, y: enemy.y, frames: 10 });
              setScore((prev) => prev + 30);
            } else {
              explosionsRef.current.push({ x: enemy.x, y: enemy.y, frames: 5 });
              setScore((prev) => prev + 10);
            }
          } else {
            enemy.active = false;
            explosionsRef.current.push({ x: enemy.x, y: enemy.y, frames: 10 });
            setScore((prev) => prev + (enemy.type === 'fast' ? 20 : 10));
          }
          break;
        }
      }
    }

    // Xóa enemy, đạn không active
    enemiesRef.current = enemiesRef.current.filter((e) => e.active);
    bulletsRef.current = bulletsRef.current.filter((b) => b.active);

    // Va chạm player - enemy
    for (let i = 0; i < enemiesRef.current.length; i++) {
      const enemy = enemiesRef.current[i];
      if (
        enemy.active &&
        playerRef.current.x < enemy.x + enemy.width &&
        playerRef.current.x + PLAYER_WIDTH > enemy.x &&
        playerRef.current.y < enemy.y + enemy.height &&
        playerRef.current.y + PLAYER_HEIGHT > enemy.y
      ) {
        enemy.active = false;
        explosionsRef.current.push({ x: playerRef.current.x, y: playerRef.current.y, frames: 20 });
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setGameStarted(false);
            if (score > highScore) setHighScore(score);
          }
          return newLives;
        });
        playerRef.current.x = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
        playerRef.current.y = GAME_HEIGHT - 80;
        break;
      }
    }

    // Cập nhật explosions
    explosionsRef.current = explosionsRef.current.filter((exp) => {
      exp.frames--;
      return exp.frames > 0;
    });

    // Tăng level
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) setLevel(newLevel);

    frameRef.current++;
  }, [gameStarted, gameOver, shoot, spawnEnemy, level, score, highScore]);

  // Vẽ game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sao
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      const starX = (i * 131) % GAME_WIDTH;
      const starY = (frameRef.current * 0.5 + i * 97) % GAME_HEIGHT;
      ctx.fillRect(starX, starY, 2, 2);
    }

    // Player
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00bfff';
    ctx.beginPath();
    ctx.moveTo(playerRef.current.x + PLAYER_WIDTH / 2, playerRef.current.y);
    ctx.lineTo(playerRef.current.x + PLAYER_WIDTH - 5, playerRef.current.y + PLAYER_HEIGHT - 10);
    ctx.lineTo(playerRef.current.x + PLAYER_WIDTH / 2, playerRef.current.y + PLAYER_HEIGHT);
    ctx.lineTo(playerRef.current.x + 5, playerRef.current.y + PLAYER_HEIGHT - 10);
    ctx.fill();
    ctx.fillStyle = '#1e90ff';
    ctx.fillRect(playerRef.current.x + 5, playerRef.current.y + PLAYER_HEIGHT - 15, 30, 8);
    const engineGlow = frameRef.current % 10 < 5 ? '#ff4500' : '#ff6347';
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.moveTo(playerRef.current.x + PLAYER_WIDTH / 2 - 8, playerRef.current.y + PLAYER_HEIGHT - 5);
    ctx.lineTo(playerRef.current.x + PLAYER_WIDTH / 2, playerRef.current.y + PLAYER_HEIGHT + 5);
    ctx.lineTo(playerRef.current.x + PLAYER_WIDTH / 2 + 8, playerRef.current.y + PLAYER_HEIGHT - 5);
    ctx.fill();
    ctx.restore();

    // Đạn
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffff00';
    for (const bullet of bulletsRef.current) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Enemy - VẼ ẢNH (hoặc emoji fallback)
    for (const enemy of enemiesRef.current) {
      let img: HTMLImageElement | null = null;
      if (enemy.type === 'normal') img = enemyImages.normal;
      else if (enemy.type === 'fast') img = enemyImages.fast;
      else if (enemy.type === 'tank') img = enemyImages.tank;

      if (img && img.complete) {
        ctx.drawImage(img, enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE);
      } else {
        // Fallback: vẽ emoji
        ctx.font = `${ENEMY_SIZE - 5}px "Segoe UI Emoji", "Apple Color Emoji"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(ENEMY_EMOJI[enemy.type], enemy.x + ENEMY_SIZE / 2, enemy.y + ENEMY_SIZE / 2);
      }

      // Hiển thị số máu cho tank
      if (enemy.type === 'tank' && (enemy.hitCount || 0) > 0) {
        ctx.font = '12px monospace';
        ctx.fillStyle = 'red';
        ctx.fillText(`${3 - (enemy.hitCount || 0)}`, enemy.x + ENEMY_SIZE / 2, enemy.y + 5);
      }
    }

    // Explosions
    for (const exp of explosionsRef.current) {
      const size = 20 - exp.frames;
      ctx.fillStyle = `rgba(255, ${100 - exp.frames * 10}, 0, ${1 - exp.frames / 10})`;
      ctx.beginPath();
      ctx.arc(exp.x + ENEMY_SIZE / 2, exp.y + ENEMY_SIZE / 2, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // UI
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillText(`Level: ${level}`, 20, 90);
    ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 20, 130);
    ctx.fillText(`High: ${highScore}`, GAME_WIDTH - 150, 50);

    // Màn hình bắt đầu
    if (!gameStarted && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.fillText('SPACE SHOOTER', GAME_WIDTH / 2 - 180, GAME_HEIGHT / 2 - 50);
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillStyle = 'white';
      ctx.fillText('Press SPACE to Start', GAME_WIDTH / 2 - 140, GAME_HEIGHT / 2 + 20);
      ctx.fillText('Arrow Keys to Move', GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 60);
      ctx.fillText('Hold SPACE to Shoot', GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 100);
    }

    // Màn hình game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff0000';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2 - 140, GAME_HEIGHT / 2 - 50);
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillStyle = 'white';
      ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2 - 90, GAME_HEIGHT / 2 + 20);
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.fillText('Press SPACE to Play Again', GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 100);
    }
  }, [gameStarted, gameOver, score, level, lives, highScore, enemyImages]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [updateGame, draw]);

  // Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted && !gameOver) startGame();
        else if (gameOver) startGame();
        keysRef.current.add(' ');
      } else if (
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown'
      ) {
        e.preventDefault();
        keysRef.current.add(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') keysRef.current.delete(' ');
      else if (
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown'
      ) {
        keysRef.current.delete(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, startGame]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="bg-gray-800 shadow-2xl rounded-lg">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="rounded-lg shadow-lg cursor-pointer"
          style={{ display: 'block', margin: '0 auto' }}
        />
      </div>
    </div>
  );
}