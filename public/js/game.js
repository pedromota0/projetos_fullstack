// Pega o canvas e o contexto 2D para desenhar os elementos
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variáveis principais do jogo
let player, asteroids, bullets, gameRunning, score;
let keys = {};      // Objeto para controlar quais teclas estão pressionadas
let intervalId;     // ID do setInterval para o score
let requestId;      // ID do requestAnimationFrame para o loop principal
let backgroundStars = []; // Estrelas de fundo para dar efeito espacial

// Evento para tecla pressionada - marca tecla como true
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  // Se apertar espaço e o jogo estiver rodando, atira
  if (e.code === "Space" && gameRunning) {
    shootBullet();
    e.preventDefault(); // Evita scroll da página quando aperta espaço
  }
});

// Evento para tecla solta - marca tecla como false
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Função que inicia o jogo - reseta tudo e começa o loop
function startGame() {
  // Cancela animações e intervalos anteriores (para reiniciar)
  cancelAnimationFrame(requestId);
  clearInterval(intervalId);

  // Define o jogador com posição, tamanho, velocidade e ângulo inicial
  player = {
    x: canvas.width / 2 - 20,
    y: canvas.height / 2 - 20,
    size: 40,
    speed: 4,
    angle: 0,
  };

  asteroids = [];  // Lista de asteroides na tela
  bullets = [];    // Lista de tiros na tela
  score = 0;       // Tempo sobrevivido em segundos
  gameRunning = true;
  keys = {};       // Reseta teclas pressionadas
  generateBackgroundStars();  // Cria estrelas no fundo

  // Spawn inicial de 10 asteroides
  for (let i = 0; i < 10; i++) {
    spawnAsteroid();
  }

  // Intervalo que atualiza o score a cada segundo e aumenta dificuldade
  intervalId = setInterval(() => {
    if (gameRunning) {
      score++;
      document.getElementById("score").textContent = `Tempo: ${score}s`;

      // A cada 5 segundos, cria mais asteroides e aumenta velocidade deles
      if (score % 5 === 0) {
        for (let i = 0; i < Math.floor(score / 10) + 1; i++) {
          spawnAsteroid();
        }
        asteroids.forEach(ast => ast.speed += 0.1);
      }
    }
  }, 1000);

  // Começa o loop principal do jogo
  updateGame();
}

// Função para criar um asteroide em uma borda aleatória da tela
function spawnAsteroid() {
  const size = 30 + Math.random() * 30; // Tamanho entre 30 e 60
  const edge = Math.floor(Math.random() * 4); // 0=esquerda,1=direita,2=topo,3=baixo
  let x, y;

  switch (edge) {
    case 0: x = 0; y = Math.random() * canvas.height; break;
    case 1: x = canvas.width; y = Math.random() * canvas.height; break;
    case 2: x = Math.random() * canvas.width; y = 0; break;
    case 3: x = Math.random() * canvas.width; y = canvas.height; break;
  }

  const speed = 1 + Math.random() * 1.5; // Velocidade aleatória
  const rotationSpeed = (Math.random() - 0.5) * 0.02; // Rotação aleatória
  const shape = generateAsteroidShape(size); // Forma irregular

  asteroids.push({ x, y, size, speed, angle: 0, rotationSpeed, shape });
}

// Gera a forma irregular do asteroide (polígono com vértices aleatórios)
function generateAsteroidShape(size) {
  const points = 7 + Math.floor(Math.random() * 4); // 7 a 10 vértices
  const angleStep = (Math.PI * 2) / points;
  const shape = [];

  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radius = (size / 2) * (0.8 + Math.random() * 0.4);
    shape.push({ angle, radius });
  }

  return shape;
}

// Função para criar um tiro saindo da frente da nave (corrigido)
function shootBullet() {
  const bulletSpeed = 7;
  const angle = player.angle;

  // Posição do tiro na ponta da nave (frente)
  const bx = player.x + player.size / 2 + Math.cos(angle) * (player.size / 2);
  const by = player.y + player.size / 2 + Math.sin(angle) * (player.size / 2);

  bullets.push({
    x: bx,
    y: by,
    vx: Math.cos(angle) * bulletSpeed,
    vy: Math.sin(angle) * bulletSpeed,
    radius: 4
  });
}

// Cria as estrelas de fundo com posições, cores e velocidades aleatórias
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

// Loop principal do jogo: atualiza lógica e redesenha tudo
function updateGame() {
  if (!gameRunning) return;

  // Velocidade do jogador
  let vx = 0, vy = 0;

  // Atualiza velocidade conforme teclas W A S D
  if (keys["w"]) vy -= player.speed;
  if (keys["s"]) vy += player.speed;
  if (keys["a"]) vx -= player.speed;
  if (keys["d"]) vx += player.speed;

  // Atualiza ângulo da nave só se estiver se movendo
  if (vx !== 0 || vy !== 0) {
    player.angle = Math.atan2(vy, vx);
  }

  // Atualiza posição do jogador
  player.x += vx;
  player.y += vy;

  // Se o jogador sair da tela, termina o jogo
  if (
    player.x <= 0 || player.x + player.size >= canvas.width ||
    player.y <= 0 || player.y + player.size >= canvas.height
  ) {
    endGame("Você saiu da zona segura!");
    return;
  }

  // Atualiza posição dos tiros, removendo os que saíram da tela
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });

  // Atualiza asteroides e verifica colisões
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];

    // Distância do asteroide ao centro da nave
    const dx = player.x + player.size / 2 - a.x;
    const dy = player.y + player.size / 2 - a.y;
    const dist = Math.hypot(dx, dy);

    // Asteroide se move em direção à nave
    a.x += (dx / dist) * a.speed;
    a.y += (dy / dist) * a.speed;

    // Asteroide rotaciona
    a.angle += a.rotationSpeed;

    // Checa colisão nave-asteroide (círculos)
    const playerRadius = player.size * 0.4;
    if (dist < a.size / 2 + playerRadius) {
      endGame("Você foi atingido!");
      return;
    }

    // Checa colisão tiro-asteroide
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const distBullet = Math.hypot(b.x - a.x, b.y - a.y);
      if (distBullet < a.size / 2) {
        // Remove asteroide e tiro
        asteroids.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  // Desenha tudo no canvas
  draw();

  // Chama updateGame no próximo frame (loop infinito)
  requestId = requestAnimationFrame(updateGame);
}

// Desenha fundo, jogador, asteroides e tiros
function draw() {
  drawSpaceBackground();
  drawPlayer();
  asteroids.forEach(drawAsteroid);
  bullets.forEach(drawBullet);
}

// Desenha as estrelas de fundo
function drawSpaceBackground() {
  // Fundo preto
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Estrelas movem para baixo para efeito de movimento
  for (let star of backgroundStars) {
    ctx.beginPath();
    ctx.fillStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 4;
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();

    // Move a estrela para baixo e reseta no topo quando sair da tela
    star.y += star.speed;
    if (star.y > canvas.height) star.y = 0;
  }
}

// Desenha a nave do jogador como um triângulo apontando para o ângulo atual
function drawPlayer() {
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;
  const size = player.size;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.angle);

  // Corpo principal da nave (triângulo principal)
  ctx.fillStyle = "#0f0";      // verde principal
  ctx.strokeStyle = "#080";    // contorno verde escuro
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(-size / 2, size / 3);
  ctx.lineTo(-size / 2, -size / 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Adiciona uma "cabine" no centro, oval azul
  ctx.beginPath();
  ctx.fillStyle = "#00ccff"; // azul claro
  ctx.ellipse(0, 0, size / 5, size / 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Adiciona detalhes laterais - “asas”
  ctx.beginPath();
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 2;
  ctx.moveTo(-size / 2 + 5, size / 3);
  ctx.lineTo(-size / 2 + 15, size / 1.7);
  ctx.moveTo(-size / 2 + 5, -size / 3);
  ctx.lineTo(-size / 2 + 15, -size / 1.7);
  ctx.stroke();

  // Luzes de propulsão traseiras (triângulos laranja)
  ctx.fillStyle = "#ff6600";
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 10);
  ctx.lineTo(-size / 2 - size / 6, 0);
  ctx.lineTo(-size / 2, -size / 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}


// Desenha cada asteroide como polígono irregular
function drawAsteroid(ast) {
  ctx.save();
  ctx.translate(ast.x, ast.y);
  ctx.rotate(ast.angle);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#555";

  ctx.beginPath();
  // Começa pelo primeiro ponto
  const firstPoint = ast.shape[0];
  ctx.moveTo(firstPoint.radius * Math.cos(firstPoint.angle), firstPoint.radius * Math.sin(firstPoint.angle));
  // Desenha os outros pontos
  for (let i = 1; i < ast.shape.length; i++) {
    const p = ast.shape[i];
    ctx.lineTo(p.radius * Math.cos(p.angle), p.radius * Math.sin(p.angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Desenha cada tiro como um círculo branco com sombra
function drawBullet(bullet) {
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 10;
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
}

// Função chamada quando o jogo termina
function endGame(message) {
  gameRunning = false;
  clearInterval(intervalId);
  cancelAnimationFrame(requestId);

  alert(message + ` Seu tempo foi: ${score} segundos.`);
}

// Expose startGame para o botão iniciar
window.startGame = startGame;
