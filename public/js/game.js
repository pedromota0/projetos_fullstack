const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, asteroids, gameRunning, score;
let keys = {};
let intervalId;
let requestId;
let backgroundStars = [];
let bullets = [];

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space" && gameRunning) shoot();
});
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function startGame() {
  cancelAnimationFrame(requestId);
  clearInterval(intervalId);

  player = { x: 400, y: 250, size: 40, speed: 5, angle: 0, vx: 0, vy: 0 };
  asteroids = [];
  bullets = [];
  score = 0;
  gameRunning = true;
  keys = {};
  generateBackgroundStars();

  for (let i = 0; i < 5; i++) {
    spawnAsteroid();
  }

  intervalId = setInterval(() => {
    if (gameRunning) {
      score++;
      document.getElementById("score").textContent = `Tempo: ${score}s`;
      if (score % 5 === 0) {
        spawnAsteroid();
        increaseAsteroidSpeed();
      }
    }
  }, 1000);

  updateGame();
}

function shoot() {
  const tipX = player.x + player.size / 2 + Math.cos(player.angle) * (player.size / 2);
  const tipY = player.y + player.size / 2 + Math.sin(player.angle) * (player.size / 2);
  bullets.push({
    x: tipX,
    y: tipY,
    dx: Math.cos(player.angle) * 7,
    dy: Math.sin(player.angle) * 7,
    radius: 4,
  });
}

function spawnAsteroid() {
  const size = 30 + Math.random() * 30;
  const x = Math.random() < 0.5 ? 0 : canvas.width;
  const y = Math.random() * canvas.height;
  const speed = 1 + Math.random() * 1.5 + score / 20;
  const angle = 0;
  const rotationSpeed = (Math.random() - 0.5) * 0.02;
  const shape = generateAsteroidShape(size);

  asteroids.push({ x, y, size, speed, angle, rotationSpeed, shape });
}

function generateAsteroidShape(size) {
  const points = 7 + Math.floor(Math.random() * 4);
  const angleStep = (Math.PI * 2) / points;
  const shape = [];

  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radius = (size / 2) * (0.8 + Math.random() * 0.4);
    shape.push({ angle, radius });
  }

  return shape;
}

function increaseAsteroidSpeed() {
  for (let asteroid of asteroids) {
    asteroid.speed += 0.2;
  }
}

function generateBackgroundStars() {
  backgroundStars = [];
  for (let i = 0; i < 80; i++) {
    backgroundStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      speed: 0.1 + Math.random() * 0.2,
      color: ["#ffffff", "#aaccff", "#ffccaa"][Math.floor(Math.random() * 3)],
    });
  }
}

function updateGame() {
  if (!gameRunning) return;

  let vx = 0, vy = 0;
  if (keys["w"]) vy -= player.speed;
  if (keys["s"]) vy += player.speed;
  if (keys["a"]) vx -= player.speed;
  if (keys["d"]) vx += player.speed;

  player.vx = vx;
  player.vy = vy;
  player.x += vx;
  player.y += vy;

  // Atualiza rotação da nave se estiver se movendo
  if (vx !== 0 || vy !== 0) {
    player.angle = Math.atan2(vy, vx);
  }

  // Borda
  if (
    player.x <= 0 || player.x + player.size >= canvas.width ||
    player.y <= 0 || player.y + player.size >= canvas.height
  ) {
    endGame("Você saiu da zona segura!");
    return;
  }

  // Asteroides
  for (let i = asteroids.length - 1; i >= 0; i--) {
    let asteroid = asteroids[i];
    let dx = player.x + player.size / 2 - asteroid.x;
    let dy = player.y + player.size / 2 - asteroid.y;
    let dist = Math.hypot(dx, dy);
    asteroid.x += (dx / dist) * asteroid.speed;
    asteroid.y += (dy / dist) * asteroid.speed;
    asteroid.angle += asteroid.rotationSpeed;

    const playerRadius = player.size * 0.4;
    if (dist < asteroid.size / 2 + playerRadius) {
      endGame("Você foi atingido!");
      return;
    }

    // Colisão com tiro
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      let bDist = Math.hypot(b.x - asteroid.x, b.y - asteroid.y);
      if (bDist < asteroid.size / 2) {
        bullets.splice(j, 1);
        asteroids.splice(i, 1);
        break;
      }
    }
  }

  // Atualiza tiros
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  }

  draw();
  requestId = requestAnimationFrame(updateGame);
}

function draw() {
  drawSpaceBackground();
  drawPlayer();

  for (let asteroid of asteroids) {
    drawAsteroid(asteroid);
  }

  for (let b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
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

  // Motores com chama
  const flameSize = size / 4 + Math.random() * 2;
  ctx.beginPath();
  ctx.moveTo(-size / 6, size / 3);
  ctx.lineTo(-size / 6, size / 2 + flameSize);
  ctx.lineTo(0, size / 3 + flameSize);
  ctx.lineTo(size / 6, size / 2 + flameSize);
  ctx.lineTo(size / 6, size / 3);
  ctx.fillStyle = "orange";
  ctx.fill();

  // Corpo principal
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(-size / 3, size / 3);
  ctx.lineTo(0, size / 6);
  ctx.lineTo(size / 3, size / 3);
  ctx.closePath();
  ctx.fillStyle = "#00FFAA";
  ctx.fill();
  ctx.strokeStyle = "#007766";
  ctx.stroke();

  // Detalhe superior
  ctx.beginPath();
  ctx.moveTo(-size / 8, -size / 4);
  ctx.lineTo(0, -size / 2.5);
  ctx.lineTo(size / 8, -size / 4);
  ctx.closePath();
  ctx.fillStyle = "#33FFDD";
  ctx.fill();

  // Janela
  ctx.beginPath();
  ctx.arc(0, -size / 6, size / 8, 0, Math.PI * 2);
  ctx.fillStyle = "#88ddff";
  ctx.fill();
  ctx.strokeStyle = "#337799";
  ctx.stroke();

  ctx.restore();
}

function drawAsteroid(asteroid) {
  const { x, y, angle, shape } = asteroid;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  shape.forEach((point, index) => {
    const px = Math.cos(point.angle) * point.radius;
    const py = Math.sin(point.angle) * point.radius;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.closePath();

  ctx.fillStyle = "#996633";
  ctx.strokeStyle = "#442200";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSpaceBackground() {
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#120033");
  gradient.addColorStop(1, "#000010");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  backgroundStars.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) star.x = canvas.width;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.fill();
  });

  for (let i = 0; i < 3; i++) {
    const x = (canvas.width / 3) * i + 100 * Math.sin(Date.now() * 0.0002 + i);
    const y = (canvas.height / 2) + 80 * Math.cos(Date.now() * 0.0003 + i);
    const r = 100 + Math.random() * 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = ["#440055", "#332244", "#552255"][i % 3];
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function endGame(msg) {
  gameRunning = false;
  clearInterval(intervalId);
  alert(`${msg} Tempo sobrevivido: ${score}s`);
}

