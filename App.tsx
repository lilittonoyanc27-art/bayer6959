import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Trophy, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  User, 
  ArrowRight, 
  GraduationCap,
  Users,
  Clock,
  Info,
  Flame,
  Award
} from "lucide-react";
import { QUESTIONS, CATEGORIES, CATEGORY_COLORS, Question } from "./questions";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export default function App() {
  // Game Configuration & Players
  const [player1Name, setPlayer1Name] = useState("Jugador 1");
  const [player2Name, setPlayer2Name] = useState("Jugador 2");
  const [gameState, setGameState] = useState<"setup" | "playing" | "gameover">("setup");
  const [gameMode, setGameMode] = useState<"all" | "sprint10">("all"); // all (20 questions) or sprint (10 questions)

  // Scores and Turn State
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, { 
    isCorrect: boolean; 
    answeredBy: 1 | 2; 
    selectedIndex: number;
  }>>({});
  
  // Game Streak / Stats
  const [streaks, setStreaks] = useState({ player1: 0, player2: 0, maxPlayer1: 0, maxPlayer2: 0 });

  // Sound settings
  const [isMuted, setIsMuted] = useState(false);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [landedCategory, setLandedCategory] = useState<string | null>(null);

  // Wildcard selection state (when a spun category is fully answered)
  const [isWildcardActive, setIsWildcardActive] = useState(false);

  // Current Question & Answer Interaction
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [hasConfirmedAnswer, setHasConfirmedAnswer] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  // Canvas and Animation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const confettiRequestRef = useRef<number | null>(null);
  
  // Wheel Physics Variables
  const angleRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const lastTickAngleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);

  // Synthesize game sounds using Web Audio API (0 external assets required!)
  const playSound = (type: "tick" | "success" | "error" | "win" | "spin") => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      if (type === "tick") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === "spin") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "success") {
        // High pitched pleasant double chime
        const now = ctx.currentTime;
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.06, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      } else if (type === "error") {
        // Low buzzy sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "win") {
        // Glorious fanfare!
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.05, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });
      }
    } catch (err) {
      // Audio context might be blocked by browser autoplay policy before user interaction
    }
  };

  // Setup full screen confetti particle animation
  const startConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to cover viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#C84B31", "#346751", "#F4A261", "#2A9D8F", "#7209B7", "#FFD166", "#06D6A0", "#118AB2"];
    const particles: ConfettiParticle[] = [];

    // Create 150 particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height, // start above screen
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }

    confettiParticlesRef.current = particles;

    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        
        // Add tiny wind / wiggle
        p.vx += (Math.random() - 0.5) * 0.2;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Check if particle is still on screen
        if (p.y < canvas.height + 20) {
          active = true;
        }
      });

      if (active && gameState === "gameover") {
        confettiRequestRef.current = requestAnimationFrame(animateConfetti);
      } else if (active && showQuestionModal && hasConfirmedAnswer && selectedAnswerIndex === currentQuestion?.correctIndex) {
        confettiRequestRef.current = requestAnimationFrame(animateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (confettiRequestRef.current) {
      cancelAnimationFrame(confettiRequestRef.current);
    }
    confettiRequestRef.current = requestAnimationFrame(animateConfetti);
  };

  // Draw the spinning wheel canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    const numSegments = CATEGORIES.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    // Draw the outer wheel glow and border
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = "#1E1915"; // Beautiful deep charcoal rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fill();

    // Reset shadow for slices
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw slices
    CATEGORIES.forEach((category, index) => {
      const startAngle = index * segmentAngle + angleRef.current;
      const endAngle = startAngle + segmentAngle;

      // Slice background
      ctx.fillStyle = CATEGORY_COLORS[category] || "#999";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Delicate golden-sand divider line between segments
      ctx.strokeStyle = "rgba(250, 246, 240, 0.25)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(startAngle) * radius,
        centerY + Math.sin(startAngle) * radius
      );
      ctx.stroke();

      // Check if this category is fully answered
      const categoryQuestions = QUESTIONS.filter(q => q.category === category);
      const isCompleted = categoryQuestions.every(q => answeredQuestions[q.id] !== undefined);

      // Draw category label text rotated outwards
      ctx.save();
      ctx.translate(centerX, centerY);
      const middleAngle = startAngle + segmentAngle / 2;
      ctx.rotate(middleAngle);

      // Label text alignment and styling
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FAF6F0"; // Elegant sand-white text

      // Adjust text based on completeness
      if (isCompleted) {
        ctx.font = "bold 12px var(--font-sans)";
        ctx.fillText("✓ COMPLETADA", radius - 24, 0);
      } else {
        ctx.font = "600 11.5px var(--font-display)";
        // Wrap text slightly if too long, or print cleanly
        let displayName = category;
        if (category.includes(" (")) {
          displayName = category.split(" (")[0];
        }
        ctx.fillText(displayName.toUpperCase(), radius - 24, 0);
      }

      ctx.restore();
    });

    // Draw central golden wheel core hub (the spin button placeholder / anchor)
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "#E6C566"; // Rich amber gold core
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw core inner border
    ctx.strokeStyle = "#FAF6F0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw core text
    ctx.fillStyle = "#1E1915";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 10.5px var(--font-display)";
    ctx.fillText("¡GIRAR!", centerX, centerY);
  };

  // Handle window resizing for sharp canvas
  useEffect(() => {
    drawWheel();
    const handleResize = () => {
      drawWheel();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [rotationAngle, answeredQuestions]);

  // Physic engine loop for realistic spin momentum decay
  const updateSpinPhysics = () => {
    if (!isSpinningRef.current) return;

    // Apply friction/decay to spin speed
    spinSpeedRef.current *= 0.982; // damping factor
    angleRef.current += spinSpeedRef.current;
    setRotationAngle(angleRef.current);

    // Play ticking sound when crossing segment boundaries
    const numSegments = CATEGORIES.length;
    const segmentRadians = (2 * Math.PI) / numSegments;
    const currentSegmentCross = Math.floor(angleRef.current / segmentRadians);
    
    if (currentSegmentCross !== lastTickAngleRef.current) {
      playSound("tick");
      lastTickAngleRef.current = currentSegmentCross;
    }

    // Stop wheel if speed drops below very low threshold
    if (spinSpeedRef.current < 0.0025) {
      spinSpeedRef.current = 0;
      isSpinningRef.current = false;
      setIsSpinning(false);
      
      // Calculate which segment the fixed right pointer (at 3 o'clock / 0 or 2 * Math.PI) lands on
      // Right pointer in canvas coordinates is at 0 (or 2 * Math.PI).
      // We normalize the landing angle to range [0, 2*PI).
      let landedAngle = (2 * Math.PI - angleRef.current) % (2 * Math.PI);
      if (landedAngle < 0) landedAngle += 2 * Math.PI;

      const segmentIndex = Math.floor(landedAngle / segmentRadians);
      const category = CATEGORIES[segmentIndex];
      setLandedCategory(category);
      
      // Select question
      triggerCategorySelected(category);
    } else {
      requestRef.current = requestAnimationFrame(updateSpinPhysics);
    }
  };

  // Spin trigger
  const spinWheel = () => {
    if (isSpinningRef.current || showQuestionModal || isWildcardActive) return;
    
    // Reset state for new turn
    setSelectedAnswerIndex(null);
    setHasConfirmedAnswer(false);
    setPointsAwarded(0);

    playSound("spin");
    setIsSpinning(true);
    isSpinningRef.current = true;
    
    // Choose a highly variable random initial velocity
    // (Ensure it does multiple complete spins: 0.18 - 0.35 rad per frame)
    spinSpeedRef.current = 0.22 + Math.random() * 0.16;
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(updateSpinPhysics);
  };

  // Determine what happens after category lands
  const triggerCategorySelected = (category: string) => {
    // Filter questions belonging to this category which are NOT yet answered
    const categoryQuestions = QUESTIONS.filter(q => q.category === category);
    const unanswered = categoryQuestions.filter(q => answeredQuestions[q.id] === undefined);

    if (unanswered.length > 0) {
      // Pick a random question from this category
      const randomQ = unanswered[Math.floor(Math.random() * unanswered.length)];
      setCurrentQuestion(randomQ);
      // Give a tiny delay before opening the modal for beautiful game pacing
      setTimeout(() => {
        setShowQuestionModal(true);
      }, 700);
    } else {
      // No questions left in this category! Trigger wildcard/comodín
      setTimeout(() => {
        setIsWildcardActive(true);
      }, 700);
    }
  };

  // Handle wildcard category pick
  const handleWildcardCategorySelect = (selectedCategory: string) => {
    const categoryQuestions = QUESTIONS.filter(q => q.category === selectedCategory);
    const unanswered = categoryQuestions.filter(q => answeredQuestions[q.id] === undefined);

    if (unanswered.length > 0) {
      const randomQ = unanswered[Math.floor(Math.random() * unanswered.length)];
      setCurrentQuestion(randomQ);
      setIsWildcardActive(false);
      setShowQuestionModal(true);
    }
  };

  // Get total unanswered questions overall
  const getUnansweredQuestionsCount = () => {
    const limit = gameMode === "all" ? 20 : 10;
    // Total questions in game context
    const gameQuestionsIds = gameMode === "all" 
      ? QUESTIONS.map(q => q.id) 
      : QUESTIONS.slice(0, 10).map(q => q.id);

    const answeredInContext = gameQuestionsIds.filter(id => answeredQuestions[id] !== undefined);
    return limit - answeredInContext.length;
  };

  // Check if game has ended
  const checkGameCompletion = (updatedAnswered: Record<number, any>) => {
    const limit = gameMode === "all" ? 20 : 10;
    const gameQuestionsIds = gameMode === "all" 
      ? QUESTIONS.map(q => q.id) 
      : QUESTIONS.slice(0, 10).map(q => q.id);

    const answeredInContextCount = gameQuestionsIds.filter(id => updatedAnswered[id] !== undefined).length;
    
    if (answeredInContextCount >= limit) {
      setGameState("gameover");
      playSound("win");
      setTimeout(() => {
        startConfetti();
      }, 300);
    }
  };

  // Submit/confirm selected answer
  const confirmAnswer = () => {
    if (selectedAnswerIndex === null || !currentQuestion) return;

    const isCorrect = selectedAnswerIndex === currentQuestion.correctIndex;
    const points = isCorrect ? 10 : 0;
    setPointsAwarded(points);
    setHasConfirmedAnswer(true);

    if (isCorrect) {
      playSound("success");
      // Add particle sparks
      startConfetti();
    } else {
      playSound("error");
    }

    // Update active scores
    setScores(prev => {
      const next = { ...prev };
      if (currentPlayer === 1) {
        next.player1 += points;
      } else {
        next.player2 += points;
      }
      return next;
    });

    // Update player streaks
    setStreaks(prev => {
      const next = { ...prev };
      if (currentPlayer === 1) {
        if (isCorrect) {
          next.player1 += 1;
          next.maxPlayer1 = Math.max(next.maxPlayer1, next.player1);
        } else {
          next.player1 = 0;
        }
      } else {
        if (isCorrect) {
          next.player2 += 1;
          next.maxPlayer2 = Math.max(next.maxPlayer2, next.player2);
        } else {
          next.player2 = 0;
        }
      }
      return next;
    });

    // Log this answered question
    const updatedAnswered = {
      ...answeredQuestions,
      [currentQuestion.id]: {
        isCorrect,
        answeredBy: currentPlayer,
        selectedIndex: selectedAnswerIndex
      }
    };
    setAnsweredQuestions(updatedAnswered);
  };

  // Proceed to next player's turn
  const nextTurn = () => {
    setShowQuestionModal(false);
    setCurrentQuestion(null);
    setLandedCategory(null);
    
    // Switch active player
    setCurrentPlayer(prev => (prev === 1 ? 2 : 1));

    // Verify if game completed
    checkGameCompletion(answeredQuestions);
  };

  // Start/Restart Game
  const startGame = () => {
    if (!player1Name.trim()) setPlayer1Name("Jugador 1");
    if (!player2Name.trim()) setPlayer2Name("Jugador 2");
    
    setScores({ player1: 0, player2: 0 });
    setStreaks({ player1: 0, player2: 0, maxPlayer1: 0, maxPlayer2: 0 });
    setAnsweredQuestions({});
    setCurrentPlayer(1);
    setLandedCategory(null);
    setIsWildcardActive(false);
    setShowQuestionModal(false);
    setGameState("playing");
    
    // Spin once slightly to render nicely
    angleRef.current = Math.random() * Math.PI * 2;
    setRotationAngle(angleRef.current);
    
    setTimeout(() => {
      drawWheel();
    }, 50);
  };

  const restartToSetup = () => {
    setGameState("setup");
  };

  // Clean up animation frames
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (confettiRequestRef.current) cancelAnimationFrame(confettiRequestRef.current);
    };
  }, []);

  // Determine active list of questions in game context
  const getContextQuestions = () => {
    return gameMode === "all" ? QUESTIONS : QUESTIONS.slice(0, 10);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 selection:bg-yellow-200 text-white relative">
      
      {/* Background celebration particles */}
      <canvas 
        ref={confettiCanvasRef} 
        className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      />

      {/* Main Theme Frame Container */}
      <div className="w-full max-w-5xl bg-indigo-900/40 backdrop-blur-md text-white font-sans flex flex-col overflow-hidden relative shadow-2xl border-4 md:border-8 border-indigo-950 rounded-3xl min-h-[720px] transition-all">
        
        {/* Background Glowing Decorative Elements */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Dynamic Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-12 py-6 md:py-8 bg-indigo-950/60 border-b-4 border-yellow-400 z-10">
          {gameState !== "setup" ? (
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Jugador 1</span>
              <div className="flex items-center gap-3 md:gap-4 mt-1">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black ring-4 ring-pink-300 shadow-lg text-white">
                  {scores.player1}
                </div>
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-bold text-white flex items-center gap-1.5">
                    {player1Name}
                    {currentPlayer === 1 && (
                      <span className="animate-ping w-2 h-2 rounded-full bg-pink-400 inline-block" />
                    )}
                  </span>
                  {streaks.player1 > 0 && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-bold w-fit">
                      🔥 Racha: {streaks.player1}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Modo de Juego</span>
              <span className="text-sm font-black text-yellow-400 mt-1 uppercase tracking-wider">Vibrant Edition</span>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-black text-yellow-400 italic leading-none uppercase tracking-tight font-display">
              Imperativo
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1 font-bold tracking-widest">
              LA GRAN VICTORIA DE ESPAÑOL
            </p>
          </div>

          {gameState !== "setup" ? (
            <div className="flex flex-col items-center md:items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Jugador 2</span>
              <div className="flex items-center gap-3 md:gap-4 mt-1">
                <div className="flex flex-col items-end">
                  <span className="text-base md:text-lg font-bold text-white flex items-center gap-1.5">
                    {currentPlayer === 2 && (
                      <span className="animate-ping w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    )}
                    {player2Name}
                  </span>
                  {streaks.player2 > 0 && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold w-fit">
                      🔥 Racha: {streaks.player2}
                    </span>
                  )}
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black ring-4 ring-emerald-300 shadow-lg text-white">
                  {scores.player2}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Plataforma</span>
              <span className="text-sm font-black text-emerald-400 mt-1 uppercase tracking-wider">Multijugador</span>
            </div>
          )}
        </div>

        {/* --- SETUP STATE VIEW --- */}
        {gameState === "setup" && (
          <main className="w-full flex-1 flex flex-col justify-center p-6 md:p-12 z-10 max-w-2xl mx-auto">
            <div className="bg-indigo-950/40 backdrop-blur-lg rounded-3xl border border-indigo-800 p-6 md:p-8 shadow-2xl relative overflow-hidden text-white space-y-6">
              
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full text-xs font-extrabold uppercase tracking-widest">
                  <Sparkles size={11} className="fill-pink-300" />
                  ¡Nueva Contienda!
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white font-display uppercase tracking-tight">
                  Configura tu Batalla
                </h2>
                <p className="text-indigo-200/80 text-xs md:text-sm max-w-md mx-auto">
                  Giren la ruleta, dominen la gramática del imperativo en español y acumulen 10 puntos por respuesta correcta.
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Player 1 */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-pink-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 inline-block shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                      Jugador 1 (Rosa)
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                      <input
                        type="text"
                        value={player1Name}
                        onChange={(e) => setPlayer1Name(e.target.value)}
                        maxLength={15}
                        placeholder="Nombre del Jugador 1"
                        className="w-full pl-10 pr-4 py-3 bg-indigo-950/60 border border-indigo-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm font-semibold transition-all text-white placeholder-indigo-400"
                        id="player_1_input"
                      />
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      Jugador 2 (Esmeralda)
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                      <input
                        type="text"
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)}
                        maxLength={15}
                        placeholder="Nombre del Jugador 2"
                        className="w-full pl-10 pr-4 py-3 bg-indigo-950/60 border border-indigo-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition-all text-white placeholder-indigo-400"
                        id="player_2_input"
                      />
                    </div>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest block">
                    Duración de la Partida
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setGameMode("all")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        gameMode === "all"
                          ? "bg-pink-500/15 border-pink-500 ring-2 ring-pink-400/50 text-white"
                          : "bg-indigo-950/40 border-indigo-800 text-indigo-300 hover:border-indigo-700"
                      }`}
                      id="mode_all_btn"
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wider">Completo (20 Preguntas)</span>
                      <span className="text-[10px] opacity-75 mt-0.5">La experiencia total de imperativos</span>
                    </button>
                    <button
                      onClick={() => setGameMode("sprint10")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        gameMode === "sprint10"
                          ? "bg-pink-500/15 border-pink-500 ring-2 ring-pink-400/50 text-white"
                          : "bg-indigo-950/40 border-indigo-800 text-indigo-300 hover:border-indigo-700"
                      }`}
                      id="mode_sprint_btn"
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wider">Sprint (10 Preguntas)</span>
                      <span className="text-[10px] opacity-75 mt-0.5">Perfecto para una partida ágil</span>
                    </button>
                  </div>
                </div>

                {/* Rules Cards */}
                <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-800/60 space-y-2">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 uppercase tracking-widest font-display">
                    <Info size={14} />
                    Reglas de Combate
                  </span>
                  <ul className="text-xs text-indigo-200/90 space-y-1.5 list-disc list-inside pl-1">
                    <li>Los jugadores participan de forma alternada por turnos.</li>
                    <li>Giren la ruleta para sortear una de las 6 categorías del imperativo.</li>
                    <li>Si la categoría sorteada ya está completa, se otorga un <strong className="text-yellow-400">¡COMODÍN!</strong>.</li>
                    <li>Cada respuesta correcta suma <strong className="text-yellow-400">10 puntos</strong>. Sin penalización por fallar.</li>
                  </ul>
                </div>

                {/* Start Button */}
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-indigo-950 font-black py-4 px-6 rounded-xl hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                  id="start_game_btn"
                >
                  <Play size={16} className="fill-indigo-950" />
                  ¡Comenzar Desafío Gramatical!
                </button>
              </div>
            </div>
          </main>
        )}

      {/* --- ACTIVE GAMEPLAY STATE VIEW --- */}
      {gameState === "playing" && (
        <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 md:p-12 z-10">
          
          {/* LEFT PANEL: Interactive Wheel (col-span-5) */}
          <section className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
            
            {/* The Wheel Container */}
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center bg-indigo-950/40 rounded-full p-2.5 border-8 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.25)] transition-all">
              
              {/* Pointer Marker (Fixed at right, pointing left to the center) */}
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-xl animate-pulse">
                <div className="w-0 h-0 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-r-[28px] border-r-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </div>
 
              {/* Real Interactive Canvas Wheel */}
              <canvas
                ref={canvasRef}
                className={`w-full h-full rounded-full transition-transform cursor-pointer ${
                  isSpinning ? "pointer-events-none" : "hover:scale-[1.01] active:scale-[0.99]"
                }`}
                onClick={spinWheel}
                style={{
                  width: "100%",
                  height: "100%",
                  transform: "rotate(0deg)" // We update Canvas buffer directly
                }}
              />
 
              {/* Spinning Overlay Indicator */}
              {isSpinning && (
                <div className="absolute inset-0 bg-transparent rounded-full flex items-center justify-center pointer-events-none">
                  <div className="animate-ping absolute w-24 h-24 rounded-full bg-yellow-400/10" />
                </div>
              )}
            </div>
 
            {/* Spin Controls */}
            <div className="text-center space-y-2">
              <button
                onClick={spinWheel}
                disabled={isSpinning || showQuestionModal || isWildcardActive}
                className={`px-8 py-4 rounded-xl font-black tracking-wide shadow-lg transition-all flex items-center gap-2 uppercase text-xs ${
                  isSpinning || showQuestionModal || isWildcardActive
                    ? "bg-indigo-950/40 text-indigo-400/50 cursor-not-allowed border border-indigo-800/30"
                    : "bg-yellow-400 text-indigo-950 hover:bg-yellow-500 hover:shadow-[0_0_30px_rgba(250,204,21,0.35)] active:scale-95"
                }`}
                id="spin_wheel_action_btn"
              >
                <Sparkles size={16} />
                {isSpinning ? "Girando Rueda..." : "¡Girar la Rueda!"}
              </button>
              <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
                Haz clic en el botón o en la ruleta para girar
              </p>
            </div>
          </section>
 
          {/* RIGHT PANEL: Scoreboard, Active Status and Wildcard (col-span-7) */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Simplified Scoreboard/Header info has been integrated at top. Let's provide active status! */}
            <div className="bg-indigo-950/40 border border-indigo-800 p-5 rounded-2xl shadow-sm space-y-4">
              
              {!isSpinning && !showQuestionModal && !isWildcardActive && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                      currentPlayer === 1 
                        ? "bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.15)]" 
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    }`}>
                      Turno: {currentPlayer === 1 ? player1Name : player2Name}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">
                    ¿Preparado para girar la rueda?
                  </h3>
                  <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed">
                    Gira la ruleta de imperativos para sortear un desafío gramatical. Si completas con éxito la transformación del verbo obtendrás <strong className="text-yellow-400">10 puntos</strong> de recompensa.
                  </p>
                </div>
              )}
 
              {isSpinning && (
                <div className="text-center py-4 space-y-2">
                  <div className="animate-spin inline-block w-8 h-8 border-[3px] border-yellow-400 border-t-transparent rounded-full text-yellow-400" />
                  <h3 className="text-base font-bold text-yellow-400 font-display uppercase tracking-widest text-xs">
                    Sorteando categoría...
                  </h3>
                  <p className="text-xs text-indigo-300">
                    La rueda está girando. ¡Prepara tus conocimientos!
                  </p>
                </div>
              )}
 
              {/* LANDED STATE (Category picked, waiting for modal) */}
              {!isSpinning && landedCategory && !showQuestionModal && !isWildcardActive && (
                <div className="space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                      style={{ backgroundColor: CATEGORY_COLORS[landedCategory] }}
                    />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {landedCategory}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-400 font-display">
                    ¡Tenemos una categoría!
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Cargando desafío de imperativos disponible...
                  </p>
                </div>
              )}
 
              {/* WILDCARD COMODÍN SELECTION PANEL */}
              {isWildcardActive && (
                <div className="space-y-4 border-2 border-dashed border-yellow-400 bg-yellow-400/5 rounded-2xl p-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-yellow-400 text-indigo-950 text-xs font-black rounded-lg flex items-center gap-1 uppercase tracking-wider shadow-[0_0_15px_rgba(250,204,21,0.25)]">
                      <Sparkles size={12} className="fill-indigo-950" />
                      ¡COMODÍN GRAMATICAL!
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white font-display uppercase tracking-tight">
                      Categoría Agotada en la Ruleta
                    </h3>
                    <p className="text-xs text-indigo-200/80 leading-relaxed">
                      ¡Estupendo! Todas las preguntas de la categoría seleccionada por la rueda ya han sido respondidas. Como beneficio, <strong className="text-yellow-400 font-bold">elige libremente</strong> cualquiera de las siguientes categorías que aún tengan preguntas disponibles:
                    </p>
                  </div>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {CATEGORIES.map((cat) => {
                      const catQuestions = QUESTIONS.filter(q => q.category === cat);
                      const unanswered = catQuestions.filter(q => answeredQuestions[q.id] === undefined);
                      const isCompleted = unanswered.length === 0;
 
                      return (
                        <button
                          key={cat}
                          disabled={isCompleted}
                          onClick={() => handleWildcardCategorySelect(cat)}
                          className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                            isCompleted
                              ? "bg-indigo-950/20 border-indigo-900/60 text-indigo-500 cursor-not-allowed opacity-40"
                              : "bg-indigo-950/40 border-indigo-800 hover:border-yellow-400 hover:bg-yellow-400/5 text-white active:scale-[0.98]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: isCompleted ? "#475569" : CATEGORY_COLORS[cat] }}
                            />
                            <span className="truncate">{cat}</span>
                          </div>
                          {!isCompleted && (
                            <span className="bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {unanswered.length} disp.
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
 
            {/* Detailed Rule / Grammar Tip Info Box */}
            <div className="bg-indigo-950/20 border border-indigo-800/50 rounded-2xl p-4 flex gap-3 text-indigo-200">
              <div className="text-yellow-400 flex-shrink-0 mt-0.5">
                <Info size={16} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-white block uppercase tracking-wider font-display">
                  Tip de Imperativos en Español
                </span>
                <p className="text-xs text-indigo-200/70 leading-relaxed">
                  Recuerda que el imperativo afirmativo para la cortesía (<em className="text-yellow-400 font-medium not-italic">usted / ustedes</em>) y las formas negativas coinciden con las terminaciones del presente de subjuntivo. ¡Esto te ayudará a ganar!
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* --- QUESTION MODAL / POPUP OVERLAY --- */}
      {showQuestionModal && currentQuestion && (
        <div className="fixed inset-0 bg-indigo-950/75 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in">
          
          <div className="bg-white w-full max-w-xl rounded-3xl border-4 border-indigo-600 shadow-2xl overflow-hidden animate-slide-up relative text-indigo-950">
            
            {/* Modal Ribbon Header */}
            <div 
              className="px-6 py-4 flex items-center justify-between text-white font-black"
              style={{ backgroundColor: CATEGORY_COLORS[currentQuestion.category] || "#1E1915" }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={18} />
                <span className="text-xs font-black tracking-widest uppercase font-display">
                  {currentQuestion.category}
                </span>
              </div>
              <span className="text-[10px] bg-black/25 text-white/90 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider">
                Pregunta #{currentQuestion.id} • +10 Pts
              </span>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Turn Banner inside Modal */}
              <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 border ${
                currentPlayer === 1 
                  ? "bg-pink-50 border-pink-200/60 text-pink-900" 
                  : "bg-emerald-50 border-emerald-200/60 text-emerald-900"
              }`}>
                <span className={`w-3 h-3 rounded-full animate-ping ${currentPlayer === 1 ? "bg-pink-500" : "bg-emerald-500"}`} />
                <span className="text-xs font-black uppercase tracking-wider">
                  Responde: {currentPlayer === 1 ? player1Name : player2Name}
                </span>
              </div>

              {/* Question Statement */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                  Transforma la siguiente frase al IMPERATIVO:
                </span>
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl text-center">
                  <h4 className="text-xl font-bold text-indigo-950 leading-relaxed font-display">
                    “<span className="text-pink-600 italic font-black">{currentQuestion.original}</span>”
                  </h4>
                </div>
              </div>

              {/* Answer options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  
                  // Color styling based on answer interaction state
                  let btnStyle = "bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 text-indigo-950 hover:bg-indigo-50 font-bold";
                  let indexStyle = "bg-indigo-900 text-white";

                  if (selectedAnswerIndex === idx) {
                    btnStyle = "bg-pink-50 border-pink-500 ring-2 ring-pink-400 text-pink-950 font-extrabold";
                    indexStyle = "bg-pink-500 text-white";
                  }

                  if (hasConfirmedAnswer) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 font-extrabold pointer-events-none";
                      indexStyle = "bg-emerald-500 text-white";
                    } else if (selectedAnswerIndex === idx) {
                      btnStyle = "bg-rose-50 border-rose-500 ring-2 ring-rose-400 text-rose-950 font-extrabold pointer-events-none";
                      indexStyle = "bg-rose-500 text-white";
                    } else {
                      btnStyle = "bg-indigo-50/20 border-indigo-100/50 text-indigo-900/40 font-medium pointer-events-none opacity-40";
                      indexStyle = "bg-indigo-900/40 text-white/50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasConfirmedAnswer}
                      onClick={() => setSelectedAnswerIndex(idx)}
                      className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between shadow-sm cursor-pointer group ${btnStyle}`}
                    >
                      <div className="flex items-center">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black mr-4 text-sm transition-all ${indexStyle}`}>
                          {["A", "B", "C", "D"][idx]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>
                      
                      {/* Interactive Feedback Icons */}
                      {hasConfirmedAnswer && idx === currentQuestion.correctIndex && (
                        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 ml-2" />
                      )}
                      {hasConfirmedAnswer && selectedAnswerIndex === idx && idx !== currentQuestion.correctIndex && (
                        <XCircle size={20} className="text-rose-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Grammar Explanation Block after confirming */}
              {hasConfirmedAnswer && (
                <div className={`p-4 rounded-2xl border flex gap-3 text-indigo-900 animate-fade-in ${
                  selectedAnswerIndex === currentQuestion.correctIndex
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-rose-50/50 border-rose-200"
                }`}>
                  <div className="mt-0.5 flex-shrink-0">
                    {selectedAnswerIndex === currentQuestion.correctIndex ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : (
                      <XCircle size={18} className="text-rose-600" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black block text-indigo-950 font-display uppercase tracking-wider">
                      {selectedAnswerIndex === currentQuestion.correctIndex 
                        ? "¡Respuesta Correcta! (+10 Pts)" 
                        : "Respuesta Incorrecta (0 Pts)"}
                    </span>
                    <p className="text-xs text-indigo-900/80 leading-relaxed font-semibold">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Controls footer */}
            <div className="px-6 py-4 bg-indigo-50/50 border-t border-indigo-100 flex justify-end gap-2">
              {!hasConfirmedAnswer ? (
                <button
                  onClick={confirmAnswer}
                  disabled={selectedAnswerIndex === null}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedAnswerIndex === null
                      ? "bg-indigo-100 text-indigo-300 cursor-not-allowed"
                      : "bg-indigo-900 text-white hover:bg-indigo-950 active:scale-[0.98] shadow-md"
                  }`}
                  id="confirm_answer_btn"
                >
                  Confirmar Respuesta
                </button>
              ) : (
                <button
                  onClick={nextTurn}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-indigo-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-md cursor-pointer"
                  id="next_turn_btn"
                >
                  Continuar
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- GAMEOVER STATE VIEW --- */}
      {gameState === "gameover" && (
        <main className="w-full max-w-2xl flex-1 flex flex-col justify-center my-auto animate-fade-in p-6 z-10">
          <div className="bg-white rounded-3xl border-4 border-indigo-600 p-6 md:p-8 shadow-2xl relative overflow-hidden text-center space-y-6 text-indigo-950">
            
            {/* Ambient dynamic top accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-yellow-400 to-emerald-500" />

            <div className="inline-flex p-4 bg-yellow-400 text-indigo-950 rounded-full shadow-lg ring-4 ring-yellow-400/30">
              <Trophy size={36} className="stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-indigo-950 font-display uppercase tracking-tight">
                ¡Partida Finalizada!
              </h2>
              <p className="text-indigo-600/80 text-xs font-bold uppercase tracking-wider">
                Se han respondido todos los desafíos gramaticales.
              </p>
            </div>

            {/* Winner Announcement Card */}
            <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                Resultado de la Batalla
              </span>
              
              {scores.player1 === scores.player2 ? (
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-pink-600 font-display uppercase tracking-tight">
                    ¡Empate Extraordinario!
                  </h3>
                  <p className="text-sm text-indigo-950 font-bold leading-relaxed">
                    Ambos jugadores dominaron con destreza sumando <span className="text-indigo-600 font-black">{scores.player1} puntos</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-pink-600">
                    <Award size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Ganador Absoluto</span>
                  </div>
                  <h3 className="text-4xl font-black text-indigo-950 font-display uppercase tracking-tight drop-shadow-sm">
                    {scores.player1 > scores.player2 ? player1Name : player2Name}
                  </h3>
                  <p className="text-xs md:text-sm text-indigo-900 leading-relaxed font-semibold">
                    Se corona campeón con un total de{" "}
                    <strong className="text-pink-600 font-black">
                      {Math.max(scores.player1, scores.player2)} puntos
                    </strong>{" "}
                    sobre los {Math.min(scores.player1, scores.player2)} del rival.
                  </p>
                </div>
              )}
            </div>

            {/* Mini Player Stat Breakdown columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wide block">
                  {player1Name}
                </span>
                <span className="text-2xl font-black text-pink-600 font-display block">
                  {scores.player1} <span className="text-xs font-bold">Pts</span>
                </span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                  Racha Máx: {streaks.maxPlayer1}
                </span>
              </div>

              <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wide block">
                  {player2Name}
                </span>
                <span className="text-2xl font-black text-emerald-600 font-display block">
                  {scores.player2} <span className="text-xs font-bold">Pts</span>
                </span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                  Racha Máx: {streaks.maxPlayer2}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={startGame}
                className="px-6 py-3.5 bg-indigo-900 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all hover:bg-indigo-950 active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                id="play_again_btn"
              >
                <RotateCcw size={14} />
                Volver a Jugar
              </button>
              <button
                onClick={restartToSetup}
                className="px-6 py-3.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                id="change_names_btn"
              >
                Cambiar Jugadores / Modo
              </button>
            </div>
          </div>
        </main>
      )}

      {/* --- GRID PROGRESS TRACKER (Sticky Footer at bottom of gameplay) --- */}
      {gameState === "playing" && (
        <footer className="w-full max-w-4xl bg-indigo-950/40 border border-indigo-800 rounded-2xl p-4 md:p-5 mt-8 shadow-sm space-y-3 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-800/60 pb-3">
            <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-widest">
              Mapa de Progreso ({getContextQuestions().length} Preguntas Totales)
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-indigo-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-indigo-900/60 border border-indigo-800" /> Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.3)]" /> Correcta {player1Name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> Correcta {player2Name}
              </span>
            </div>
          </div>

          {/* Dots List Grid */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
            {getContextQuestions().map((q, idx) => {
              const state = answeredQuestions[q.id];
              
              let dotBg = "bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/50 border-indigo-800 hover:text-white";
              let tooltipText = `Pregunta ${q.id}: Pendiente`;
              
              if (state) {
                const playerName = state.answeredBy === 1 ? player1Name : player2Name;
                if (state.isCorrect) {
                  dotBg = state.answeredBy === 1 
                    ? "bg-pink-500 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.25)]" 
                    : "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]";
                  tooltipText = `Pregunta ${q.id}: Correcta por ${playerName}`;
                } else {
                  dotBg = state.answeredBy === 1 
                    ? "bg-pink-500/20 text-pink-300 border-pink-500/30" 
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                  tooltipText = `Pregunta ${q.id}: Incorrecta por ${playerName}`;
                }
              }

              return (
                <div
                  key={q.id}
                  className={`w-8 h-8 rounded-xl border text-xs font-black flex items-center justify-center transition-all select-none relative group cursor-help ${dotBg}`}
                  title={tooltipText}
                >
                  {q.id}

                  {/* Hover floating detailed tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-indigo-950 border border-indigo-700 text-white text-[10px] p-3 rounded-xl shadow-xl z-30 w-48 pointer-events-none transition-all duration-200">
                    <span className="font-extrabold uppercase tracking-widest text-yellow-400 block mb-1">
                      {q.category}
                    </span>
                    <p className="font-semibold leading-snug">“{q.original}”</p>
                    <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block mt-1.5 pt-1.5 border-t border-indigo-800">
                      {tooltipText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </footer>
      )}

      {/* Tiny subtle aesthetic credit watermark */}
      <div className="text-[10px] text-indigo-400/60 mt-8 tracking-wider select-none uppercase font-bold z-10">
        Imperativo Quiz Game • Aprendizaje Interactivo de la Gramática Española
      </div>
    </div>
  </div>
);
}
