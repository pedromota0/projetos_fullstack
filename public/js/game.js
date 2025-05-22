const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, asteroids, bullets, gameRunning, score;
let keys = {};
let intervalId;
let requestId;
let backgroundStars = [];

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space" && gameRunning) {
    shootBullet();
    e.preventDefault(); // impede scroll e reinício
  }
});

document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function startGame() {
  cancelAnimationFrame(requestId);
  clearInterval(intervalId);

  player = { x: 400, y: 250, size: 40, speed: 4, angle: 0, vx: 0, vy: 0 };
  asteroids = [];
  bullets = [];
  score = 0;
  gameRunning = true;
  keys = {};
  generateBackgroundStars();

  for (let i = 0; i < 10; i++) {
    spawnAsteroid();
  }

  intervalId = setInterval(() => {
    if (gameRunning) {
      score++;
      document.getElementById("score").textContent = `Tempo: ${score}s`;
      if (score % 5 === 0) {
        for (let i = 0; i < Math.floor(score / 10) + 1; i++) spawnAsteroid();
        asteroids.forEach(ast => ast.speed += 0.1);
      }
    }
  }, 1000);

  updateGame();
}

function spawnAsteroid() {
  const size = 30 + Math.random() * 30;
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  switch (edge) {
    case 0: x = 0; y = Math.random() * canvas.height; break;
    case 1: x = canvas.width; y = Math.random() * canvas.height; break;
    case 2: x = Math.random() * canvas.width; y = 0; break;
    case 3: x = Math.random() * canvas.width; y = canvas.height; break;
  }
  const speed = 1 + Math.random() * 1.5;
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

function shootBullet() {
  const bulletSpeed = 7;
  const angle = player.angle;
  const bx = player.x + player.size / 2 + Math.cos(angle) * player.size / 2;
  const by = player.y + player.size / 2 + Math.sin(angle) * player.size / 2;

  bullets.push({
    x: bx,
    y: by,
    vx: Math.cos(angle) * bulletSpeed,
    vy: Math.sin(angle) * bulletSpeed,
    radius: 4
  });
}

function generateBackgroundStars() {
  backgroundStars = [];
  for (let i = 0; i < 80; i++) {
    backgroundStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      speed: 0.1 + Math.random() * 0.2,
      color: ["#ffffff", "#aaccff", "#ffccaa"][Math.floor(Math.random() * 3)]
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

  if (vx !== 0 || vy !== 0) {
    player.angle = Math.atan2(vy, vx);
  }

  player.x += vx;
  player.y += vy;

  if (
    player.x <= 0 || player.x + player.size >= canvas.width ||
    player.y <= 0 || player.y + player.size >= canvas.height
  ) {
    endGame("Você saiu da zona segura!");
    return;
  }

  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
  for (let bullet of bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    const dx = player.x + player.size / 2 - a.x;
    const dy = player.y + player.size / 2 - a.y;
    const dist = Math.hypot(dx, dy);
    a.x += (dx / dist) * a.speed;
    a.y += (dy / dist) * a.speed;
    a.angle += a.rotationSpeed;

    const playerRadius = player.size * 0.4;
    if (dist < a.size / 2 + playerRadius) {
      endGame("Você foi atingido!");
      return;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist < a.size / 2) {
        asteroids.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  draw();
  requestId = requestAnimationFrame(updateGame);
}

function draw() {
  drawSpaceBackground();
  drawPlayer();
  asteroids.forEach(drawAsteroid);
  bullets.forEach(drawBullet);
}

function drawBullet(bullet) {
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

function drawPlayer() {
  const x = player.x + player.size / 2;
  const y = player.y + player.size / 2;
  const size = player.size;
  const angle = player.angle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Chama do motor
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
