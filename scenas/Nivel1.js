class Nivel1 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel1" });
    this.currentPhase = 1;
    this.score = 0;
    this.phaseProgress = 0; // 0 a 100
  }

  preload() {
    // Cargar sonidos existentes (preferir .wav ya que los .mp3 parecen dañados)
    this.load.audio("error", [
      "assets/sounds/error.wav",
      "assets/sounds/error.mp3",
    ]);
    this.load.audio("success", [
      "assets/sounds/success.wav",
      "assets/sounds/success.mp3",
    ]);
    this.load.audio("win", ["assets/sounds/win.wav", "assets/sounds/win.mp3"]);

    // Cargar imagen de fondo volcánico si existe, si no usaremos gráficos
    this.load.image("volcano_bg", "assets/scenaPrincipal/1.jpg");
  }

  playSound(key) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key);
    } else {
      console.warn(
        `Audio key "${key}" missing from cache or failed to decode.`,
      );
    }
  }

  create() {
    this.screenWidth = this.sys.game.config.width;
    this.screenHeight = this.sys.game.config.height;

    // Colores
    this.colors = {
      volcanoRed: 0xff4500,
      lavaOrange: 0xff6622,
      black: 0x0d0000,
      ashGray: 0x2a1a00,
      magmaSpark: 0xffa500,
      successGreen: 0x00ff00,
      errorRed: 0xff0000,
    };

    this.createBackground();
    this.createHUD();
    // this.createRobot(); // Eliminado según solicitud del usuario
    this.createParticles();

    // Música de fondo
    this.musicManager = MusicManager.getInstance();
    // La música ya debería estar sonando si viene de scenaVideo,
    // pero nos aseguramos de que sea la correcta si es necesario.

    // Iniciar Fase 1
    this.startPhase1();
  }

  createBackground() {
    // Fondo base con imagen oscurecida para dar profundidad
    const bgImg = this.add.image(
      this.screenWidth / 2,
      this.screenHeight / 2,
      "volcano_bg",
    );
    bgImg.setDisplaySize(this.screenWidth, this.screenHeight);
    bgImg.setTint(0x331100); // Tinte rojizo oscuro

    // Overlay de gradiente para mejorar la atmósfera
    const bgOverlay = this.add.graphics();
    bgOverlay.fillGradientStyle(0x050000, 0x050000, 0x1a0a00, 0x1a0a00, 0.7);
    bgOverlay.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // Añadir algunas "nubes de ceniza" lejanas
    this.ashClouds = [];
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.graphics();
      cloud.fillStyle(0x2a1a00, 0.3);
      cloud.fillEllipse(0, 0, 300, 150);
      cloud.x = Math.random() * this.screenWidth;
      cloud.y = Math.random() * this.screenHeight;
      this.ashClouds.push(cloud);

      this.tweens.add({
        targets: cloud,
        x: cloud.x + (Math.random() - 0.5) * 200,
        y: cloud.y + (Math.random() - 0.5) * 100,
        duration: 10000 + Math.random() * 5000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Efecto de distorsión de calor (Heat Haze) simulado con líneas sutiles
    this.heatHaze = this.add.graphics();

    // Lava animada mejorada (varias capas)
    this.lavaLayers = [
      { color: 0x882200, offset: 0, speed: 0.03, height: 60 },
      { color: 0xff4400, offset: Math.PI, speed: 0.05, height: 45 },
      { color: 0xffaa00, offset: Math.PI / 2, speed: 0.07, height: 30 },
    ];
    this.lavaGraphics = this.add.graphics();
    this.lavaPhase = 0;
  }

  update(time, delta) {
    // Animar lava
    this.lavaPhase += 0.05;
    this.lavaGraphics.clear();

    this.lavaLayers.forEach((layer) => {
      this.lavaGraphics.fillStyle(layer.color, 0.6);
      this.lavaGraphics.beginPath();
      this.lavaGraphics.moveTo(0, this.screenHeight);
      for (let x = 0; x <= this.screenWidth; x += 25) {
        const wave1 =
          Math.sin(
            this.lavaPhase * layer.speed * 10 + x * 0.01 + layer.offset,
          ) * 10;
        const wave2 = Math.cos(this.lavaPhase * layer.speed * 5 + x * 0.02) * 5;
        const y = this.screenHeight - layer.height + wave1 + wave2;
        this.lavaGraphics.lineTo(x, y);
      }
      this.lavaGraphics.lineTo(this.screenWidth, this.screenHeight);
      this.lavaGraphics.closePath();
      this.lavaGraphics.fillPath();
    });

    // Heat haze sutil
    this.heatHaze.clear();
    this.heatHaze.lineStyle(1, 0xff6600, 0.05);
    for (let i = 0; i < 5; i++) {
      const h = Math.sin(time * 0.002 + i) * 10;
      this.heatHaze.strokeLineShape(
        new Phaser.Geom.Line(
          0,
          100 + i * 80 + h,
          this.screenWidth,
          100 + i * 80 + h,
        ),
      );
    }

    // Destellos de magma ocasionales
    if (Math.random() > 0.95) {
      this.lavaGraphics.fillStyle(this.colors.magmaSpark, 1);
      const sparkX = Math.random() * this.screenWidth;
      const sparkY = this.screenHeight - 20 - Math.random() * 40;
      const circle = this.lavaGraphics.fillCircle(
        sparkX,
        sparkY,
        Math.random() * 3,
      );

      this.tweens.add({
        targets: circle,
        alpha: 0,
        y: sparkY - 50,
        duration: 1000,
        ease: "Power2",
      });
    }
  }

  createHUD() {
    const headerStyle = {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: "16px",
      color: "#FFA500",
      stroke: "#000000",
      strokeThickness: 2,
    };

    // Fondo HUD más realista con gradiente y bordes metálicos
    const hudBg = this.add.graphics();
    hudBg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x000000, 0x000000, 0.9);
    hudBg.fillRect(0, 0, this.screenWidth, 65);

    // Línea de borde inferior con brillo
    hudBg.lineStyle(2, 0xff4500, 1);
    hudBg.strokeLineShape(new Phaser.Geom.Line(0, 65, this.screenWidth, 65));
    hudBg.lineStyle(1, 0xffaa00, 0.5);
    hudBg.strokeLineShape(new Phaser.Geom.Line(0, 63, this.screenWidth, 63));

    // Textos HUD
    this.add.text(20, 12, "PLANETA: FERROX", headerStyle);
    this.phaseText = this.add.text(20, 36, "FASE: 1/3 - DIAGNÓSTICO", {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: "14px",
      color: "#ffffff",
    });

    this.scoreText = this.add.text(
      this.screenWidth - 180,
      12,
      "SCORE: 0000",
      headerStyle,
    );
    this.add.text(this.screenWidth - 180, 36, "PROGRESS:", {
      ...headerStyle,
      fontSize: "12px",
    });

    // Barra de progreso con diseño más realista
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x222222, 1);
    this.progressBarBg.lineStyle(1, 0x444444, 1);
    this.progressBarBg.fillRoundedRect(this.screenWidth - 85, 38, 70, 12, 4);
    this.progressBarBg.strokeRoundedRect(this.screenWidth - 85, 38, 70, 12, 4);

    this.progressBar = this.add.graphics();
    this.updateProgressBar();
  }

  updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0xff4500, 1);
    // Efecto de brillo en la barra
    const progressWidth = (this.phaseProgress / 100) * 70;
    if (progressWidth > 0) {
      this.progressBar.fillRoundedRect(
        this.screenWidth - 85,
        38,
        progressWidth,
        12,
        4,
      );
      this.progressBar.fillStyle(0xffffff, 0.3);
      this.progressBar.fillRect(this.screenWidth - 85, 38, progressWidth, 4);
    }
  }

  updateScore(points) {
    this.score += points;
    const formattedScore = this.score.toString().padStart(4, "0");
    this.scoreText.setText(`SCORE: ${formattedScore}`);
  }

  safePlay(key) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key);
    }
  }

  createRobot() {
    this.robotContainer = this.add.container(100, 400);
    const robotImg = this.add.image(0, 0, "robot").setScale(0.3);
    this.robotContainer.add(robotImg);

    // Animación idle (flotando)
    this.tweens.add({
      targets: this.robotContainer,
      y: 380,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createParticles() {
    // Partículas de ceniza cayendo (Sintaxis compatible con Phaser 3.55.2)
    const ashParticles = this.add.particles("ash");

    ashParticles.createEmitter({
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, -100, this.screenWidth, 1),
      },
      speedY: { min: 50, max: 100 },
      speedX: { min: -20, max: 20 },
      lifespan: 8000,
      quantity: 1,
      scale: { min: 0.1, max: 0.3 },
      alpha: { start: 0.6, end: 0 },
      blendMode: "ADD",
    });

    // Crear una pequeña textura para la ceniza si no existe
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xaaaaaa);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("ash", 8, 8);
  }

  // --- MÉTODOS DE FASE 1 (QUIZ) ---
  startPhase1() {
    this.currentPhase = 1;
    this.phaseProgress = 0;
    this.updateProgressBar();
    this.phaseText.setText("FASE: 1/3 - DIAGNÓSTICO");

    this.quizData = [
      {
        q: "¿Qué componente convierte energía eléctrica en movimiento mecánico en un sistema robótico?",
        options: [
          "Sensor infrarrojo",
          "Motor actuador",
          "Microprocesador central",
          "Celda de combustible",
        ],
        correct: 1,
        explanation:
          "Los motores actuadores transforman señales eléctricas en torque mecánico. Son el músculo del robot.",
      },
      {
        q: "Un robot tiene 6 articulaciones independientes. ¿Cuántos grados de libertad (DOF) posee?",
        options: ["3 DOF", "12 DOF", "6 DOF", "Depende del fabricante"],
        correct: 2,
        explanation:
          "Cada articulación independiente aporta 1 DOF. 6 articulaciones = 6 DOF. Los brazos robóticos industriales suelen tener exactamente 6.",
      },
      {
        q: "¿Cuál es la diferencia entre un servo motor y un motor DC estándar en robótica de precisión?",
        options: [
          "El servo es más barato",
          "El servo no necesita controlador",
          "El servo incluye control de posición por retroalimentación",
          "El motor DC es más preciso",
        ],
        correct: 2,
        explanation:
          "El servo motor integra un encoder y un controlador PID interno que permite posicionamiento exacto, a diferencia del motor DC básico que solo controla velocidad.",
      },
    ];

    this.currentQuestionIdx = 0;
    this.showQuestion();
  }

  showQuestion() {
    const data = this.quizData[this.currentQuestionIdx];

    // Contenedor de la pregunta
    this.questionContainer = this.add.container(this.screenWidth / 2, -200);

    const title = this.add
      .text(0, 0, "DIAGNÓSTICO DEL SISTEMA — MOVIMIENTO ROBÓTICO", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "22px",
        color: "#FF4500",
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const questionText = this.add
      .text(0, 60, data.q, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "20px",
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: 700 },
      })
      .setOrigin(0.5);

    this.questionContainer.add([title, questionText]);

    // Botones de opciones
    this.optionButtons = [];
    data.options.forEach((opt, idx) => {
      const btn = this.createOptionButton(
        0,
        160 + idx * 65, // Aumentado espacio entre botones
        opt,
        idx === data.correct,
      );
      this.questionContainer.add(btn);
      this.optionButtons.push(btn);
    });

    // Animación de entrada
    this.tweens.add({
      targets: this.questionContainer,
      y: 120,
      duration: 500,
      ease: "Back.easeOut",
    });
  }

  createOptionButton(x, y, text, isCorrect) {
    const btn = this.add.container(x, y);

    const width = 600; // Un poco más ancho para evitar desbordamiento
    const height = 50; // Un poco más alto

    // Sombra/Brillo exterior
    const glow = this.add.graphics();
    glow.fillStyle(this.colors.volcanoRed, 0.15);
    glow.fillRoundedRect(
      -width / 2 - 5,
      -height / 2 - 5,
      width + 10,
      height + 10,
      8,
    );
    glow.setAlpha(0);

    const bg = this.add.graphics();
    this.drawButtonBg(bg, width, height, 0x1a0a00, 0x666666);

    const txt = this.add
      .text(0, 0, text, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "16px", // Reducido un poco para mayor seguridad
        color: "#CCCCCC",
        fontStyle: "600",
        wordWrap: { width: width - 40 },
        align: "center",
      })
      .setOrigin(0.5);

    btn.add([glow, bg, txt]);

    // Interactividad
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains,
    );

    bg.on("pointerover", () => {
      this.tweens.add({ targets: glow, alpha: 1, duration: 200 });
      this.drawButtonBg(bg, width, height, 0x331100, this.colors.magmaSpark);
      txt.setColor("#FFFFFF");
      this.safePlay("click");
    });

    bg.on("pointerout", () => {
      this.tweens.add({ targets: glow, alpha: 0, duration: 200 });
      this.drawButtonBg(bg, width, height, 0x1a0a00, 0x666666);
      txt.setColor("#CCCCCC");
    });

    bg.on("pointerdown", () => {
      this.handleAnswer(isCorrect, bg, txt, glow);
    });

    return btn;
  }

  drawButtonBg(graphics, width, height, fillColor, strokeColor) {
    graphics.clear();
    graphics.fillStyle(fillColor, 0.9);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    // Detalles sci-fi (esquinas)
    graphics.lineStyle(4, strokeColor, 1);
    graphics.beginPath();
    graphics.moveTo(-width / 2, -height / 2 + 10);
    graphics.lineTo(-width / 2, -height / 2);
    graphics.lineTo(-width / 2 + 10, -height / 2);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(width / 2, height / 2 - 10);
    graphics.lineTo(width / 2, height / 2);
    graphics.lineTo(width / 2 - 10, height / 2);
    graphics.strokePath();
  }

  handleAnswer(isCorrect, btnBg, btnTxt, glow) {
    if (this.isAnswering) return;

    if (isCorrect) {
      this.isAnswering = true;
      this.safePlay("success");

      this.drawButtonBg(btnBg, 550, 45, 0x004400, 0x00ff00);
      btnTxt.setColor("#FFFFFF");
      glow.clear();
      glow.fillStyle(0x00ff00, 0.3);
      glow.fillRoundedRect(-550 / 2 - 5, -45 / 2 - 5, 560, 55, 8);
      glow.setAlpha(1);

      this.updateScore(100);
      this.showSparks(this.screenWidth / 2, this.screenHeight / 2);

      // Mostrar explicación en un recuadro interactivo
      this.showQuizFeedback(true);
    } else {
      // Incorrecto - Animación roja y permitir reintento
      this.safePlay("error");
      this.cameras.main.shake(200, 0.01);

      this.drawButtonBg(btnBg, 550, 45, 0x440000, 0xff0000);
      btnTxt.setColor("#FF8888");

      this.tweens.add({
        targets: [btnBg, btnTxt],
        x: "+=10",
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          // Volver al estado normal para reintento
          this.time.delayedCall(500, () => {
            this.drawButtonBg(btnBg, 550, 45, 0x1a0a00, 0x666666);
            btnTxt.setColor("#CCCCCC");
          });
        },
      });
    }
  }

  showQuizFeedback(isCorrect) {
    const data = this.quizData[this.currentQuestionIdx];

    // Contenedor del modal
    this.feedbackModal = this.add.container(
      this.screenWidth / 2,
      this.screenHeight / 2,
    );
    this.feedbackModal.setDepth(1000);
    this.feedbackModal.setAlpha(0);

    // Fondo oscuro que bloquea clics traseros
    const blocker = this.add.graphics();
    blocker.fillStyle(0x000000, 0.8);
    blocker.fillRect(
      -this.screenWidth / 2,
      -this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
    );
    blocker.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.screenWidth / 2,
        -this.screenHeight / 2,
        this.screenWidth,
        this.screenHeight,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    // Recuadro del mensaje
    const box = this.add.graphics();
    box.fillStyle(0x1a0a00, 1);
    box.lineStyle(4, isCorrect ? 0x00ff00 : 0xff0000, 1);
    box.fillRoundedRect(-300, -150, 600, 300, 15);
    box.strokeRoundedRect(-300, -150, 600, 300, 15);

    // Título
    const titleText = isCorrect ? "¡CORRECTO!" : "INCORRECTO";
    const title = this.add
      .text(0, -110, titleText, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "28px",
        color: isCorrect ? "#00FF00" : "#FF0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Texto de explicación
    const explanation = this.add
      .text(0, 0, data.explanation, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "18px",
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5);

    // Mensaje para continuar
    const footer = this.add
      .text(0, 110, "HAZ CLIC PARA CONTINUAR", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "14px",
        color: "#FFA500",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: footer,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.feedbackModal.add([blocker, box, title, explanation, footer]);

    // Animación de entrada
    this.tweens.add({
      targets: this.feedbackModal,
      alpha: 1,
      duration: 300,
    });

    // Clic para cerrar y pasar a lo siguiente
    blocker.on("pointerdown", () => {
      this.tweens.add({
        targets: this.feedbackModal,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.feedbackModal.destroy();
          this.isAnswering = false;

          // Transición a la siguiente pregunta o fase
          this.tweens.add({
            targets: this.questionContainer,
            y: -500,
            duration: 500,
            onComplete: () => {
              this.questionContainer.destroy();
              this.currentQuestionIdx++;
              this.phaseProgress =
                (this.currentQuestionIdx / this.quizData.length) * 100;
              this.updateProgressBar();

              if (this.currentQuestionIdx < this.quizData.length) {
                this.showQuestion();
              } else {
                this.startPhase2Transition();
              }
            },
          });
        },
      });
    });
  }

  showSparks(x, y) {
    const sparks = this.add.particles("ash");
    const emitter = sparks.createEmitter({
      x: x,
      y: y,
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      gravityY: 200,
      quantity: 20,
      tint: 0x00ff00,
      on: false, // No emitir continuamente
    });

    emitter.explode(20);
    this.time.delayedCall(1000, () => sparks.destroy());
  }

  startPhase2Transition() {
    this.showRepairComplete(() => {
      this.startPhase2();
    });
  }

  showRepairComplete(callback) {
    const text = this.add
      .text(this.screenWidth / 2, this.screenHeight / 2, "SISTEMA RESTAURADO", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "42px",
        color: "#00FF00",
        stroke: "#000000",
        strokeThickness: 6,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0)
      .setAlpha(0);

    this.safePlay("win");

    this.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      duration: 800,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => {
              text.destroy();
              if (callback) callback();
            },
          });
        });
      },
    });
  }

  // --- MÉTODOS DE FASE 2 (DRAG & DROP) ---
  startPhase2() {
    this.currentPhase = 2;
    this.phaseProgress = 0;
    this.updateProgressBar();
    this.phaseText.setText("FASE: 2/3 - RECONSTRUCCIÓN");

    this.puzzleTitle = this.add
      .text(this.screenWidth / 2, 85, "RECONSTRUCCIÓN — CADENA CINEMÁTICA", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "20px",
        color: "#FF4500",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const components = [
      { id: 1, name: "Actuador", desc: "Genera torque rotacional" },
      { id: 2, name: "Encoder", desc: "Mide posición y velocidad" },
      { id: 3, name: "Controlador PID", desc: "Compara señal y corrige error" },
      { id: 4, name: "Efector Final", desc: "Ejecuta la acción en el entorno" },
    ];

    this.slots = [];
    this.pieces = [];
    this.hintsUsed = 0;
    this.completedPieces = 0;

    // Crear Slots
    components.forEach((comp, idx) => {
      const x = 200 + idx * 200;
      const y = 200;

      const slot = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.4);
      bg.lineStyle(2, 0x444444, 1);
      bg.fillRoundedRect(-80, -40, 160, 80, 10);
      bg.strokeRoundedRect(-80, -40, 160, 80, 10);

      // Brillo interno sutil
      bg.lineStyle(1, 0x666666, 0.5);
      bg.strokeRoundedRect(-75, -35, 150, 70, 8);

      const num = this.add
        .text(0, 0, (idx + 1).toString(), {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "40px",
          color: "#222222",
        })
        .setOrigin(0.5);

      slot.add([bg, num]);
      slot.componentId = comp.id;
      this.slots.push(slot);
    });

    // Crear Piezas (posiciones aleatorias en la parte inferior)
    const shuffled = [...components].sort(() => Math.random() - 0.5);
    shuffled.forEach((comp, idx) => {
      const x = 200 + idx * 200;
      const y = 400;

      const piece = this.add.container(x, y);
      const bg = this.add.graphics();
      this.drawPieceBg(bg, 160, 80, 0x2a1a00, this.colors.volcanoRed);

      const nameTxt = this.add
        .text(0, -15, comp.name, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "14px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const descTxt = this.add
        .text(0, 15, comp.desc, {
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "12px",
          color: "#FFA500",
          align: "center",
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5);

      piece.add([bg, nameTxt, descTxt]);
      piece.componentId = comp.id;
      piece.originalX = x;
      piece.originalY = y;

      // Hacer interactiva la pieza completa
      bg.setInteractive(
        new Phaser.Geom.Rectangle(-80, -40, 160, 80),
        Phaser.Geom.Rectangle.Contains,
      );
      this.input.setDraggable(bg);

      bg.on("dragstart", (pointer) => {
        this.children.bringToTop(piece);
        this.drawPieceBg(bg, 160, 80, 0x442200, this.colors.magmaSpark);
        // Guardar el offset inicial para corregir el salto al arrastrar
        piece.dragOffsetX = piece.x - pointer.x;
        piece.dragOffsetY = piece.y - pointer.y;
      });

      bg.on("drag", (pointer) => {
        // Usar el puntero directamente con el offset guardado para evitar saltos
        piece.x = pointer.x + piece.dragOffsetX;
        piece.y = pointer.y + piece.dragOffsetY;
      });

      bg.on("dragend", () => {
        // Verificar colisión con slots
        let placed = false;
        this.slots.forEach((slot) => {
          const dist = Phaser.Math.Distance.Between(
            piece.x,
            piece.y,
            slot.x,
            slot.y,
          );
          if (dist < 60) {
            if (slot.componentId === piece.componentId) {
              // Correcto
              piece.x = slot.x;
              piece.y = slot.y;
              this.input.setDraggable(bg, false);
              this.safePlay("success");
              this.showSparks(piece.x, piece.y);
              this.completedPieces++;
              placed = true;

              bg.clear();
              bg.fillStyle(0x004400, 0.9);
              bg.lineStyle(2, 0x00ff00, 1);
              bg.fillRoundedRect(-80, -40, 160, 80, 10);
              bg.strokeRoundedRect(-80, -40, 160, 80, 10);

              this.phaseProgress = (this.completedPieces / 4) * 100;
              this.updateProgressBar();

              if (this.completedPieces === 4) {
                this.completePhase2();
              }
            } else {
              // Incorrecto
              this.safePlay("error");
              this.cameras.main.shake(200, 0.01);
            }
          }
        });

        if (!placed) {
          this.tweens.add({
            targets: piece,
            x: piece.originalX,
            y: piece.originalY,
            duration: 500,
            ease: "Back.easeOut",
          });
          this.drawPieceBg(bg, 160, 80, 0x2a1a00, this.colors.volcanoRed);
        }
      });

      this.pieces.push(piece);
    });

    // Botón de pista
    this.createHintButton();
  }

  drawPieceBg(graphics, width, height, fillColor, strokeColor) {
    graphics.clear();
    graphics.fillStyle(fillColor, 0.9);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

    // Detalle de tornillos en las esquinas
    graphics.fillStyle(0x666666, 1);
    const s = 4;
    graphics.fillCircle(-width / 2 + 10, -height / 2 + 10, s);
    graphics.fillCircle(width / 2 - 10, -height / 2 + 10, s);
    graphics.fillCircle(-width / 2 + 10, height / 2 - 10, s);
    graphics.fillCircle(width / 2 - 10, height / 2 - 10, s);
  }

  createHintButton() {
    this.hintBtn = this.add.container(this.screenWidth - 100, 450);
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-60, -20, 120, 40, 5);
    bg.strokeRoundedRect(-60, -20, 120, 40, 5);

    const txt = this.add
      .text(0, 0, "HINT (-50)", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "12px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    this.hintBtn.add([bg, txt]);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    bg.on("pointerdown", () => {
      if (this.score >= 50) {
        this.updateScore(-50);
        this.hintsUsed++;
        this.showHint();
      }
    });
  }

  showHint() {
    // Encontrar una pieza no colocada
    const pendingPiece = this.pieces.find((p) => p.input && p.input.draggable);
    if (pendingPiece) {
      const correctSlot = this.slots.find(
        (s) => s.componentId === pendingPiece.componentId,
      );
      const highlight = this.add.graphics();
      highlight.lineStyle(4, 0x00ff00, 1);
      highlight.strokeRoundedRect(
        correctSlot.x - 85,
        correctSlot.y - 45,
        170,
        90,
        10,
      );

      this.time.delayedCall(2000, () => highlight.destroy());
    }
  }

  completePhase2() {
    // Animación de energía fluyendo
    const energyLine = this.add.graphics();
    energyLine.lineStyle(4, 0x00ffff, 1);
    energyLine.beginPath();
    energyLine.moveTo(this.slots[0].x, this.slots[0].y);
    for (let i = 1; i < 4; i++)
      energyLine.lineTo(this.slots[i].x, this.slots[i].y);
    energyLine.strokePath();
    energyLine.setAlpha(0);

    this.tweens.add({
      targets: energyLine,
      alpha: 1,
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        const points =
          this.hintsUsed === 0 ? 150 : this.hintsUsed === 1 ? 100 : 75;
        this.updateScore(points);

        this.time.delayedCall(1000, () => {
          // Limpiar fase 2
          this.puzzleTitle.destroy();
          this.hintBtn.destroy();
          this.slots.forEach((s) => s.destroy());
          this.pieces.forEach((p) => p.destroy());
          energyLine.destroy();

          this.showRepairComplete(() => {
            this.startPhase3();
          });
        });
      },
    });
  }

  // --- MÉTODOS DE FASE 3 (GRID) ---
  startPhase3() {
    this.currentPhase = 3;
    this.phaseProgress = 0;
    this.updateProgressBar();
    this.phaseText.setText("FASE: 3/3 - REPROGRAMACIÓN");

    this.gridTitle = this.add
      .text(
        this.screenWidth / 2,
        85,
        "REPROGRAMACIÓN — RUTA DE NAVEGACIÓN AUTÓNOMA",
        {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "20px",
          color: "#FF4500",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);

    this.gridSize = { cols: 8, rows: 6 };
    this.cellSize = 50; // Aumentado para mejor visibilidad
    this.gridOffset = { x: 150, y: 130 };

    this.robotPos = { x: 0, y: 5 }; // [0,5]
    this.targetPos = { x: 7, y: 0 }; // [7,0]

    // Circuito más difícil con más obstáculos
    this.obstacles = [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 4 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 3, y: 5 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 7, y: 2 },
    ];

    this.commandQueue = [];
    this.maxCommands = 15; // Aumentado para el nuevo circuito
    this.attempts = 1;

    this.createGrid();
    this.createCommandUI();

    this.placeRobotOnGrid();
    this.placeTargetOnGrid();
    this.placeObstaclesOnGrid();
    this.createGridEnvironment();
  }

  createGridEnvironment() {
    // Pequeñas chispas/brasas que flotan sobre el grid para realismo
    const embers = this.add.particles("ash");
    embers.setDepth(5); // Por encima del grid pero debajo de los menús

    embers.createEmitter({
      emitZone: {
        source: new Phaser.Geom.Rectangle(
          this.gridOffset.x,
          this.gridOffset.y,
          this.gridSize.cols * this.cellSize,
          this.gridSize.rows * this.cellSize,
        ),
      },
      speedY: { min: -20, max: -50 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xffaa00,
      lifespan: 2000,
      quantity: 1,
      frequency: 300,
      blendMode: "ADD",
    });
  }

  createGrid() {
    this.gridGraphics = this.add.graphics();

    // Marco exterior de alta tecnología
    const padding = 10;
    this.gridGraphics.lineStyle(2, 0x00ff00, 0.3);
    this.gridGraphics.strokeRoundedRect(
      this.gridOffset.x - padding,
      this.gridOffset.y - padding,
      this.gridSize.cols * this.cellSize + padding * 2,
      this.gridSize.rows * this.cellSize + padding * 2,
      15,
    );

    // Fondo del tablero con textura de microcircuito
    this.gridGraphics.fillStyle(0x051505, 0.8);
    this.gridGraphics.fillRoundedRect(
      this.gridOffset.x,
      this.gridOffset.y,
      this.gridSize.cols * this.cellSize,
      this.gridSize.rows * this.cellSize,
      5,
    );

    // Líneas del grid con efecto de "bus de datos"
    for (let i = 0; i <= this.gridSize.cols; i++) {
      const x = this.gridOffset.x + i * this.cellSize;
      const isEdge = i === 0 || i === this.gridSize.cols;
      this.gridGraphics.lineStyle(
        isEdge ? 2 : 1,
        0x00ff00,
        isEdge ? 0.5 : 0.15,
      );
      this.gridGraphics.strokeLineShape(
        new Phaser.Geom.Line(
          x,
          this.gridOffset.y,
          x,
          this.gridOffset.y + this.gridSize.rows * this.cellSize,
        ),
      );

      // Nodos en las intersecciones
      if (!isEdge) {
        for (let j = 1; j < this.gridSize.rows; j++) {
          this.gridGraphics.fillStyle(0x00ff00, 0.2);
          this.gridGraphics.fillCircle(
            x,
            this.gridOffset.y + j * this.cellSize,
            2,
          );
        }
      }
    }
    for (let j = 0; j <= this.gridSize.rows; j++) {
      const y = this.gridOffset.y + j * this.cellSize;
      const isEdge = j === 0 || j === this.gridSize.rows;
      this.gridGraphics.lineStyle(
        isEdge ? 2 : 1,
        0x00ff00,
        isEdge ? 0.5 : 0.15,
      );
      this.gridGraphics.strokeLineShape(
        new Phaser.Geom.Line(
          this.gridOffset.x,
          y,
          this.gridOffset.x + this.gridSize.cols * this.cellSize,
          y,
        ),
      );
    }

    // Efecto de escaneo (holograma)
    this.scanLine = this.add.graphics();
    this.scanLine.lineStyle(2, 0x00ff00, 0.3);
    this.scanLine.strokeLineShape(
      new Phaser.Geom.Line(
        this.gridOffset.x,
        this.gridOffset.y,
        this.gridOffset.x + this.gridSize.cols * this.cellSize,
        this.gridOffset.y,
      ),
    );

    this.tweens.add({
      targets: this.scanLine,
      y: this.gridSize.rows * this.cellSize,
      duration: 3000,
      repeat: -1,
      yoyo: false,
      ease: "Linear",
    });
  }

  placeRobotOnGrid() {
    if (this.gridRobot) this.gridRobot.destroy();

    const x =
      this.gridOffset.x + this.robotPos.x * this.cellSize + this.cellSize / 2;
    const y =
      this.gridOffset.y + this.robotPos.y * this.cellSize + this.cellSize / 2;

    this.gridRobot = this.add.container(x, y);

    // Sombra del robot
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillEllipse(0, 18, 35, 15);

    // Diseño de Rover mecánico realista
    const roverBody = this.add.graphics();

    // Chasis principal
    roverBody.fillStyle(0x444444, 1);
    roverBody.lineStyle(1, 0x222222, 1);
    roverBody.fillRoundedRect(-18, -14, 36, 28, 4);
    roverBody.strokeRoundedRect(-18, -14, 36, 28, 4);

    // Placas de armadura (detalles metálicos)
    roverBody.fillStyle(0x555555, 1);
    roverBody.fillRect(-14, -10, 28, 8);
    roverBody.lineStyle(1, 0x777777, 0.5);
    roverBody.strokeRect(-14, -10, 28, 8);

    // Compartimento de energía (núcleo)
    roverBody.fillStyle(0x003333, 1);
    roverBody.fillCircle(0, 4, 8);
    roverBody.lineStyle(2, 0x00ffff, 0.6);
    roverBody.strokeCircle(0, 4, 8);

    // Ruedas de oruga (lado izquierdo)
    roverBody.fillStyle(0x1a1a1a, 1);
    roverBody.fillRoundedRect(-22, -16, 8, 32, 3);
    roverBody.lineStyle(1, 0x333333, 1);
    roverBody.strokeRoundedRect(-22, -16, 8, 32, 3);

    // Ruedas de oruga (lado derecho)
    roverBody.fillStyle(0x1a1a1a, 1);
    roverBody.fillRoundedRect(14, -16, 8, 32, 3);
    roverBody.strokeRoundedRect(14, -16, 8, 32, 3);

    // Escáner superior (cabezal)
    roverBody.fillStyle(0x333333, 1);
    roverBody.fillRoundedRect(-8, -22, 16, 10, 2);

    // Lente del escáner con brillo
    const scannerLens = this.add.graphics();
    scannerLens.fillStyle(0x00ffff, 1);
    scannerLens.fillCircle(0, -18, 3);

    // Luz de escaneo direccional
    const scanBeam = this.add.graphics();
    scanBeam.fillStyle(0x00ffff, 0.1);
    scanBeam.beginPath();
    scanBeam.moveTo(0, -18);
    scanBeam.lineTo(-20, -50);
    scanBeam.lineTo(20, -50);
    scanBeam.closePath();
    scanBeam.fillPath();

    this.gridRobot.add([shadow, roverBody, scannerLens, scanBeam]);

    // Animación de los sistemas del rover
    this.tweens.add({
      targets: scanBeam,
      alpha: 0.3,
      scaleX: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: scannerLens,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  placeTargetOnGrid() {
    if (this.targetContainer) this.targetContainer.destroy();

    const x =
      this.gridOffset.x + this.targetPos.x * this.cellSize + this.cellSize / 2;
    const y =
      this.gridOffset.y + this.targetPos.y * this.cellSize + this.cellSize / 2;

    this.targetContainer = this.add.container(x, y);

    // Cristal de mineral realista con múltiples facetas
    const crystal = this.add.graphics();

    // Sombra proyectada por el cristal
    crystal.fillStyle(0x000000, 0.5);
    crystal.fillCircle(0, 15, 12);

    // Faceta principal (núcleo)
    crystal.fillStyle(0x00ffff, 0.7);
    crystal.lineStyle(1, 0xffffff, 0.8);

    const mainPoints = [
      { x: 0, y: -22 },
      { x: 15, y: -5 },
      { x: 10, y: 18 },
      { x: -10, y: 18 },
      { x: -15, y: -5 },
    ];
    crystal.beginPath();
    crystal.moveTo(mainPoints[0].x, mainPoints[0].y);
    mainPoints.forEach((p) => crystal.lineTo(p.x, p.y));
    crystal.closePath();
    crystal.fillPath();
    crystal.strokePath();

    // Facetas de brillo (reflejos)
    crystal.fillStyle(0xffffff, 0.3);
    crystal.beginPath();
    crystal.moveTo(0, -22);
    crystal.lineTo(8, -5);
    crystal.lineTo(0, 5);
    crystal.closePath();
    crystal.fillPath();

    // Aura de energía
    const aura = this.add.graphics();
    aura.fillStyle(0x00ffff, 0.1);
    for (let i = 0; i < 3; i++) {
      aura.fillCircle(0, 0, 20 + i * 5);
    }

    this.targetContainer.add([aura, crystal]);

    // Animación de levitación y rotación sutil
    this.tweens.add({
      targets: this.targetContainer,
      y: y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Partículas de energía del mineral
    const energyParticles = this.add.particles("ash");
    this.targetContainer.add(energyParticles);
    energyParticles.createEmitter({
      x: 0,
      y: 0,
      speed: { min: 10, max: 30 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: 0x00ffff,
      lifespan: 1000,
      frequency: 200,
      blendMode: "ADD",
    });
  }

  placeObstaclesOnGrid() {
    if (this.obstacleGroup) this.obstacleGroup.destroy();
    this.obstacleGroup = this.add.group();

    this.obstacles.forEach((obs) => {
      const x = this.gridOffset.x + obs.x * this.cellSize + this.cellSize / 2;
      const y = this.gridOffset.y + obs.y * this.cellSize + this.cellSize / 2;

      const rockContainer = this.add.container(x, y);
      const rock = this.add.graphics();

      // Sombra de la roca
      rock.fillStyle(0x000000, 0.5);
      rock.fillEllipse(0, 15, 25, 10);

      // Color de roca volcánica oscura
      rock.fillStyle(0x2d1f14, 1);
      rock.lineStyle(1, 0x1a0f0a, 1);

      const points = [];
      const numPoints = 7;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const dist = 18 + Math.random() * 7;
        points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
      }

      rock.beginPath();
      rock.moveTo(points[0].x, points[0].y);
      points.forEach((p) => rock.lineTo(p.x, p.y));
      rock.closePath();
      rock.fillPath();
      rock.strokePath();

      // Grietas de lava/magma (Realismo volcánico)
      rock.lineStyle(2, 0xff4400, 0.8);
      for (let i = 0; i < 2; i++) {
        rock.beginPath();
        const startIdx = Math.floor(Math.random() * numPoints);
        rock.moveTo(points[startIdx].x * 0.5, points[startIdx].y * 0.5);
        rock.lineTo(0, 0);
        rock.strokePath();
      }

      // Brillo de magma en las grietas
      rock.fillStyle(0xffaa00, 0.5);
      rock.fillCircle(0, 0, 3);

      rockContainer.add(rock);
      this.obstacleGroup.add(rockContainer);

      // Animación sutil de respiración de lava en la roca
      this.tweens.add({
        targets: rock,
        alpha: 0.8,
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    });
  }

  createCommandUI() {
    const commands = [
      { key: "up", icon: "↑" },
      { key: "down", icon: "↓" },
      { key: "left", icon: "←" },
      { key: "right", icon: "→" },
    ];

    // Panel de comandos
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.lineStyle(2, 0xff4500, 1);
    panelBg.fillRoundedRect(600, 130, 150, 250, 10);
    panelBg.strokeRoundedRect(600, 130, 150, 250, 10);

    this.commandBtns = [];
    commands.forEach((cmd, idx) => {
      const btn = this.add.container(675, 170 + idx * 55);
      const bg = this.add.graphics();
      this.drawButtonBg(bg, 100, 45, 0x1a0a00, 0xff4500);

      const txt = this.add
        .text(0, 0, cmd.icon, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "24px",
          color: "#FFFFFF",
        })
        .setOrigin(0.5);

      btn.add([bg, txt]);

      bg.setInteractive(
        new Phaser.Geom.Rectangle(-50, -22, 100, 45),
        Phaser.Geom.Rectangle.Contains,
      );

      bg.on("pointerover", () =>
        this.drawButtonBg(bg, 100, 45, 0x331100, 0xffffff),
      );
      bg.on("pointerout", () =>
        this.drawButtonBg(bg, 100, 45, 0x1a0a00, 0xff4500),
      );
      bg.on("pointerdown", () => this.addCommand(cmd.key, cmd.icon));

      this.commandBtns.push(btn);
    });

    // Cola de comandos UI mejorada
    this.queueBg = this.add.graphics();
    this.queueBg.fillStyle(0x000000, 0.6);
    this.queueBg.lineStyle(1, 0x00ff00, 0.5);
    this.queueBg.fillRoundedRect(150, 450, 450, 50, 5);
    this.queueBg.strokeRoundedRect(150, 450, 450, 50, 5);

    this.queueContainer = this.add.container(165, 475);
    this.updateQueueUI();

    // Botón EJECUTAR rediseñado
    this.execBtn = this.add.container(675, 475);
    const exBg = this.add.graphics();
    this.drawButtonBg(exBg, 120, 50, 0x004400, 0x00ff00);
    const exTxt = this.add
      .text(0, 0, "EJECUTAR", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "16px",
        color: "#FFFFFF",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.execBtn.add([exBg, exTxt]);
    exBg.setInteractive(
      new Phaser.Geom.Rectangle(-60, -25, 120, 50),
      Phaser.Geom.Rectangle.Contains,
    );

    exBg.on("pointerover", () =>
      this.drawButtonBg(exBg, 120, 50, 0x006600, 0xffffff),
    );
    exBg.on("pointerout", () =>
      this.drawButtonBg(exBg, 120, 50, 0x004400, 0x00ff00),
    );
    exBg.on("pointerdown", () => this.executeCommands());

    // Botón LIMPIAR rediseñado
    this.clearBtn = this.add.container(675, 410);
    const clBg = this.add.graphics();
    this.drawButtonBg(clBg, 120, 40, 0x440000, 0xff0000);
    const clTxt = this.add
      .text(0, 0, "LIMPIAR", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "14px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    this.clearBtn.add([clBg, clTxt]);
    clBg.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    clBg.on("pointerover", () =>
      this.drawButtonBg(clBg, 120, 40, 0x660000, 0xffffff),
    );
    clBg.on("pointerout", () =>
      this.drawButtonBg(clBg, 120, 40, 0x440000, 0xff0000),
    );
    clBg.on("pointerdown", () => {
      this.commandQueue = [];
      this.updateQueueUI();
    });
  }

  addCommand(key, icon) {
    if (this.commandQueue.length < this.maxCommands) {
      this.commandQueue.push({ key, icon });
      this.updateQueueUI();
      this.safePlay("click");
    }
  }

  updateQueueUI() {
    this.queueContainer.removeAll(true);
    this.commandQueue.forEach((cmd, idx) => {
      const txt = this.add
        .text(idx * 28, 0, cmd.icon, {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "18px",
          color: "#00FF00",
          backgroundColor: "#111111",
          padding: 4,
        })
        .setOrigin(0, 0.5);
      this.queueContainer.add(txt);
    });
  }

  async executeCommands() {
    if (this.isExecuting || this.commandQueue.length === 0) return;
    this.isExecuting = true;

    let currentX = this.robotPos.x;
    let currentY = this.robotPos.y;

    for (const cmd of this.commandQueue) {
      if (cmd.key === "up") currentY--;
      else if (cmd.key === "down") currentY++;
      else if (cmd.key === "left") currentX--;
      else if (cmd.key === "right") currentX++;

      // Mover imagen
      await this.animateMove(currentX, currentY);

      // Verificar límites
      if (
        currentX < 0 ||
        currentX >= this.gridSize.cols ||
        currentY < 0 ||
        currentY >= this.gridSize.rows
      ) {
        this.handleCrash();
        return;
      }

      // Verificar obstáculos
      if (this.obstacles.some((o) => o.x === currentX && o.y === currentY)) {
        this.handleCrash();
        return;
      }

      // Verificar meta
      if (currentX === this.targetPos.x && currentY === this.targetPos.y) {
        this.handleWin();
        return;
      }
    }

    // Si termina y no llega
    this.handleCrash();
  }

  animateMove(x, y) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: this.gridRobot,
        x: this.gridOffset.x + x * this.cellSize + this.cellSize / 2,
        y: this.gridOffset.y + y * this.cellSize + this.cellSize / 2,
        duration: 300,
        onComplete: resolve,
      });
    });
  }

  handleCrash() {
    this.safePlay("error");
    this.cameras.main.shake(200, 0.02);
    this.updateScore(-25);
    this.attempts++;

    this.time.delayedCall(500, () => {
      this.robotPos = { x: 0, y: 5 };
      this.placeRobotOnGrid();
      this.isExecuting = false;
      this.commandQueue = [];
      this.updateQueueUI();
    });
  }

  handleWin() {
    this.safePlay("success");
    this.showSparks(this.gridRobot.x, this.gridRobot.y);

    const points = this.attempts === 1 ? 200 : this.attempts === 2 ? 150 : 100;
    this.updateScore(points);
    this.phaseProgress = 100;
    this.updateProgressBar();

    // Transición automática tras victoria en Fase 3
    this.time.delayedCall(1500, () => {
      this.showFinalScreen();
    });
  }

  showFinalScreen() {
    // Limpiar todo
    this.children.removeAll();
    this.createBackground();
    this.createParticles();

    const title = this.add
      .text(this.screenWidth / 2, 100, "FERROX SALVADO", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "42px",
        color: "#00FF00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const scoreTxt = this.add
      .text(this.screenWidth / 2, 180, `PUNTUACIÓN TOTAL: ${this.score}`, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "28px",
        color: "#FFFFFF",
        fontStyle: "600",
      })
      .setOrigin(0.5);

    const badgesTitle = this.add
      .text(this.screenWidth / 2, 250, "CONCEPTOS DOMINADOS:", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "18px",
        color: "#FFA500",
      })
      .setOrigin(0.5);

    const badges = ["ACTUADORES", "DOF", "CONTROL PID"];
    badges.forEach((b, i) => {
      const badge = this.add.container(
        this.screenWidth / 2 - 200 + i * 200,
        320,
      );
      const bg = this.add.graphics();
      bg.fillStyle(0x1a0a00, 0.9);
      bg.lineStyle(2, 0x00ff00, 1);
      bg.fillRoundedRect(-80, -25, 160, 50, 10);
      bg.strokeRoundedRect(-80, -25, 160, 50, 10);

      const txt = this.add
        .text(0, 0, b, {
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "16px",
          color: "#00FF00",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      badge.add([bg, txt]);
      badge.setScale(0);
      this.tweens.add({
        targets: badge,
        scale: 1,
        delay: i * 300,
        duration: 500,
        ease: "Back.easeOut",
      });
    });

    // Transición automática a la siguiente escena después de mostrar los badges
    this.time.delayedCall(4000, () => {
      this.cameras.main.fade(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("scenaVideo2");
      });
    });

    this.safePlay("win");
  }
}
