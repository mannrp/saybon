import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { VocabWord, WordProgress } from '../../types';

interface StarConstellationProps {
  words: VocabWord[];
  progress: Map<string, WordProgress>;
  onWordClick: (word: VocabWord) => void;
  resolvedTheme: 'light' | 'dark';
}

interface Star {
  word: VocabWord;
  xPercent: number; // static position percentage (0-100)
  yPercent: number; // static position percentage (0-100)
  clusterName: string;
  clusterColor: string;
  masteryLevel: number;
}

interface StarConnection {
  from: Star;
  to: Star;
}

// Simple deterministic hash for stable placement
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function StarConstellation({
  words,
  progress,
  onWordClick,
  resolvedTheme,
}: StarConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [pulsePhase, setPulsePhase] = useState(0);

  // Generate stable stars based on word list
  const stars = useMemo<Star[]>(() => {
    return words.map((word) => {
      const hash = hashString(word.id);
      const progressEntry = progress.get(word.id);
      const mastery = progressEntry && progressEntry.attempts > 0 ? progressEntry.masteryLevel : 0;

      // Group words into elegant celestial clusters by part of speech
      let xMin = 10, xMax = 45, yMin = 10, yMax = 45;
      let clusterName = "L'Amas des Noms (Nouns)";
      let clusterColor = resolvedTheme === 'dark' ? '#818cf8' : '#4f46e5'; // Indigo

      if (word.partOfSpeech === 'verb') {
        xMin = 55; xMax = 90; yMin = 10; yMax = 45;
        clusterName = "Le Fleuve des Verbes (Verbs)";
        clusterColor = resolvedTheme === 'dark' ? '#34d399' : '#059669'; // Emerald
      } else if (word.partOfSpeech === 'adjective' || word.partOfSpeech === 'adverb') {
        xMin = 10; xMax = 45; yMin = 55; yMax = 90;
        clusterName = "La Nébuleuse des Qualificatifs (Adjectives/Adverbs)";
        clusterColor = resolvedTheme === 'dark' ? '#fbbf24' : '#d97706'; // Amber
      } else {
        xMin = 55; xMax = 90; yMin = 55; yMax = 90;
        clusterName = "Le Nuage Morphologique (Grammar & Expressions)";
        clusterColor = resolvedTheme === 'dark' ? '#f472b6' : '#db2777'; // Pink
      }

      const rangeX = xMax - xMin;
      const rangeY = yMax - yMin;

      // Generate stable coordinates using hash
      const xPercent = xMin + (hash % 100) / 100 * rangeX;
      const yPercent = yMin + (Math.floor(hash / 100) % 100) / 100 * rangeY;

      return {
        word,
        xPercent,
        yPercent,
        clusterName,
        clusterColor,
        masteryLevel: mastery,
      };
    });
  }, [words, progress, resolvedTheme]);

  // Compute connections (constellation edges) within each cluster
  const connections = useMemo<StarConnection[]>(() => {
    const list: StarConnection[] = [];
    const clusters: { [key: string]: Star[] } = {};

    stars.forEach((star) => {
      if (!clusters[star.clusterName]) {
        clusters[star.clusterName] = [];
      }
      clusters[star.clusterName].push(star);
    });

    // Connect each star to its 1-2 nearest neighbors in the same cluster
    Object.keys(clusters).forEach((key) => {
      const clusterStars = clusters[key];
      
      clusterStars.forEach((starA, i) => {
        // Calculate distances to all other stars in cluster
        const dists = clusterStars
          .map((starB, idx) => {
            if (i === idx) return { star: starB, dist: Infinity };
            const dx = starA.xPercent - starB.xPercent;
            const dy = starA.yPercent - starB.yPercent;
            return { star: starB, dist: Math.sqrt(dx * dx + dy * dy) };
          })
          .filter((d) => d.dist < Infinity)
          .sort((a, b) => a.dist - b.dist);

        // Connect to nearest 2 neighbors (avoid duplicating connections)
        const connectCount = Math.min(2, dists.length);
        for (let c = 0; c < connectCount; c++) {
          const target = dists[c].star;
          // Connect if index i is smaller than target index to avoid double lines
          const targetIdx = clusterStars.indexOf(target);
          if (i < targetIdx) {
            list.push({ from: starA, to: target });
          }
        }
      });
    });

    return list;
  }, [stars]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(500, window.innerHeight * 0.6),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation Loop for Pulsing Glows
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setPulsePhase((prev) => (prev + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Draw Function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const isDark = resolvedTheme === 'dark';

    // 1. Draw Nebula Background (radial color washes)
    if (isDark) {
      // Cosmic Indigo-Charcoal
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      bgGrad.addColorStop(0, '#0c0a09'); // rich stone black
      bgGrad.addColorStop(1, '#09090b'); // zinc midnight
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Faint ambient purple washes
      ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
      ctx.beginPath();
      ctx.arc(width * 0.3, height * 0.35, width * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Faint green/emerald wash
      ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
      ctx.beginPath();
      ctx.arc(width * 0.7, height * 0.4, width * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Soft Warm Parchment
      ctx.fillStyle = '#fafaf9'; // warm ivory
      ctx.fillRect(0, 0, width, height);

      // Extremely faint elegant slate washes
      ctx.fillStyle = 'rgba(99, 102, 241, 0.02)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, width * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Constellation Interconnecting Lines (Edges)
    ctx.lineWidth = isDark ? 0.8 : 0.6;
    connections.forEach((conn) => {
      const fromX = (conn.from.xPercent / 100) * width;
      const fromY = (conn.from.yPercent / 100) * height;
      const toX = (conn.to.xPercent / 100) * width;
      const toY = (conn.to.yPercent / 100) * height;

      // Opacity depends on mastery of the two nodes
      const avgMastery = (conn.from.masteryLevel + conn.to.masteryLevel) / 2;
      const baseOpacity = isDark ? 0.05 : 0.07;
      const lineOpacity = baseOpacity + (avgMastery / 5) * (isDark ? 0.15 : 0.12);

      ctx.strokeStyle = isDark
        ? `rgba(229, 231, 235, ${lineOpacity})`
        : `rgba(26, 26, 26, ${lineOpacity})`;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });

    // 3. Draw Stars
    stars.forEach((star) => {
      const x = (star.xPercent / 100) * width;
      const y = (star.yPercent / 100) * height;
      const level = star.masteryLevel;

      // Star sizing
      let radius = 2.0;
      if (level === 0) radius = 1.6;
      else if (level <= 2) radius = 2.4;
      else if (level <= 4) radius = 3.2;
      else radius = 4.5;

      // Color mapping
      let starColor = '';
      let glowColor = '';
      let glowRadius = 0;

      if (isDark) {
        if (level === 0) {
          starColor = 'rgba(148, 163, 184, 0.45)'; // Slate-400
          glowColor = 'rgba(148, 163, 184, 0.1)';
        } else if (level <= 1) {
          starColor = '#f43f5e'; // Rose-500
          glowColor = 'rgba(244, 63, 94, 0.5)';
          glowRadius = 5 + Math.sin(pulsePhase) * 2;
        } else if (level <= 2) {
          starColor = '#f97316'; // Orange-500
          glowColor = 'rgba(249, 115, 22, 0.5)';
          glowRadius = 6 + Math.sin(pulsePhase) * 2.5;
        } else if (level <= 3) {
          starColor = '#eab308'; // Yellow-500
          glowColor = 'rgba(234, 179, 8, 0.55)';
          glowRadius = 8 + Math.sin(pulsePhase) * 3;
        } else if (level <= 4) {
          starColor = '#10b981'; // Emerald-500
          glowColor = 'rgba(16, 185, 129, 0.6)';
          glowRadius = 10 + Math.sin(pulsePhase) * 3.5;
        } else {
          starColor = '#06b6d4'; // Cyan-500 (Mastered)
          glowColor = 'rgba(6, 182, 212, 0.85)';
          glowRadius = 14 + Math.sin(pulsePhase) * 5;
        }
      } else {
        // Light mode (sophisticated pastel and solid ink styling)
        if (level === 0) {
          starColor = 'rgba(120, 113, 108, 0.25)'; // Stone dim
          glowColor = 'transparent';
        } else if (level <= 1) {
          starColor = '#e11d48'; // Rich rose-600
          glowColor = 'rgba(225, 29, 72, 0.15)';
          glowRadius = 4;
        } else if (level <= 2) {
          starColor = '#ea580c'; // Rich orange-600
          glowColor = 'rgba(234, 88, 12, 0.15)';
          glowRadius = 5;
        } else if (level <= 3) {
          starColor = '#d97706'; // Rich amber-600
          glowColor = 'rgba(217, 119, 6, 0.2)';
          glowRadius = 6;
        } else if (level <= 4) {
          starColor = '#059669'; // Rich emerald-600
          glowColor = 'rgba(5, 150, 105, 0.25)';
          glowRadius = 8;
        } else {
          starColor = '#2563eb'; // Royal blue-600 (Mastered)
          glowColor = 'rgba(37, 99, 235, 0.35)';
          glowRadius = 12 + Math.sin(pulsePhase) * 3;
        }
      }

      // Draw Glow Ring
      if (glowRadius > 0) {
        const glowGrad = ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
        glowGrad.addColorStop(0, glowColor);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Core Star
      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer focus glow for hovered star
      if (hoveredStar && hoveredStar.word.id === star.word.id) {
        ctx.strokeStyle = isDark ? '#ffffff' : '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 4. Draw Cluster Names
    stars.reduce<string[]>((acc, star) => {
      if (!acc.includes(star.clusterName)) {
        acc.push(star.clusterName);

        ctx.font = '10px var(--font-family)';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,26,0.35)';
        ctx.textAlign = 'center';
        
        // Put cluster title at a suitable aesthetic center
        let titleX = width * 0.25;
        let titleY = height * 0.05;

        if (star.word.partOfSpeech === 'verb') {
          titleX = width * 0.75;
          titleY = height * 0.05;
        } else if (star.word.partOfSpeech === 'adjective' || star.word.partOfSpeech === 'adverb') {
          titleX = width * 0.25;
          titleY = height * 0.52;
        } else if (star.word.partOfSpeech === 'other' || !star.word.partOfSpeech) {
          titleX = width * 0.75;
          titleY = height * 0.52;
        }

        ctx.fillText(star.clusterName.toUpperCase(), titleX, titleY);
      }
      return acc;
    }, []);

  }, [dimensions, stars, connections, pulsePhase, hoveredStar, resolvedTheme]);

  // Handle Hover Detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { width, height } = dimensions;

      // Find closest star
      let closest: Star | null = null;
      let minDist = 15; // 15px interaction radius

      stars.forEach((star) => {
        const starX = (star.xPercent / 100) * width;
        const starY = (star.yPercent / 100) * height;
        const dx = mouseX - starX;
        const dy = mouseY - starY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          minDist = dist;
          closest = star;
        }
      });

      if (closest !== hoveredStar) {
        setHoveredStar(closest);
      }

      if (closest) {
        // Position tooltip perfectly above the star
        const star = closest as Star;
        const starX = (star.xPercent / 100) * width;
        const starY = (star.yPercent / 100) * height;
        setTooltipPos({ x: starX, y: starY - 12 });
      }
    },
    [dimensions, stars, hoveredStar]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredStar(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (hoveredStar) {
      onWordClick(hoveredStar.word);
    }
  }, [hoveredStar, onWordClick]);

  return (
    <div
      ref={containerRef}
      className="relative border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-inner overflow-hidden select-none bg-[var(--color-bg-secondary)]"
      style={{ minHeight: '500px', cursor: hoveredStar ? 'pointer' : 'default' }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className="block w-full h-full"
      />

      {/* Elegant Hover Tooltip */}
      {hoveredStar && (
        <div
          className="absolute z-20 pointer-events-none p-3 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl flex flex-col gap-1 w-52 text-left"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Subtle pointing notch */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 border-r border-b border-[var(--color-border)] bg-[var(--color-bg-card)] rotate-45" />

          {/* Tooltip Content */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {hoveredStar.word.partOfSpeech || 'concept'}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
              style={{
                backgroundColor: hoveredStar.clusterColor + '15',
                color: hoveredStar.clusterColor,
                border: `1px solid ${hoveredStar.clusterColor}30`,
              }}
            >
              {hoveredStar.word.level}
            </span>
          </div>

          <h5 className="text-lg font-bold text-[var(--color-text-primary)] m-0 leading-tight">
            {hoveredStar.word.french}
          </h5>

          <p className="text-xs text-[var(--color-text-secondary)] m-0 italic line-clamp-1">
            {hoveredStar.word.english}
          </p>

          <div className="border-t border-[var(--color-border)] mt-1.5 pt-1 flex justify-between items-center text-[10px]">
            <span className="text-[var(--color-text-secondary)]">Mastery:</span>
            <span className="font-bold flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    hoveredStar.masteryLevel === 0
                      ? 'var(--color-text-muted)'
                      : hoveredStar.masteryLevel <= 2
                      ? 'var(--color-weak)'
                      : hoveredStar.masteryLevel <= 4
                      ? 'var(--color-good)'
                      : 'var(--color-primary)',
                }}
              />
              {hoveredStar.masteryLevel === 0 ? 'Unseen' : `${hoveredStar.masteryLevel}/5`}
            </span>
          </div>
        </div>
      )}

      {/* Tiny descriptive legend overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between items-center gap-2 pointer-events-none text-[10px] text-[var(--color-text-muted)] tracking-wider uppercase font-semibold">
        <span>Click any star to open its translation card & deep review</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Unseen
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Weak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Learning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" /> Mastered
          </span>
        </div>
      </div>
    </div>
  );
}
