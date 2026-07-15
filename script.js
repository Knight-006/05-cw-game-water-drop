const gameContainer = document.getElementById("game-container");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const goalEl = document.getElementById("goal-value");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const messageEl = document.getElementById("game-message");
const difficultySelect = document.getElementById("difficulty-select");

const difficultySettings = {
  easy: {
    label: "Easy",
    goal: 15,
    time: 45,
    spawnRate: 1100,
    obstacleRate: 0.24,
    collectValue: 6,
    missPenalty: 2,
    message: "Easy mode gives you a gentler pace and a lower goal."
  },
  normal: {
    label: "Normal",
    goal: 30,
    time: 30,
    spawnRate: 800,
    obstacleRate: 0.3,
    collectValue: 5,
    missPenalty: 3,
    message: "Normal mode keeps the pace steady and the goal at 30 points."
  },
  hard: {
    label: "Hard",
    goal: 40,
    time: 24,
    spawnRate: 650,
    obstacleRate: 0.4,
    collectValue: 4,
    missPenalty: 4,
    message: "Hard mode is fast, with a higher goal and tougher timing."
  }
};

let gameRunning = false;
let score = 0;
let timeLeft = difficultySettings.normal.time;
let countdownTimer;
let itemTimer;
let currentDifficulty = difficultySettings.normal;
let milestoneIndex = 0;
let audioContext;
const soundEffects = {
  collect: new Audio("audio/collect.wav"),
  miss: new Audio("audio/miss.wav"),
  win: new Audio("audio/win.wav"),
  button: new Audio("audio/button.wav")
};

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
difficultySelect.addEventListener("change", () => {
  currentDifficulty = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  if (!gameRunning) {
    timeLeft = currentDifficulty.time;
    timeEl.textContent = timeLeft;
    goalEl.textContent = currentDifficulty.goal;
    setMessage(`${currentDifficulty.message} Ready to play?`, "neutral");
    playSound("button");
  }
});

function startGame() {
  if (gameRunning) return;

  currentDifficulty = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  playSound("button");

  gameRunning = true;
  score = 0;
  timeLeft = currentDifficulty.time;
  milestoneIndex = 0;
  updateScoreDisplay();
  timeEl.textContent = timeLeft;
  goalEl.textContent = currentDifficulty.goal;
  setMessage(`Collect the cans and reach ${currentDifficulty.goal} points!`, "neutral");

  startBtn.disabled = true;
  startBtn.textContent = "Game Running";
  resetBtn.disabled = false;

  gameContainer.querySelector(".game-instructions")?.remove();
  gameContainer.querySelectorAll(".game-item, .game-overlay, .confetti-piece, .feedback-badge").forEach((item) => item.remove());

  createItem();
  itemTimer = setInterval(createItem, currentDifficulty.spawnRate);
  countdownTimer = setInterval(updateTimer, 1000);
}

function resetGame() {
  clearInterval(countdownTimer);
  clearInterval(itemTimer);
  gameRunning = false;

  currentDifficulty = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  score = 0;
  timeLeft = currentDifficulty.time;
  milestoneIndex = 0;
  updateScoreDisplay();
  timeEl.textContent = timeLeft;
  goalEl.textContent = currentDifficulty.goal;
  scoreEl.classList.remove("score-positive", "score-negative");
  setMessage("Press start to begin rescuing safe water cans.", "neutral");

  playSound("button");

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  resetBtn.disabled = true;

  gameContainer.querySelectorAll(".game-item, .game-overlay, .confetti-piece, .feedback-badge").forEach((item) => item.remove());

  const instructions = document.createElement("div");
  instructions.className = "game-instructions";
  instructions.innerHTML = `
    <h2>Help the mission</h2>
    <p>Click the blue water cans to gain points. Avoid the red obstacle blocks.</p>
  `;
  gameContainer.appendChild(instructions);
}

function updateTimer() {
  timeLeft -= 1;
  timeEl.textContent = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(countdownTimer);
    clearInterval(itemTimer);
    gameRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
    resetBtn.disabled = false;

    const outcomeText = score >= currentDifficulty.goal ? "You met the goal and saved enough water!" : "Time is up. Reset and try again.";
    setMessage(outcomeText, score >= currentDifficulty.goal ? "positive" : "neutral");
    showOverlay(score >= currentDifficulty.goal ? "You win!" : "Time is up", `Final score: ${score}`);
    if (score >= currentDifficulty.goal) {
      playSound("win");
      createConfetti();
    } else {
      playSound("miss");
    }
  }
}

function createItem() {
  if (!gameRunning) return;

  const item = document.createElement("button");
  item.type = "button";
  const isObstacle = Math.random() < currentDifficulty.obstacleRate;
  item.className = isObstacle ? "game-item obstacle" : "game-item collectible";
  const asset = isObstacle ? "img/cw_logo.png" : "img/water-can-transparent.png";
  const altText = isObstacle ? "charity: water logo obstacle" : "water can collectible";
  item.innerHTML = `<img class="item-image" src="${asset}" alt="${altText}">`;

  const gameWidth = gameContainer.clientWidth - 90;
  const gameHeight = gameContainer.clientHeight - 120;
  const xPosition = Math.random() * gameWidth;
  const yPosition = Math.random() * gameHeight;

  item.style.left = `${xPosition}px`;
  item.style.top = `${yPosition}px`;
  item.style.setProperty("--fall-distance", `${gameContainer.clientHeight + 120}px`);
  item.style.animationDuration = `${2.4 + Math.random() * 1.2}s`;

  item.addEventListener("click", () => handleItemClick(item));
  item.addEventListener("animationend", () => item.remove());

  gameContainer.appendChild(item);
}

function handleItemClick(item) {
  if (!gameRunning || item.classList.contains("clicked")) return;

  item.classList.add("clicked");

  if (item.classList.contains("collectible")) {
    score += currentDifficulty.collectValue;
    updateScoreDisplay();
    flashScore("positive");
    setMessage("Fresh water secured! Keep going.", "positive");
    playSound("collect");
    createFeedbackBadge(item, `+${currentDifficulty.collectValue}`, "positive");
  } else {
    score = Math.max(0, score - currentDifficulty.missPenalty);
    updateScoreDisplay();
    flashScore("negative");
    setMessage("Obstacle spotted. Stay focused.", "negative");
    playSound("miss");
    createFeedbackBadge(item, `-${currentDifficulty.missPenalty}`, "negative");
  }

  item.remove();
  checkMilestones();

  if (score >= currentDifficulty.goal) {
    clearInterval(countdownTimer);
    clearInterval(itemTimer);
    gameRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "Play Again";
    resetBtn.disabled = false;
    setMessage("You saved enough water to win!", "positive");
    showOverlay("You win!", `Final score: ${score}`);
    playSound("win");
    createConfetti();
  }
}

function updateScoreDisplay() {
  scoreEl.textContent = score;
  goalEl.textContent = currentDifficulty.goal;
}

function flashScore(type) {
  scoreEl.classList.remove("score-positive", "score-negative");
  void scoreEl.offsetWidth;
  scoreEl.classList.add(type === "positive" ? "score-positive" : "score-negative");
  setTimeout(() => {
    scoreEl.classList.remove("score-positive", "score-negative");
  }, 300);
}

function setMessage(text, tone) {
  messageEl.textContent = text;
  messageEl.className = `game-message ${tone}`;
}

function showOverlay(title, details) {
  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  overlay.innerHTML = `<h2>${title}</h2><p>${details}</p>`;
  gameContainer.appendChild(overlay);
}

function createFeedbackBadge(item, text, type) {
  const badge = document.createElement("div");
  badge.className = `feedback-badge ${type}`;
  badge.textContent = text;
  badge.style.left = `${item.offsetLeft + 16}px`;
  badge.style.top = `${item.offsetTop + 10}px`;
  gameContainer.appendChild(badge);

  setTimeout(() => badge.remove(), 450);
}

function checkMilestones() {
  const milestoneMessages = [
    { threshold: 10, text: "Halfway there!" },
    { threshold: 20, text: "You’re making a real impact!" },
    { threshold: 30, text: "Final stretch!" }
  ];

  while (milestoneIndex < milestoneMessages.length && score >= milestoneMessages[milestoneIndex].threshold) {
    const milestone = milestoneMessages[milestoneIndex];
    setMessage(milestone.text, "positive");
    playSound("collect");
    milestoneIndex += 1;
  }
}

function createConfetti() {
  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#F5402C", "#8BD1CB"];

  for (let i = 0; i < 36; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDuration = `${2 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    gameContainer.appendChild(piece);
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playSound(type) {
  const sound = soundEffects[type];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {
      const context = ensureAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      const now = context.currentTime;
      let frequency = 440;
      let duration = 0.14;

      if (type === "collect") {
        frequency = 660;
        duration = 0.16;
      } else if (type === "miss") {
        frequency = 220;
        duration = 0.2;
      } else if (type === "win") {
        frequency = 880;
        duration = 0.3;
      } else if (type === "button") {
        frequency = 520;
        duration = 0.12;
      }

      oscillator.type = type === "miss" ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.03, now + duration);

      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    });
  }
}
