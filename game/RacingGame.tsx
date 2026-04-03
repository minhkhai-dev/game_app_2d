// app/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 900;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const ENEMY_WIDTH = 10;
const ENEMY_HEIGHT = 50;

enum ItemType {
  DIEM = 'diem',           
  CHAM = 'cham',
  BAT_TU = 'battu',        
  HOI_MANG = 'hoimang',    
  XUYEN_XE = 'xuyenxe',    
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Item {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ItemType;
  symbol: string;
  color: string;
  ten: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function RacingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [diemSo, setDiemSo] = useState(0);
  const [diemCaoNhat, setDiemCaoNhat] = useState(0);
  const [mangSong, setMangSong] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [daBatDau, setDaBatDau] = useState(false);
  const [amThanhBat, setAmThanhBat] = useState(true);
  const [capDo, setCapDo] = useState(1);

  const requestRef = useRef<number | undefined>(undefined);
  const viTriXeNguoiChoi = useRef(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);
  const danhSachDichRef = useRef<Enemy[]>([]);
  const danhSachVatPhamRef = useRef<Item[]>([]);
  const danhSachHatRef = useRef<Particle[]>([]);
  const demFrameRef = useRef(0);
  const tocDoCoBanRef = useRef(3);
  const thoiGianBattuRef = useRef(0);     
  const thoiGianXuyenXeRef = useRef(0);    
  const thoiGianChamRef = useRef(0);
  const phimRef = useRef<{ [key: string]: boolean }>({});
  const demVatPhamRef = useRef(0);

  // Phát âm thanh
  const phatAmThanh = useCallback((loai: 'va cham' | 'nhat duoc' | 'len cap' | 'xuyen xe') => {
    if (!amThanhBat) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let tanSo = 440;
    let thoiLuong = 0.2;

    switch (loai) {
      case 'va cham':
        tanSo = 220;
        thoiLuong = 0.3;
        break;
      case 'nhat duoc':
        tanSo = 880;
        thoiLuong = 0.1;
        break;
      case 'len cap':
        tanSo = 660;
        thoiLuong = 0.5;
        break;
      case 'xuyen xe':
        tanSo = 1200;
        thoiLuong = 0.15;
        break;
    }

    oscillator.frequency.value = tanSo;
    gainNode.gain.value = 0.1;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + thoiLuong);
    oscillator.stop(audioContext.currentTime + thoiLuong);
  }, [amThanhBat]);

  useEffect(() => {
    const daLuu = localStorage.getItem('diemCaoNhatDuaXe');
    if (daLuu) setDiemCaoNhat(parseInt(daLuu));
  }, []);

  useEffect(() => {
    if (diemSo > diemCaoNhat) {
      setDiemCaoNhat(diemSo);
      localStorage.setItem('diemCaoNhatDuaXe', diemSo.toString());
    }
  }, [diemSo, diemCaoNhat]);

  // Thêm hiệu ứng hạt
  const themHat = useCallback((x: number, y: number, mau: string, soLuong: number = 8) => {
    for (let i = 0; i < soLuong; i++) {
      danhSachHatRef.current.push({
        x: x + Math.random() * 40,
        y: y + Math.random() * 60,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        color: mau,
      });
    }
  }, []);

  // Kiểm tra vị trí có bị trùng với xe địch không
  const kiemTraVaChamVoiDich = useCallback((x: number, y: number, rong: number, cao: number) => {
    for (const dich of danhSachDichRef.current) {
      if (
        x < dich.x + dich.width &&
        x + rong > dich.x &&
        y < dich.y + dich.height &&
        y + cao > dich.y
      ) {
        return true;
      }
    }
    return false;
  }, []);

  // Sinh xe địch
  const sinhDich = useCallback(() => {
    const maxX = CANVAS_WIDTH - ENEMY_WIDTH;
    const x = Math.random() * maxX;

    danhSachDichRef.current.push({
      x: x,
      y: -ENEMY_HEIGHT,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      speed: tocDoCoBanRef.current,
    });
  }, []);

  // Sinh vật phẩm (với item xuyên xe siêu hiếm)
  const sinhVatPham = useCallback(() => {
    // Mỗi 1.5 giây mới có cơ hội sinh item
    demVatPhamRef.current++;
    if (demVatPhamRef.current < 90) return;
    demVatPhamRef.current = 0;

    // Tỉ lệ xuất hiện 70%
    if (Math.random() > 0.7) return;

    // Các loại item với tỉ lệ xuất hiện
    const cacLoai = [ItemType.DIEM, ItemType.CHAM, ItemType.BAT_TU, ItemType.HOI_MANG, ItemType.XUYEN_XE];
    const tyTrong = [0.45, 0.25, 0.10, 0.10, 0.05]; // Xuyên xe chỉ 6% (siêu hiếm)
    let ngauNhien = Math.random();
    let loai = ItemType.DIEM;
    let tong = 0;

    for (let i = 0; i < cacLoai.length; i++) {
      tong += tyTrong[i];
      if (ngauNhien < tong) {
        loai = cacLoai[i];
        break;
      }
    }

    let mau = '#f1c40f';
    let kyHieu = '+';
    let ten = '';
    switch (loai) {
      case ItemType.DIEM:
        mau = '#2ecc71';
        kyHieu = '⭐';
        ten = 'Thêm điểm';
        break;
      case ItemType.CHAM:
        mau = '#3498db';
        kyHieu = '🐢';
        ten = 'Làm chậm';
        break;
      case ItemType.BAT_TU:
        mau = '#e67e22';
        kyHieu = '🛡️';
        ten = 'Bất tử';
        break;
      case ItemType.HOI_MANG:
        mau = '#e74c3c';
        kyHieu = '❤️';
        ten = 'Hồi máu';
        break;
      case ItemType.XUYEN_XE:
        mau = '#9b59b6';
        kyHieu = '⚡';
        ten = 'Xuyên xe';
        break;
    }

    // Tìm vị trí không trùng với xe địch
    let x = Math.random() * (CANVAS_WIDTH - 30);
    let toaDoHopLe = false;
    let soLanThu = 0;

    while (!toaDoHopLe && soLanThu < 10) {
      x = Math.random() * (CANVAS_WIDTH - 30);
      if (!kiemTraVaChamVoiDich(x, -30, 30, 30)) {
        toaDoHopLe = true;
      }
      soLanThu++;
    }

    danhSachVatPhamRef.current.push({
      x: x,
      y: -30,
      width: 30,
      height: 30,
      type: loai,
      symbol: kyHieu,
      color: mau,
      ten: ten,
    });
  }, [kiemTraVaChamVoiDich]);

  // Bắt đầu game mới
  const batDauGameMoi = useCallback(() => {
    viTriXeNguoiChoi.current = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    danhSachDichRef.current = [];
    danhSachVatPhamRef.current = [];
    danhSachHatRef.current = [];
    demFrameRef.current = 0;
    demVatPhamRef.current = 0;
    tocDoCoBanRef.current = 3;
    thoiGianBattuRef.current = 0;
    thoiGianXuyenXeRef.current = 0;
    thoiGianChamRef.current = 0;
    setDiemSo(0);
    setMangSong(3);
    setCapDo(1);
    setGameOver(false);
    setDaBatDau(true);
  }, []);

  // Cập nhật game
  const capNhatGame = useCallback(() => {
    if (gameOver || !daBatDau) return;

    // Di chuyển xe người chơi
    const tocDoDiChuyen = 10;
    if (phimRef.current['ArrowLeft'] && viTriXeNguoiChoi.current > 0) {
      viTriXeNguoiChoi.current -= tocDoDiChuyen;
    }
    if (phimRef.current['ArrowRight'] && viTriXeNguoiChoi.current < CANVAS_WIDTH - PLAYER_WIDTH) {
      viTriXeNguoiChoi.current += tocDoDiChuyen;
    }

    // Cập nhật timer
    if (thoiGianChamRef.current > 0) {
      thoiGianChamRef.current--;
    }
    if (thoiGianBattuRef.current > 0) {
      thoiGianBattuRef.current--;
    }
    if (thoiGianXuyenXeRef.current > 0) {
      thoiGianXuyenXeRef.current--;
    }

    // Tốc độ địch (có làm chậm)
    const heSoTocDo = thoiGianChamRef.current > 0 ? 0.5 : 1;

    // Di chuyển địch
    for (let i = 0; i < danhSachDichRef.current.length; i++) {
      danhSachDichRef.current[i].y += danhSachDichRef.current[i].speed * heSoTocDo;
    }

    // Di chuyển vật phẩm
    for (let i = 0; i < danhSachVatPhamRef.current.length; i++) {
      danhSachVatPhamRef.current[i].y += 2.5;
    }

    // Di chuyển hạt
    for (let i = 0; i < danhSachHatRef.current.length; i++) {
      danhSachHatRef.current[i].x += danhSachHatRef.current[i].vx;
      danhSachHatRef.current[i].y += danhSachHatRef.current[i].vy;
      danhSachHatRef.current[i].life -= 0.02;
      danhSachHatRef.current[i].vy += 0.2;
    }
    danhSachHatRef.current = danhSachHatRef.current.filter(h => h.life > 0);

    // Xóa địch ra khỏi màn hình và cộng điểm
    danhSachDichRef.current = danhSachDichRef.current.filter((dich) => {
      if (dich.y > CANVAS_HEIGHT) {
        setDiemSo(prev => prev + 10);
        return false;
      }
      return true;
    });

    // Xóa vật phẩm ra khỏi màn hình
    danhSachVatPhamRef.current = danhSachVatPhamRef.current.filter(vp => vp.y < CANVAS_HEIGHT);

    // Sinh địch
    demFrameRef.current++;
    if (demFrameRef.current % 40 === 0) {
      sinhDich();
    }

    // Sinh vật phẩm
    sinhVatPham();

    // Tăng độ khó
    if (demFrameRef.current % 600 === 0 && tocDoCoBanRef.current < 8) {
      tocDoCoBanRef.current += 0.3;
      setCapDo(prev => prev + 1);
      phatAmThanh('len cap');
    }

    // Khung va chạm của người chơi
    const khungNguoiChoi = {
      x: viTriXeNguoiChoi.current,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };

    // Va chạm với vật phẩm
    for (let i = 0; i < danhSachVatPhamRef.current.length; i++) {
      const vatPham = danhSachVatPhamRef.current[i];
      if (
        khungNguoiChoi.x < vatPham.x + vatPham.width &&
        khungNguoiChoi.x + khungNguoiChoi.width > vatPham.x &&
        khungNguoiChoi.y < vatPham.y + vatPham.height &&
        khungNguoiChoi.y + khungNguoiChoi.height > vatPham.y
      ) {
        phatAmThanh('nhat duoc');
        themHat(vatPham.x, vatPham.y, vatPham.color, 12);

        switch (vatPham.type) {
          case ItemType.DIEM:
            setDiemSo(prev => prev + 50);
            break;
          case ItemType.CHAM:
            thoiGianChamRef.current = 300;
            break;
          case ItemType.BAT_TU:
            thoiGianBattuRef.current = 600;
            break;
          case ItemType.HOI_MANG:
            if (mangSong < 5) {
              setMangSong(prev => prev + 1);
              themHat(vatPham.x, vatPham.y, '#ff69b4', 15);
            }
            break;
          case ItemType.XUYEN_XE:
            thoiGianXuyenXeRef.current = 600; // 10 giây xuyên xe
            phatAmThanh('xuyen xe');
            themHat(vatPham.x, vatPham.y, '#9b59b6', 20);
            break;
        }
        danhSachVatPhamRef.current.splice(i, 1);
        i--;
      }
    }

    // Va chạm với địch (xử lý đặc biệt cho xuyên xe)
    const dangXuyenXe = thoiGianXuyenXeRef.current > 0;
    const dangBattu = thoiGianBattuRef.current > 0;

    if (!dangXuyenXe) { // Nếu đang xuyên xe thì bỏ qua va chạm hoàn toàn
      for (let i = 0; i < danhSachDichRef.current.length; i++) {
        const dich = danhSachDichRef.current[i];
        if (
          khungNguoiChoi.x < dich.x + dich.width &&
          khungNguoiChoi.x + khungNguoiChoi.width > dich.x &&
          khungNguoiChoi.y < dich.y + dich.height &&
          khungNguoiChoi.y + khungNguoiChoi.height > dich.y
        ) {
          // Nếu đang bất tử thì không mất mạng nhưng vẫn có hiệu ứng
          if (dangBattu) {
            themHat(khungNguoiChoi.x, khungNguoiChoi.y, '#ffff00', 10);
            danhSachDichRef.current.splice(i, 1);
            i--;
          } else {
            phatAmThanh('va cham');
            themHat(khungNguoiChoi.x, khungNguoiChoi.y, '#ff0000', 15);
            setMangSong(prev => prev - 1);
            danhSachDichRef.current.splice(i, 1);

            if (mangSong <= 1) {
              setGameOver(true);
              setDaBatDau(false);
            }
            thoiGianBattuRef.current = 120; // 2 giây bất tử sau khi mất mạng
            viTriXeNguoiChoi.current = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
            break;
          }
        }
      }
    } else {
      // Khi đang xuyên xe, vẽ hiệu ứng đặc biệt (không xử lý va chạm)
      // Nhưng vẫn có thể tạo hiệu ứng hào quang
      for (let i = 0; i < danhSachDichRef.current.length; i++) {
        const dich = danhSachDichRef.current[i];
        if (
          khungNguoiChoi.x < dich.x + dich.width &&
          khungNguoiChoi.x + khungNguoiChoi.width > dich.x &&
          khungNguoiChoi.y < dich.y + dich.height &&
          khungNguoiChoi.y + khungNguoiChoi.height > dich.y
        ) {
          // Tạo hiệu ứng đẹp khi xuyên qua xe
          themHat(dich.x + dich.width / 2, dich.y + dich.height / 2, '#9b59b6', 5);
          danhSachDichRef.current.splice(i, 1);
          i--;
        }
      }
    }
  }, [gameOver, daBatDau, sinhDich, sinhVatPham, themHat, phatAmThanh, mangSong]);

  // Vẽ game
  const veGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nền đường
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Hiệu ứng hào quang khi xuyên xe
    if (thoiGianXuyenXeRef.current > 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#c4020270';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Kẻ làn đường
    ctx.strokeStyle = '#ffffff80';
    ctx.lineWidth = 3;
    ctx.setLineDash([40, 30]);

    const spacing = 150;

    for (let x = 150; x <= CANVAS_WIDTH; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Vẽ hiệu ứng hạt
    for (const h of danhSachHatRef.current) {
      ctx.globalAlpha = h.life;
      ctx.fillStyle = h.color;
      ctx.fillRect(h.x, h.y, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Vẽ vật phẩm
    for (const vp of danhSachVatPhamRef.current) {
      ctx.fillStyle = vp.color;
      ctx.fillRect(vp.x, vp.y, vp.width, vp.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px';
      ctx.fillText(vp.symbol, vp.x + 5, vp.y + 25);

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(vp.x, vp.y, vp.width, vp.height);
    }

    // Vẽ xe địch
    for (const dich of danhSachDichRef.current) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(dich.x, dich.y, dich.width, dich.height);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(dich.x + 5, dich.y + 5, 8, 15);
      ctx.fillRect(dich.x + dich.width - 13, dich.y + 5, 8, 15);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dich.x + 8, dich.y + 20, 6, 6);
      ctx.fillRect(dich.x + dich.width - 14, dich.y + 20, 6, 6);

      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      ctx.strokeRect(dich.x, dich.y, dich.width, dich.height);
    }

    // Vẽ xe người chơi với hiệu ứng đặc biệt
    if (thoiGianXuyenXeRef.current > 0) {
      // Hiệu ứng tím cho xuyên xe
      ctx.fillStyle = '#9b59b6';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#9b59b6';
    } else if (thoiGianBattuRef.current > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.fillStyle = '#ffff00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffff00';
    } else {
      ctx.fillStyle = '#3498db';
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(viTriXeNguoiChoi.current, CANVAS_HEIGHT - PLAYER_HEIGHT - 10, PLAYER_WIDTH, PLAYER_HEIGHT);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(viTriXeNguoiChoi.current + 5, CANVAS_HEIGHT - PLAYER_HEIGHT - 5, 8, 15);
    ctx.fillRect(viTriXeNguoiChoi.current + PLAYER_WIDTH - 13, CANVAS_HEIGHT - PLAYER_HEIGHT - 5, 8, 15);

    ctx.fillStyle = '#aaddff';
    ctx.fillRect(viTriXeNguoiChoi.current + 10, CANVAS_HEIGHT - PLAYER_HEIGHT - 25, 8, 12);
    ctx.fillRect(viTriXeNguoiChoi.current + PLAYER_WIDTH - 18, CANVAS_HEIGHT - PLAYER_HEIGHT - 25, 8, 12);

    ctx.shadowBlur = 0;

    // Hiệu ứng làm chậm
    if (thoiGianChamRef.current > 0) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#3498db';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Hiển thị thông tin
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Điểm: ${diemSo}`, 15, 35);
    ctx.fillText(`Cao nhất: ${diemCaoNhat}`, 15, 60);
    ctx.fillText(`Mạng: ${'❤️'.repeat(mangSong)}${'🖤'.repeat(5 - mangSong)}`, 15, 85);
    ctx.fillText(`Cấp độ: ${capDo}`, 15, 110);

    if (thoiGianChamRef.current > 0) {
      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`LÀM CHẬM ${Math.ceil(thoiGianChamRef.current / 60)}s`, CANVAS_WIDTH - 130, 35);
    }
    if (thoiGianBattuRef.current > 0) {
      ctx.fillStyle = '#e67e22';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`BẤT TỬ ${Math.ceil(thoiGianBattuRef.current / 60)}s`, CANVAS_WIDTH - 120, 60);
    }
    if (thoiGianXuyenXeRef.current > 0) {
      ctx.fillStyle = '#9b59b6';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`XUYÊN XE ${Math.ceil(thoiGianXuyenXeRef.current / 60)}s`, CANVAS_WIDTH - 130, 85);
    }

    if (gameOver) {
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = '#ffff00';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'black';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2 - 110, CANVAS_HEIGHT / 2);
      ctx.font = '20px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Nhấn R để chơi lại', CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 + 50);
      ctx.shadowBlur = 0;
    } else if (!daBatDau) {
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('TRÁNH XE ĐỊCH + ĐIỂM', CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT * 0.4);
    }
  }, [diemSo, diemCaoNhat, mangSong, gameOver, daBatDau, capDo, thoiGianBattuRef, thoiGianChamRef, thoiGianXuyenXeRef]);

  // Vòng lặp game
  const vongLapGame = useCallback(() => {
    capNhatGame();
    veGame();
    requestRef.current = requestAnimationFrame(vongLapGame);
  }, [capNhatGame, veGame]);

  // Xử lý sự kiện bàn phím
  useEffect(() => {
    const xuLyPhimXuong = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        phimRef.current[e.key] = true;
      }
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (!daBatDau && !gameOver) {
          batDauGameMoi();
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        batDauGameMoi();
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setAmThanhBat(prev => !prev);
      }
    };

    const xuLyPhimLen = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        phimRef.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', xuLyPhimXuong);
    window.addEventListener('keyup', xuLyPhimLen);
    return () => {
      window.removeEventListener('keydown', xuLyPhimXuong);
      window.removeEventListener('keyup', xuLyPhimLen);
    };
  }, [daBatDau, gameOver, batDauGameMoi]);

  // Khởi động game loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(vongLapGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [vongLapGame]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      alignItems: 'center',
      minHeight: '100vh',
      paddingBottom: '20px'
    }}>
      <div className='flex items-center justify-center flex-col gap-3'>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            borderBottom: '1px solid white',
          }}
        />
        <div className='mt-4 bg-black/30 p-3 font-semibold text-white'>
          <p className='text-center mb-4'>🎮 ← → : Di chuyển || SPACE: Bắt đầu || R: Chơi lại || S: Âm thanh</p>
          <div className='flex gap-4 justify-center mt-2 flex-wrap' >
            <span>⭐ +50 điểm</span>
            <span>🐢 Làm chậm 5s</span>
            <span>🛡️ Bất tử 10s</span> 
            <span>❤️ +1 mạng</span>
            <span className='text-red-500'>⚡ Xuyên xe 10s (HIẾM)</span>
          </div>
        </div>
      </div>
    </div>
  );
}