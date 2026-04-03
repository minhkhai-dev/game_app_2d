// app/page.tsx
'use client';

import { Bone, Skull } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

// Định nghĩa các kiểu dữ liệu
interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const SIZE: number = 30; // Bảng 20x20
const CELL: number = 25; // Mỗi ô 25px
const INIT_SNAKE: Position[] = [{ x: 10, y: 10 }];

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INIT_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(200);
  const [scoreMax, setScoreMax] = useState(0);

  // Tải điểm cao nhất
  useEffect(() => {
    const daLuu = localStorage.getItem('scoreMaxSnake');
    if (daLuu) setScoreMax(parseInt(daLuu));
  }, []);

  // Lưu điểm cao nhất
  useEffect(() => {
    if (score > scoreMax) {
      setScoreMax(score);
      localStorage.setItem('scoreMaxSnake', score.toString());
    }
  }, [score, scoreMax]);

  // Tạo thức ăn mới (tránh vị trí rắn)
  const randomFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * SIZE),
        y: Math.floor(Math.random() * SIZE),
      };
    } while (snakeBody.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  // Di chuyển rắn
  const move = useCallback(() => {
    if (gameOver || !playing) return;

    setSnake(prev => {
      const newSnake: Position[] = [...prev];
      const head: Position = newSnake[0];
      let newHead: Position = { ...head };

      switch (direction) {
        case 'RIGHT':
          newHead.x++;
          break;
        case 'LEFT':
          newHead.x--;
          break;
        case 'UP':
          newHead.y--;
          break;
        case 'DOWN':
          newHead.y++;
          break;
      }

      // Chạm tường
      if (newHead.x < 0 || newHead.x >= SIZE || newHead.y < 0 || newHead.y >= SIZE) {
        setGameOver(true);
        setPlaying(false);
        return prev;
      }

      const eating: boolean = newHead.x === food.x && newHead.y === food.y;

      newSnake.unshift(newHead);
      if (!eating) newSnake.pop();

      // Chạm thân
      if (newSnake.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        setPlaying(false);
        return prev;
      }

      if (eating) {
        setScore(s => s + 1);
        setSpeed(a => a > 50 ? a - 2 : a)
        setFood(randomFood(newSnake));
      }

      return newSnake;
    });
  }, [gameOver, playing, direction, food, randomFood]);

  // Vòng lặp game
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(move, speed);
    return () => clearInterval(interval);
  }, [playing, gameOver, direction, move]);

  // Điều khiển bàn phím
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === ' ' || key === 'Space') setPlaying(!playing)
      if (!playing || gameOver) return;

      if (key === 'ArrowUp' && direction !== 'DOWN') setDirection('UP');
      if (key === 'ArrowDown' && direction !== 'UP') setDirection('DOWN');
      if (key === 'ArrowLeft' && direction !== 'RIGHT') setDirection('LEFT');
      if (key === 'ArrowRight' && direction !== 'LEFT') setDirection('RIGHT');
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing, gameOver, direction]);

  // Vẽ game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nền
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);

    // Vẽ thức ăn
    ctx.fillStyle = '#99ffff';
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);

    // Vẽ rắn
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? 'red' : 'white';
      ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
    });
  }, [snake, food]);

  const start = (): void => {
    setSnake(INIT_SNAKE);
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    setFood({ x: 15, y: 10 });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f0f1a',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          padding: '0 10px'
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>
            Điểm: <strong style={{ color: '#ff6b6b' }}>{score}</strong>
          </span>
          <span className='text-white text-lg font-semibold'>RẮN SĂN MỒI</span>
          <button onClick={start} className='bg-emerald-500 text-sm border-none text-white px-5 py-2 rounded-sm cursor-pointer font-bold'>
            {gameOver ? 'CHƠI LẠI' : 'BẮT ĐẦU'}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={SIZE * CELL}
          height={SIZE * CELL}
          style={{
            border: '2px solid #333',
            borderRadius: '10px',
            display: 'block',
            margin: '0 auto'
          }}
        />

        {gameOver && (
          <div className='flex flex-col gap-5 items-center'>
            <div className='mt-3.75 text-[#ff6b6b] text-lg flex items-center justify-center gap-3 font-semibold'>
              <Skull /> GAME OVER
            </div>
            <div className='text-white flex gap-10 justify-between w-full'>
              <span>Điểm: {score}</span>
              <span>Kỷ lục: {scoreMax}</span>
            </div>
          </div>
        )}

        {!playing && !gameOver && (
          <div className='text-[#888] flex w-full justify-between my-3'>
            <span>Dùng 4 phím mũi tên để di chuyển</span>
            <span>Dùng SPACE để PLAY / PAUSE</span>
          </div>
        )}
      </div>
    </div>
  );
}