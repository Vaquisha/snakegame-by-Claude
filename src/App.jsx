import { useState, useEffect, useCallback } from "react";
import "./SnakeGame.css";

const GRID_SIZE = 20;
const CELL_SIZE = 28;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIR = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

function randomFood(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [nextDir, setNextDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | playing | dead
  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState([]);

  const spawnParticles = useCallback((x, y) => {
    const p = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      angle: (i / 8) * 360,
      life: 1,
    }));
    setParticles((prev) => [...prev, ...p]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((pp) => !p.find((q) => q.id === pp.id)));
    }, 500);
  }, []);

  const reset = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDir(INITIAL_DIR);
    setNextDir(INITIAL_DIR);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    setStatus("playing");
    setParticles([]);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      setDir(nextDir);
      setSnake((prev) => {
        const head = { x: prev[0].x + nextDir.x, y: prev[0].y + nextDir.y };

        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE ||
          prev.some((s) => s.x === head.x && s.y === head.y)
        ) {
          setStatus("dead");
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
          return prev;
        }

        let newSnake;

        setFood((f) => {
          if (head.x === f.x && head.y === f.y) {
            newSnake = [head, ...prev];
            setScore((sc) => {
              const ns = sc + 10;
              setBest((b) => Math.max(b, ns));
              return ns;
            });
            spawnParticles(f.x, f.y);
            return randomFood([head, ...prev]);
          }

          newSnake = [head, ...prev.slice(0, -1)];
          return f;
        });

        return newSnake || [head, ...prev.slice(0, -1)];
      });
    }, INITIAL_SPEED);

    return () => clearInterval(interval);
  }, [status, nextDir, spawnParticles]);

  useEffect(() => {
    const handleKey = (e) => {
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const newDir = map[e.key];
      if (!newDir) return;

      e.preventDefault();
      setDir((d) => {
        if (newDir.x === -d.x && newDir.y === -d.y) return d;
        setNextDir(newDir);
        return d;
      });

      if (status === "idle" || status === "dead") reset();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, reset]);

  const handleSwipe = (() => {
    let startX = 0,
      startY = 0;

    return {
      onTouchStart: (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      onTouchEnd: (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

        let newDir;
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
          newDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }

        setDir((d) => {
          if (newDir.x === -d.x && newDir.y === -d.y) return d;
          setNextDir(newDir);
          return d;
        });

        if (status === "idle" || status === "dead") reset();
      },
    };
  })();

  const gridPx = GRID_SIZE * CELL_SIZE;

  return (
    <div className="snake-container">
      <div className="snake-header">
        <div className="snake-subtitle">RETRO ARCADE</div>
        <div className="snake-title">SNAKE</div>
      </div>

      <div className="snake-scores">
        {[["SCORE", score], ["BEST", best]].map(([label, val]) => (
          <div key={label} className="score-box">
            <div className="score-label">{label}</div>
            <div className="score-value">{String(val).padStart(4, "0")}</div>
          </div>
        ))}
      </div>

      <div
        className={`snake-grid ${flash ? "snake-grid-flash" : ""}`}
        style={{
          width: gridPx,
          height: gridPx,
        }}
        {...handleSwipe}
      >
        <svg
          className="snake-grid-lines"
          width={gridPx}
          height={gridPx}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <g key={i}>
              <line
                x1={i * CELL_SIZE}
                y1={0}
                x2={i * CELL_SIZE}
                y2={gridPx}
                stroke="#00ff88"
                strokeWidth="0.5"
              />
              <line
                x1={0}
                y1={i * CELL_SIZE}
                x2={gridPx}
                y2={i * CELL_SIZE}
                stroke="#00ff88"
                strokeWidth="0.5"
              />
            </g>
          ))}
        </svg>

        <div
          className="grid-cell-food"
          style={{
            left: food.x * CELL_SIZE + 3,
            top: food.y * CELL_SIZE + 3,
            width: CELL_SIZE - 6,
            height: CELL_SIZE - 6,
          }}
        />

        {snake.map((seg, i) => {
          const isHead = i === 0;
          const t = 1 - i / snake.length;

          return (
            <div
              key={i}
              className={`snake-segment ${isHead ? "snake-head" : ""}`}
              style={{
                left: seg.x * CELL_SIZE + 1,
                top: seg.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: isHead ? 6 : 3,
                background: isHead
                  ? "linear-gradient(135deg, #00ff88, #00cc66)"
                  : `rgba(0, ${Math.round(180 * t + 60)}, ${Math.round(100 * t)}, ${0.5 + t * 0.5})`,
                boxShadow: isHead ? "0 0 12px #00ff8899" : "none",
              }}
            />
          );
        })}

        {particles.map((p) => (
          <div
            key={p.id}
            className="snake-particle"
            style={{
              left: p.x,
              top: p.y,
              transform: `rotate(${p.angle}deg) translateX(20px)`,
            }}
          />
        ))}

        {status !== "playing" && (
          <div className="snake-overlay">
            {status === "dead" && <div className="game-over-text">GAME OVER</div>}

            <div className="overlay-text">
              {status === "idle" ? "PRESIONA CUALQUIER TECLA" : "JUGAR DE NUEVO"}
            </div>

            <button className="btn snake-button" onClick={reset}>
              {status === "idle" ? "▶ INICIAR" : "▶ REINICIAR"}
            </button>
          </div>
        )}
      </div>

      <div className="snake-controls">
        <span>⬆⬇⬅➡ MOVER</span>
        <span>WASD TAMBIÉN</span>
        <span>📱 DESLIZAR</span>
      </div>
    </div>
  );
}