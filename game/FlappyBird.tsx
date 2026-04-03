// app/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// Định nghĩa các kiểu dữ liệu
interface Bird {
    x: number;
    y: number;
    velocity: number;
}

interface Pipe {
    x: number;
    topHeight: number;
    bottomY: number;
    passed: boolean;
}

// Kích thước game
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 500;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_SPACING = 250;
const PIPE_SPEED = 2;

export default function FlappyBird() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [highScore, setHighScore] = useState<number>(0);

    const birdRef = useRef<Bird>({ x: 100, y: GAME_HEIGHT / 2, velocity: 0 });
    const pipesRef = useRef<Pipe[]>([]);
    const animationRef = useRef<number>(0);
    const frameRef = useRef<number>(0);

    // Khởi tạo game
    const initGame = useCallback(() => {
        birdRef.current = {
            x: 100,
            y: GAME_HEIGHT / 2,
            velocity: 0,
        };

        pipesRef.current = [];
        setScore(0);
        setGameOver(false);
        frameRef.current = 0;

        // Tạo ống ban đầu
        for (let i = 0; i < 3; i++) {
            const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
            pipesRef.current.push({
                x: GAME_WIDTH + i * PIPE_SPACING,
                topHeight: topHeight,
                bottomY: topHeight + PIPE_GAP,
                passed: false,
            });
        }
    }, []);

    // Bắt đầu game
    const startGame = useCallback(() => {
        initGame();
        setGameStarted(true);
        setGameOver(false);
    }, [initGame]);

    // Bird nhảy
    const jump = useCallback(() => {
        if (!gameStarted || gameOver) {
            startGame();
            return;
        }
        birdRef.current.velocity = JUMP_FORCE;
    }, [gameStarted, gameOver, startGame]);

    // Cập nhật game logic
    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver) return;

        // Cập nhật bird
        birdRef.current.velocity += GRAVITY;
        birdRef.current.y += birdRef.current.velocity;

        // Kiểm tra va chạm với tường
        if (birdRef.current.y <= 0 || birdRef.current.y + BIRD_SIZE >= GAME_HEIGHT) {
            setGameOver(true);
            setGameStarted(false);
            if (score > highScore) setHighScore(score);
            return;
        }

        // Cập nhật ống và kiểm tra va chạm
        for (let i = 0; i < pipesRef.current.length; i++) {
            const pipe = pipesRef.current[i];
            pipe.x -= PIPE_SPEED;

            // Tạo ống mới khi ống cũ ra khỏi màn hình
            if (pipe.x + PIPE_WIDTH < 0) {
                const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
                pipesRef.current[i] = {
                    x: GAME_WIDTH,
                    topHeight: topHeight,
                    bottomY: topHeight + PIPE_GAP,
                    passed: false,
                };
            }

            // Kiểm tra va chạm với ống
            if (
                birdRef.current.x + BIRD_SIZE > pipe.x &&
                birdRef.current.x < pipe.x + PIPE_WIDTH &&
                (birdRef.current.y < pipe.topHeight ||
                    birdRef.current.y + BIRD_SIZE > pipe.bottomY)
            ) {
                setGameOver(true);
                setGameStarted(false);
                if (score > highScore) setHighScore(score);
                return;
            }

            // Tính điểm
            if (!pipe.passed && pipe.x + PIPE_WIDTH < birdRef.current.x) {
                pipe.passed = true;
                setScore(prev => prev + 1);
            }
        }

        frameRef.current++;
    }, [gameStarted, gameOver, score, highScore]);

    // Vẽ game
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        // Xóa canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Vẽ background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Vẽ mây
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(80, 80, 40, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(110, 70, 35, 28, 0, 0, Math.PI * 2);
        ctx.ellipse(50, 70, 35, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(300, 120, 45, 35, 0, 0, Math.PI * 2);
        ctx.ellipse(340, 110, 38, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(270, 110, 38, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ ống
        for (const pipe of pipesRef.current) {
            // ống trên
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

            // Viền ống trên
            ctx.fillStyle = '#2E7D32';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 40, PIPE_WIDTH + 10, 40);
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(pipe.x - 3, pipe.topHeight - 40, PIPE_WIDTH + 6, 40);

            // ống dưới
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, GAME_HEIGHT - pipe.bottomY);

            // Viền ống dưới
            ctx.fillStyle = '#2E7D32';
            ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 40);
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, 40);

            // Chi tiết ống
            ctx.fillStyle = '#66BB6A';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(pipe.x + 10 + i * 15, pipe.topHeight - 20, 5, 15);
                ctx.fillRect(pipe.x + 10 + i * 15, pipe.bottomY + 10, 5, 15);
            }
        }

        // Vẽ bird (chim)
        const birdY = birdRef.current.y;
        const rotation = Math.min(Math.max(birdRef.current.velocity * 3, -30), 30);

        ctx.save();
        ctx.translate(birdRef.current.x + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2);
        ctx.rotate(rotation * Math.PI / 180);

        // Thân chim
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mắt chim
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(BIRD_SIZE / 4, -BIRD_SIZE / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(BIRD_SIZE / 4 + 2, -BIRD_SIZE / 6 - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(BIRD_SIZE / 4 + 3, -BIRD_SIZE / 6 - 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Mỏ chim
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(BIRD_SIZE / 2.5, -BIRD_SIZE / 8);
        ctx.lineTo(BIRD_SIZE / 1.5, -BIRD_SIZE / 12);
        ctx.lineTo(BIRD_SIZE / 2.5, 0);
        ctx.fill();

        // Mào chim
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(-BIRD_SIZE / 3, -BIRD_SIZE / 3);
        ctx.lineTo(-BIRD_SIZE / 5, -BIRD_SIZE / 2);
        ctx.lineTo(-BIRD_SIZE / 6, -BIRD_SIZE / 3);
        ctx.fill();

        // Cánh chim
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(-BIRD_SIZE / 2.5, 0);
        ctx.quadraticCurveTo(-BIRD_SIZE / 1.5, BIRD_SIZE / 3, -BIRD_SIZE / 3, BIRD_SIZE / 2.5);
        ctx.lineTo(-BIRD_SIZE / 4, BIRD_SIZE / 4);
        ctx.fill();

        ctx.restore();

        // Vẽ mặt đất
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, GAME_HEIGHT - 55, GAME_WIDTH, 5);

        // Cỏ
        ctx.fillStyle = '#228B22';
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(i * 40 + (frameRef.current % 40), GAME_HEIGHT - 50, 3, 15);
        }

        // Hiển thị điểm
        ctx.font = 'bold 36px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillText(score.toString(), GAME_WIDTH / 2 - 15, 60);
        ctx.shadowBlur = 0;

        // High score
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.fillText(`Best: ${highScore}`, GAME_WIDTH - 100, 40);

        // Màn hình bắt đầu / Game Over
        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            ctx.font = 'bold 25px "Press Start 2P", monospace';
            ctx.fillStyle = 'white';
            ctx.fillText('FLAPPY BIRD', GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 - 50);
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            ctx.font = 'bold 30px "Press Start 2P", monospace';
            ctx.fillStyle = '#FF4444';
            ctx.fillText('GAME OVER', GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2 - 50);

            ctx.font = 'bold 18px "Press Start 2P", monospace';
            ctx.fillStyle = 'white';
            ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2);
        }
    }, [gameStarted, gameOver, score, highScore, birdRef.current.y, birdRef.current.velocity]);

    // Game loop
    useEffect(() => {
        let lastTime = 0;
        const gameLoop = (currentTime: number) => {
            if (lastTime === 0) {
                lastTime = currentTime;
            }

            updateGame();
            draw();

            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [updateGame, draw]);

    // Event listeners
    useEffect(() => {
        const handleClick = () => jump();
        const handleSpace = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleSpace);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleSpace);
        };
    }, [jump]);

    // Khởi tạo game khi component mount
    useEffect(() => {
        initGame();
    }, [initGame]);

    return (
        <div className="min-h-screen bg-linear-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
            <div className="bg-[#111] shadow-2xl">
                <div className="flex justify-center mb-4">
                    <canvas
                        ref={canvasRef}
                        width={GAME_WIDTH}
                        height={GAME_HEIGHT}
                        className="shadow-lg cursor-pointer"
                        style={{ display: 'block', margin: '0 auto' }}
                    />
                </div>

                <div className="text-white text-sm p-5 bg-emerald-700 flex gap-3 justify-center font-semibold">
                    <span>CLICK / SPACE {gameOver ? "ĐỂ CHƠI LẠI" : "ĐỂ NHẢY"}</span>
                </div>
            </div>
        </div>
    );
}