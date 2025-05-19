const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, asteroids, gameRunning, score;
let keys = {};
let intervalId;
let requestId;

document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function startGame() {
  cancelAnimationFrame(requestId);
  clearInterval(intervalId);

  player = { x: 400, y: 250, size: 40, speed: 5, angle: 0, vx: 0, vy: 0 };
  asteroids = [];
  score = 0;
  gameRunning = true;
  keys = {};

  for (let i = 0; i < 5; i++) {
    spawnAsteroid();
  }

  intervalId = setInterval(() => {
    if (gameRunning) {
      score++;
      document.getElementById("score").textContent = `Tempo: ${score}s`;
      if (score % 10 === 0) spawnAsteroid();
    }
  }, 1000);

  updateGame();
}

function spawnAsteroid() {
  const size = 20 + Math.random() * 20;
  const x = Math.random() < 0.5 ? 0 : canvas.width;
  const y = Math.random() * canvas.height;
  const speed = 1 + Math.random() * 2;

  asteroids.push({ x, y, size, speed });
}

function updateGame() {
  if (!gameRunning) return;

  // Atualiza velocidade do player com base nas teclas
  let vx = 0;
  let vy = 0;
  if (keys["w"]) vy -= player.speed;
  if (keys["s"]) vy += player.speed;
  if (keys["a"]) vx -= player.speed;
  if (keys["d"]) vx += player.speed;

  player.vx = vx;
  player.vy = vy;

  player.x += player.vx;
  player.y += player.vy;

  // Calcula ângulo para rotação, só se estiver se movendo
  if (vx !== 0 || vy !== 0) {
    player.angle = Math.atan2(vy, vx);
  }

  // Limitar dentro do canvas
  if (player.x < 0) player.x = 0;
  if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
  if (player.y < 0) player.y = 0;
  if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;

  // Colisões com asteroides
  for (let asteroid of asteroids) {
    let dx = player.x + player.size / 2 - asteroid.x;
    let dy = player.y + player.size / 2 - asteroid.y;
    let dist = Math.hypot(dx, dy);
    asteroid.x += (dx / dist) * asteroid.speed;
    asteroid.y += (dy / dist) * asteroid.speed;

    const playerRadius = player.size * 0.4;
    if (dist < asteroid.size / 2 + playerRadius) {
      endGame("Você foi atingido!");
      return;
    }
  }

  draw();
  requestId = requestAnimationFrame(updateGame);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();

  ctx.fillStyle = "red";
  for (let asteroid of asteroids) {
    ctx.beginPath();
    ctx.arc(asteroid.x, asteroid.y, asteroid.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const x = player.x + player.size / 2;
  const y = player.y + player.size / 2;
  const size = player.size;
  const angle = player.angle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Corpo principal (foguete)
  ctx.fillStyle = "#00FF00";
  ctx.beginPath();
  // Corpo com base arredondada
  ctx.moveTo(-size / 6, size / 3);
  ctx.lineTo(-size / 6, -size / 3);
  ctx.quadraticCurveTo(0, -size / 2, size / 6, -size / 3);
  ctx.lineTo(size / 6, size / 3);
  ctx.closePath();
  ctx.fill();

  // Nariz do foguete (triângulo para cima)
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(-size / 8, -size / 3);
  ctx.lineTo(size / 8, -size / 3);
  ctx.closePath();
  ctx.fillStyle = "#00CC00";
  ctx.fill();

  // Asa esquerda
  ctx.beginPath();
  ctx.moveTo(-size / 6, 0);
  ctx.lineTo(-size / 3, size / 6);
  ctx.lineTo(-size / 6, size / 3);
  ctx.closePath();
  ctx.fillStyle = "#009900";
  ctx.fill();

  // Asa direita
  ctx.beginPath();
  ctx.moveTo(size / 6, 0);
  ctx.lineTo(size / 3, size / 6);
  ctx.lineTo(size / 6, size / 3);
  ctx.closePath();
  ctx.fillStyle = "#009900";
  ctx.fill();

  // Janela circular
  ctx.beginPath();
  ctx.arc(0, 0, size / 10, 0, Math.PI * 2);
  ctx.fillStyle = "#88FF88";
  ctx.fill();
  ctx.strokeStyle = "#005500";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function endGame(msg) {
  gameRunning = false;
  clearInterval(intervalId);
  alert(`${msg} Tempo sobrevivido: ${score}s`);
}
