const gameContainer = document.getElementById("game-container");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const messageEl = document.getElementById("game-message");

let gameRunning = false;
let score = 0;
let timeLeft = 30;
let countdownTimer;
let itemTimer;

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  timeEl.textContent = timeLeft;
  setMessage("Collect the cans and keep the mission alive!", "neutral");

  startBtn.disabled = true;
  startBtn.textContent = "Game Running";
  resetBtn.disabled = false;

  gameContainer.querySelector(".game-instructions")?.remove();
  gameContainer.querySelectorAll(".game-item, .game-overlay, .confetti-piece").forEach((item) => item.remove());

  createItem();
  itemTimer = setInterval(createItem, 800);
  countdownTimer = setInterval(updateTimer, 1000);
}

function resetGame() {
  clearInterval(countdownTimer);
  clearInterval(itemTimer);
  gameRunning = false;

  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  timeEl.textContent = timeLeft;
  scoreEl.classList.remove("score-positive", "score-negative");
  setMessage("Press start to begin rescuing safe water cans.", "neutral");

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  resetBtn.disabled = true;

  gameContainer.querySelectorAll(".game-item, .game-overlay, .confetti-piece").forEach((item) => item.remove());

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

    const outcomeText = score >= 30 ? "You met the goal and saved enough water!" : "Time is up. Reset and try again.";
    setMessage(outcomeText, score >= 30 ? "positive" : "neutral");
    showOverlay(score >= 30 ? "You win!" : "Time is up", `Final score: ${score}`);
  }
}

function createItem() {
  if (!gameRunning) return;

  const item = document.createElement("button");
  item.type = "button";
  const isObstacle = Math.random() < 0.3;
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
    score += 5;
    updateScoreDisplay();
    flashScore("positive");
    setMessage("Fresh water secured! Keep going.", "positive");
  } else {
    score = Math.max(0, score - 3);
    updateScoreDisplay();
    flashScore("negative");
    setMessage("Obstacle spotted. Stay focused.", "negative");
  }

  item.remove();

  if (score >= 30) {
    clearInterval(countdownTimer);
    clearInterval(itemTimer);
    gameRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "Play Again";
    resetBtn.disabled = false;
    setMessage("You saved enough water to win!", "positive");
    showOverlay("You win!", `Final score: ${score}`);
    createConfetti();
  }
}

function updateScoreDisplay() {
  scoreEl.textContent = score;
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
