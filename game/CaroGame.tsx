'use client';

import { useState, useCallback, useEffect } from 'react';

// Kích thước bàn cờ
const BOARD_SIZE = 20; // 15x15
const WIN_COUNT = 5; // Cần 5 quân liên tiếp để thắng

// Kiểu dữ liệu cho ô cờ
type Cell = 'X' | 'O' | null;
type Winner = Cell | 'draw'; // Thêm kiểu 'draw' cho winner
type GameMode = 'twoPlayer' | 'vsAI';
type Difficulty = 'easy' | 'medium' | 'hard';

export default function CaroGame() {
  const [board, setBoard] = useState<Cell[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('twoPlayer');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [xScore, setXScore] = useState<number>(0);
  const [oScore, setOScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Kiểm tra chiến thắng
  const checkWinner = useCallback((newBoard: Cell[], lastMove: number): { winner: Winner; line: number[] | null } => {
    if (lastMove === -1) return { winner: null, line: null };

    const row = Math.floor(lastMove / BOARD_SIZE);
    const col = lastMove % BOARD_SIZE;
    const currentPlayer = newBoard[lastMove];

    if (!currentPlayer) return { winner: null, line: null };

    // Các hướng cần kiểm tra: ngang, dọc, chéo chính, chéo phụ
    const directions = [
      { dr: 0, dc: 1 },  // Ngang phải
      { dr: 1, dc: 0 },  // Dọc xuống
      { dr: 1, dc: 1 },  // Chéo xuống phải
      { dr: 1, dc: -1 }, // Chéo xuống trái
    ];

    for (const dir of directions) {
      let count = 1;
      const line: number[] = [lastMove];

      // Hướng tích cực
      for (let step = 1; step <= 4; step++) {
        const newRow = row + dir.dr * step;
        const newCol = col + dir.dc * step;
        const newPos = newRow * BOARD_SIZE + newCol;

        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
        if (newBoard[newPos] === currentPlayer) {
          count++;
          line.push(newPos);
        } else break;
      }

      // Hướng tiêu cực
      for (let step = 1; step <= 4; step++) {
        const newRow = row - dir.dr * step;
        const newCol = col - dir.dc * step;
        const newPos = newRow * BOARD_SIZE + newCol;

        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
        if (newBoard[newPos] === currentPlayer) {
          count++;
          line.push(newPos);
        } else break;
      }

      if (count >= WIN_COUNT) {
        return { winner: currentPlayer, line: line.slice(0, WIN_COUNT) };
      }
    }

    // Kiểm tra hòa
    const isDraw = newBoard.every(cell => cell !== null);
    if (isDraw) return { winner: 'draw', line: null };

    return { winner: null, line: null };
  }, []);

  // AI đánh giá điểm cho một ô
  const evaluatePosition = useCallback((board: Cell[], row: number, col: number, player: Cell): number => {
    if (board[row * BOARD_SIZE + col] !== null) return 0;

    let totalScore = 0;
    const directions = [
      { dr: 0, dc: 1 },  // Ngang
      { dr: 1, dc: 0 },  // Dọc
      { dr: 1, dc: 1 },  // Chéo chính
      { dr: 1, dc: -1 }, // Chéo phụ
    ];

    for (const dir of directions) {
      let count = 1;
      let openLeft = 0;
      let openRight = 0;

      // Hướng tích cực
      for (let step = 1; step <= 4; step++) {
        const newRow = row + dir.dr * step;
        const newCol = col + dir.dc * step;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
          openRight++;
          break;
        }
        const pos = newRow * BOARD_SIZE + newCol;
        if (board[pos] === player) count++;
        else if (board[pos] === null) {
          openRight++;
          break;
        } else break;
      }

      // Hướng tiêu cực
      for (let step = 1; step <= 4; step++) {
        const newRow = row - dir.dr * step;
        const newCol = col - dir.dc * step;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
          openLeft++;
          break;
        }
        const pos = newRow * BOARD_SIZE + newCol;
        if (board[pos] === player) count++;
        else if (board[pos] === null) {
          openLeft++;
          break;
        } else break;
      }

      // Tính điểm dựa trên số lượng quân liên tiếp
      if (count >= 5) totalScore += 100000;
      else if (count === 4) {
        if (openLeft + openRight >= 1) totalScore += 10000;
        else totalScore += 1000;
      } else if (count === 3) {
        if (openLeft + openRight >= 2) totalScore += 1000;
        else if (openLeft + openRight === 1) totalScore += 100;
        else totalScore += 10;
      } else if (count === 2) {
        if (openLeft + openRight >= 2) totalScore += 10;
        else if (openLeft + openRight === 1) totalScore += 5;
      } else if (count === 1) totalScore += 1;
    }

    return totalScore;
  }, []);

  // AI chọn nước đi tốt nhất
  const getAIMove = useCallback((currentBoard: Cell[]): number => {
    let bestScore = -1;
    let bestMove = -1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const pos = i * BOARD_SIZE + j;
        if (currentBoard[pos] === null) {
          let score = 0;

          if (difficulty === 'easy') {
            // Easy: đánh giá đơn giản
            score = Math.random() * 100;
          } else if (difficulty === 'medium') {
            // Medium: kết hợp ngẫu nhiên và đánh giá
            score = evaluatePosition(currentBoard, i, j, 'O') + Math.random() * 20;
          } else {
            // Hard: đánh giá tấn công và phòng thủ
            const attackScore = evaluatePosition(currentBoard, i, j, 'O');
            const defendScore = evaluatePosition(currentBoard, i, j, 'X');
            score = attackScore * 0.7 + defendScore * 0.3;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMove = pos;
          }
        }
      }
    }

    return bestMove;
  }, [difficulty, evaluatePosition]);

  // Xử lý khi người chơi đánh
  const handleMove = useCallback((index: number) => {
    if (winner || board[index] !== null) return;
    if (gameMode === 'vsAI' && !isXNext) return;

    const currentPlayer = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const { winner: newWinner, line } = checkWinner(newBoard, index);

    setBoard(newBoard);
    setIsXNext(!isXNext);

    if (newWinner) {
      setWinner(newWinner);
      setWinningLine(line);
      if (newWinner === 'X') setXScore(prev => prev + 1);
      else if (newWinner === 'O') setOScore(prev => prev + 1);
    }
  }, [board, winner, isXNext, gameMode, checkWinner]);

  // AI đánh
  useEffect(() => {
    if (gameMode === 'vsAI' && !isXNext && !winner && gameStarted) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board);
        if (aiMove !== -1) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          const { winner: newWinner, line } = checkWinner(newBoard, aiMove);

          setBoard(newBoard);
          setIsXNext(true);

          if (newWinner) {
            setWinner(newWinner);
            setWinningLine(line);
            if (newWinner === 'O') setOScore(prev => prev + 1);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, winner, board, getAIMove, gameStarted, checkWinner]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setGameStarted(true);
  }, []);

  // Bắt đầu game mới
  const startNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Đổi chế độ chơi
  const changeGameMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  }, [resetGame]);

  // Vẽ bàn cờ
  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);

    return (
      <button
        key={index}
        onClick={() => handleMove(index)}
        className={`
          w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center
          text-xl sm:text-2xl font-bold transition-all duration-200 cursor-pointer
          ${value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-red-600' : 'hover:bg-gray-100'}
          ${isWinningCell ? 'bg-yellow-200 animate-pulse' : 'bg-white'}
          ${!value && !winner && gameStarted ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        {value}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ĐÁNH CỜ CARO
          </h1>
        </div>

        {/* Score Board */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">X</div>
            <div className="text-3xl font-semibold">{xScore}</div>
            <div className="text-sm text-gray-600 uppercase">BẠN</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-3 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-600">O</div>
            <div className="text-3xl font-semibold">{oScore}</div>
            <div className="text-sm text-gray-600 uppercase">
              {gameMode === 'twoPlayer' ? 'ĐỐI THỦ' : 'MÁY'}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <select
            value={gameMode}
            onChange={(e) => changeGameMode(e.target.value as GameMode)}
            className="px-4 py-2 border border-[#111] text-sm rounded-sm focus:outline-none focus:border-blue-300 bg-blue-50"
          >
            <option value="twoPlayer">2 NGƯỜI CHƠI</option>
            <option value="vsAI">ĐẤU MÁY</option>
          </select>

          {gameMode === 'vsAI' && (
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="px-4 py-2 border border-[#111] text-sm rounded-sm focus:outline-none focus:border-blue-300 bg-blue-50"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          )}

          <button
            onClick={startNewGame}
            className="px-6 py-2 bg-emerald-500 text-white rounded-sm cursor-pointer hover:bg-emerald-600 transition-all"
          >
            Chơi mới
          </button>

          <button
            onClick={() => {
              setXScore(0);
              setOScore(0);
              resetGame();
            }}
            className="px-6 py-2 bg-red-500 text-white rounded-sm cursor-pointer hover:bg-red-600 transition-all"
          >
            Reset điểm
          </button>
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6 overflow-x-auto">
          <div className="inline-block border-2 border-gray-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-20">
              {Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, index) => renderCell(index))}
            </div>
          </div>
        </div>

        {/* Game Status */}
        {winner && (
          <div className="text-center mb-4">
            <div className={`
              inline-block px-6 py-3 rounded-lg text-lg
              ${winner === 'X' ? 'bg-blue-500 text-white' :
                winner === 'O' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'}
            `}>
              {winner === 'X' ? 'BẠN (X) ĐÃ CHIẾN THẮNG !!' :
                winner === 'O' ? 'ĐỐI THỬ (0) ĐÃ CHIẾN THẮNG !!' :
                  'HÒA NHAU !!'}
            </div>
          </div>
        )}

        {/* Turn Indicator */}
        {!winner && gameStarted && (
          <div className="text-center">
            <div className={`
              inline-block px-6 py-2 rounded-lg font text-lg
              ${isXNext ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
            `}>
              {gameMode === 'twoPlayer' ? (
                <>LƯỢT: {isXNext ? 'CỦA BẠN X' : 'ĐỐI THỦ O'}</>
              ) : (
                <>LƯỢT: {isXNext ? 'CỦA BẠN (X)' : 'MÁY (O)'}</>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Hướng dẫn:</h3>
          <ul className="text-sm text-gray-600 flex flex-col gap-2">
            <li className='list-decimal ml-5'>Nhấn vào ô trống để đặt quân cờ</li>
            <li className='list-decimal ml-5'>X đánh trước, O đánh sau</li>
            <li className='list-decimal ml-5'>Người đầu tiên tạo được 5 quân liên tiếp (ngang, dọc, chéo) sẽ thắng</li>
            {gameMode === 'vsAI' && (
              <li>• Ở chế độ VS Máy, bạn là X, máy là O</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}