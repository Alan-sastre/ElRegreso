class Nivel2 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel2" });
    this.currentPhase = 1;
    this.score = 0;
    this.phaseProgress = 0;
    this.isAnswering = false;
  }

  preload() {
    // Cargar sonidos con fallbacks (Phaser probará ambos formatos)
    this.load.audio("sonar_ping", [
      "assets/sounds/success.wav",
      "assets/sounds/success.mp3",
    ]);
    this.load.audio("error_sound", [
      "assets/sounds/error.wav",
      "assets/sounds/error.mp3",
    ]);
    this.load.audio("bubbles", [
      "assets/sounds/click.wav",
      "assets/sounds/click.mp3",
    ]);

    // Manejo de errores de carga/decodificación
    this.load.on("loaderror", (file) => {
      console.warn(`Error al cargar: ${file.key} desde ${file.url}`);
    });

    // Cargar imágenes
    this.load.image("underwater_bg", "assets/scenaPrincipal/1.jpg"); // Usaremos la misma pero con tinte azul
    this.load.image("drone", "assets/drones/1.png");
    this.load.image("robot_sub", "assets/rompecabezas/Taller.png"); // Placeholder for Robo-Explorer
  }

  safePlay(key) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key);
    } else {
      console.warn(`Audio key "${key}" missing from cache or failed to decode`);
    }
  }

  create() {
    this.screenWidth = this.sys.game.config.width;
    this.screenHeight = this.sys.game.config.height;

    // Colores según paleta
    this.colors = {
      deepBlue: 0x001a3d,
      bioCyan: 0x00ffff,
      turquoise: 0x00ced1,
      abyssalBlack: 0x000a1a,
      whiteFlash: 0xe0ffff,
      successCyan: 0x00ffff,
      errorRed: 0xff0000,
    };

    this.createBackground();
    this.createHUD();
    this.createDecorations();
    this.createRobot();

    // Música (usando MusicManager si existe)
    this.musicManager = MusicManager.getInstance();

    // Iniciar Fase 1
    this.startPhase1();
  }

  createBackground() {
    // Fondo base azul profundo con gradiente radial
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001a3d, 0x001a3d, 0x000510, 0x000510, 1);
    bg.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // Añadir ruido sutil/textura de agua (puntos muy pequeños)
    this.noiseLayer = this.add.graphics();
    this.noiseLayer.fillStyle(0xffffff, 0.03);
    for (let i = 0; i < 200; i++) {
      this.noiseLayer.fillPoint(
        Math.random() * this.screenWidth,
        Math.random() * this.screenHeight,
        1,
      );
    }

    // Capas de partículas "nieve marina" (marine snow) para realismo
    this.createMarineSnow();

    // Rayos de luz volumétricos mejorados
    this.lightRays = [];
    for (let i = 0; i < 8; i++) {
      const ray = this.add.graphics();
      const x = (this.screenWidth / 8) * i + Math.random() * 50;
      ray.fillGradientStyle(
        0x00ffff,
        0x00ffff,
        0x001a3d,
        0x001a3d,
        0.15,
        0.15,
        0,
        0,
      );
      ray.beginPath();
      ray.moveTo(-80, 0);
      ray.lineTo(80, 0);
      ray.lineTo(250, this.screenHeight);
      ray.lineTo(-250, this.screenHeight);
      ray.closePath();
      ray.fillPath();
      ray.x = x;
      ray.alpha = 0.1 + Math.random() * 0.1;
      ray.angle = -15 + Math.random() * 30;
      this.lightRays.push(ray);

      this.tweens.add({
        targets: ray,
        alpha: 0.05,
        x: x + 100,
        angle: ray.angle + 5,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Efecto Vignette (bordes oscuros) para realismo de cámara
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(
      0x000000,
      0x000000,
      0x000000,
      0x000000,
      0,
      0,
      0.6,
      0.6,
    );
    vignette.fillRect(0, 0, this.screenWidth, this.screenHeight);
    vignette.setScrollFactor(0);
    vignette.setDepth(100);

    // Inicializar capas de ondas para update()
    this.waves = this.add.graphics();

    // Burbujas subiendo constantemente
    this.createBubbles();
  }

  createMarineSnow() {
    const snow = this.add.particles("bubble");
    snow.createEmitter({
      x: { min: 0, max: this.screenWidth },
      y: { min: 0, max: this.screenHeight },
      lifespan: 10000,
      speedY: { min: 5, max: 15 },
      speedX: { min: -5, max: 5 },
      scale: { min: 0.05, max: 0.2 },
      alpha: { start: 0.1, end: 0.3 },
      quantity: 1,
      frequency: 100,
    });
  }

  createBubbles() {
    const bubbleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bubbleGraphics.lineStyle(1, 0xffffff, 0.5);
    bubbleGraphics.strokeCircle(4, 4, 4);
    bubbleGraphics.generateTexture("bubble", 8, 8);

    const particles = this.add.particles("bubble");
    particles.createEmitter({
      x: { min: 0, max: this.screenWidth },
      y: this.screenHeight + 10,
      lifespan: 4000,
      speedY: { min: -50, max: -150 },
      scale: { min: 0.5, max: 1.5 },
      alpha: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 200,
    });
  }

  createDecorations() {
    // Plantas bioluminiscentes (simuladas con círculos parpadeantes)
    for (let i = 0; i < 10; i++) {
      const plant = this.add.circle(
        Math.random() * this.screenWidth,
        this.screenHeight - 20,
        5 + Math.random() * 5,
        this.colors.bioCyan,
      );
      this.tweens.add({
        targets: plant,
        alpha: 0.2,
        scale: 1.5,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Drones decorativos
    for (let i = 0; i < 3; i++) {
      const drone = this.add
        .image(
          Math.random() * this.screenWidth,
          Math.random() * this.screenHeight,
          "drone",
        )
        .setScale(0.2)
        .setAlpha(0.5);

      this.tweens.add({
        targets: drone,
        x: drone.x + (Math.random() - 0.5) * 200,
        y: drone.y + (Math.random() - 0.5) * 100,
        duration: 5000 + Math.random() * 5000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  createRobot() {
    this.robot = this.add.image(100, 300, "robot_sub").setScale(0.4);
    this.tweens.add({
      targets: this.robot,
      y: 280,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createHUD() {
    const monoStyle = {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#00ffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    };

    // HUD con diseño de interfaz de radar/sonar
    this.hudContainer = this.add.container(0, 0).setDepth(1000);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000a1a, 0.85);
    hudBg.fillRect(0, 0, this.screenWidth, 75);

    // Línea de escaneo superior
    hudBg.lineStyle(2, 0x00ffff, 0.8);
    hudBg.strokeLineShape(new Phaser.Geom.Line(0, 75, this.screenWidth, 75));

    // Detalles de rejilla de radar
    hudBg.lineStyle(1, 0x00ffff, 0.2);
    for (let i = 0; i < this.screenWidth; i += 50) {
      hudBg.strokeLineShape(new Phaser.Geom.Line(i, 0, i, 75));
    }

    this.hudContainer.add(hudBg);

    this.add.text(25, 12, "NODE: AQUARIX-4", monoStyle);

    this.phaseText = this.add.text(25, 40, "SYSTEM: CALIBRATING...", {
      ...monoStyle,
      fontSize: "14px",
      color: "#00ced1",
    });

    this.scoreText = this.add.text(
      this.screenWidth - 220,
      12,
      "SCORE: 0000",
      monoStyle,
    );

    // Visualizador de frecuencia (animado)
    this.add.text(this.screenWidth - 220, 40, "SIGNAL FREQ:", {
      ...monoStyle,
      fontSize: "12px",
      color: "#00ced1",
    });

    this.sonarSignal = this.add.graphics();
    this.hudContainer.add(this.sonarSignal);
    this.updateSonarSignal(1);
  }

  updateSonarSignal(quality) {
    if (!this.sonarSignal) return;
    this.sonarSignal.clear();
    this.sonarSignal.lineStyle(2, 0x00ffff, 1);
    for (let i = 0; i < 5; i++) {
      const h = 5 + Math.random() * 15 * quality;
      this.sonarSignal.strokeLineShape(
        new Phaser.Geom.Line(
          this.screenWidth - 80 + i * 10,
          50,
          this.screenWidth - 80 + i * 10,
          50 - h,
        ),
      );
    }
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score.toString().padStart(4, "0")}`);
  }

  // Efecto de transición de escaneo entre fases
  triggerScanTransition(callback) {
    const scanLine = this.add.graphics();
    scanLine.lineStyle(4, 0x00ffff, 0.8);
    scanLine.strokeLineShape(new Phaser.Geom.Line(0, 0, 0, this.screenHeight));
    scanLine.setDepth(2000);

    const scanFill = this.add.graphics();
    scanFill.fillStyle(0x00ffff, 0.1);
    scanFill.fillRect(-100, 0, 100, this.screenHeight);
    scanFill.setDepth(2000);

    this.safePlay("sonar_ping");

    this.tweens.add({
      targets: [scanLine, scanFill],
      x: this.screenWidth + 100,
      duration: 1200,
      ease: "Power2",
      onComplete: () => {
        scanLine.destroy();
        scanFill.destroy();
        if (callback) callback();
      },
    });
  }

  update(time, delta) {
    // Ondas en el top (superficie lejana)
    if (this.waves) {
      this.waves.clear();
      this.waves.lineStyle(2, 0x00ffff, 0.2);
      this.waves.beginPath();
      this.waves.moveTo(0, 20);
      for (let x = 0; x < this.screenWidth; x += 25) {
        const y = 20 + Math.sin(time * 0.0015 + x * 0.008) * 4;
        this.waves.lineTo(x, y);
      }
      this.waves.strokePath();
    }

    // Actualizar señal de sonar en el HUD
    if (time % 800 < 50) {
      this.updateSonarSignal(0.6 + Math.random() * 0.4);
    }

    // Efecto de pulso de sonar visual (periodicamente)
    if (time % 5000 < 20) {
      this.createSonarPulse();
    }
  }

  createSonarPulse() {
    const pulse = this.add.circle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      10,
    );
    pulse.setStrokeStyle(2, 0x00ffff, 0.5);
    pulse.setDepth(-1); // Detrás de todo pero sobre el fondo base

    this.tweens.add({
      targets: pulse,
      radius: this.screenWidth,
      alpha: 0,
      duration: 3000,
      onComplete: () => pulse.destroy(),
    });
  }

  // --- FASE 1: MATCHING ---
  startPhase1() {
    this.currentPhase = 1;
    this.phaseText.setText("FASE: 1/3 - CALIBRACIÓN SENSORIAL");

    const title = this.add
      .text(
        this.screenWidth / 2,
        110,
        "CALIBRACIÓN SENSORIAL — IDENTIFICACIÓN DE HARDWARE",
        {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#00ffff",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);

    const sensors = [
      {
        id: 1,
        name: "Sensor Ultrasónico",
        func: "Mide distancia mediante pulsos de sonido (40kHz)",
      },
      {
        id: 2,
        name: "Giroscopio MEMS",
        func: "Detecta velocidad angular en 3 ejes (roll/pitch/yaw)",
      },
      {
        id: 3,
        name: "Sensor de Presión",
        func: "Calcula profundidad por presión hidrostática",
      },
      {
        id: 4,
        name: "Cámara Estéreo",
        func: "Genera mapas de profundidad por visión binocular",
      },
      {
        id: 5,
        name: "Magnetómetro",
        func: "Determina orientación respecto al campo magnético",
      },
    ];

    const sensorNames = [...sensors].sort(() => Math.random() - 0.5);
    const sensorFuncs = [...sensors].sort(() => Math.random() - 0.5);

    this.selectedSensor = null;
    this.matchesCount = 0;
    this.phase1Objects = [title];

    const startY = 180;
    const spacing = 60;

    this.sensorButtons = [];
    this.funcButtons = [];

    sensorNames.forEach((s, i) => {
      const btn = this.createMatchButton(
        250,
        startY + i * spacing,
        s.name,
        s.id,
        "sensor",
      );
      this.sensorButtons.push(btn);
      this.phase1Objects.push(btn);
    });

    sensorFuncs.forEach((f, i) => {
      const btn = this.createMatchButton(
        750,
        startY + i * spacing,
        f.func,
        f.id,
        "func",
        400,
      );
      this.funcButtons.push(btn);
      this.phase1Objects.push(btn);
    });
  }

  createMatchButton(x, y, text, id, type, width = 200) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawMatchBtnBg(bg, width, 40, 0x001a3d, 0x00ced1);

    const txt = this.add
      .text(0, 0, text, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
        wordWrap: { width: width - 20 },
        align: "center",
      })
      .setOrigin(0.5);

    container.add([bg, txt]);
    container.id = id;
    container.type = type;
    container.matched = false;

    bg.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -20, width, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    bg.on("pointerdown", () => {
      if (container.matched) return;
      this.handleMatchClick(container, bg, width);
    });

    return container;
  }

  drawMatchBtnBg(graphics, width, height, fill, stroke) {
    graphics.clear();
    graphics.fillStyle(fill, 0.8);
    graphics.lineStyle(2, stroke, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 5);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 5);
  }

  handleMatchClick(container, bg, width) {
    if (container.type === "sensor") {
      // Deseleccionar anterior si existe
      if (this.selectedSensor) {
        this.drawMatchBtnBg(
          this.selectedSensor.list[0],
          200,
          40,
          0x001a3d,
          0x00ced1,
        );
      }
      this.selectedSensor = container;
      this.drawMatchBtnBg(bg, 200, 40, 0x00ffff, 0xffffff);
      this.safePlay("bubbles");
    } else {
      if (!this.selectedSensor) return;

      if (this.selectedSensor.id === container.id) {
        // Correcto
        this.selectedSensor.matched = true;
        container.matched = true;
        this.safePlay("sonar_ping");

        // Línea conectora
        const line = this.add.graphics();
        line.lineStyle(3, 0x00ffff, 1);
        line.lineBetween(
          this.selectedSensor.x + 100,
          this.selectedSensor.y,
          container.x - 200,
          container.y,
        );
        this.phase1Objects.push(line);

        this.updateScore(40);
        this.matchesCount++;
        this.selectedSensor = null;

        if (this.matchesCount === 5) {
          this.time.delayedCall(1000, () => this.finishPhase1());
        }
      } else {
        // Incorrecto
        this.updateScore(-15);
        this.safePlay("error_sound");
        this.cameras.main.shake(200, 0.01);

        // Shake animation
        this.tweens.add({
          targets: [this.selectedSensor, container],
          x: "+=5",
          yoyo: true,
          repeat: 5,
          duration: 50,
        });

        this.drawMatchBtnBg(
          this.selectedSensor.list[0],
          200,
          40,
          0x001a3d,
          0x00ced1,
        );
        this.selectedSensor = null;
      }
    }
  }

  finishPhase1() {
    this.triggerScanTransition(() => {
      this.phase1Objects.forEach((obj) => obj.destroy());
      this.startPhase2();
    });
  }

  finishPhase2() {
    this.triggerScanTransition(() => {
      this.startPhase3();
    });
  }

  // --- FASE 2: QUIZ ---
  startPhase2() {
    this.currentPhase = 2;
    this.phaseText.setText("FASE: 2/3 - ANÁLISIS TÉCNICO");

    this.questions = [
      {
        q: "Si un robot usa un sensor de sonido (como un murciélago), ¿qué está tratando de detectar?",
        options: [
          "El color de las flores",
          "La distancia a un objeto",
          "El sabor de la comida",
          "La temperatura del agua",
        ],
        correct: 1,
        exp: "¡Genial! El robot envía un sonido y mide cuánto tarda en volver para saber qué tan lejos está algo.",
      },
      {
        q: "¿Qué sensor ayuda al robot a saber si está derecho o si se está inclinando?",
        options: [
          "Un sensor de luz",
          "Un termómetro",
          "Un giroscopio",
          "Un micrófono",
        ],
        correct: 2,
        exp: "¡Correcto! El giroscopio ayuda al robot a mantener el equilibrio, ¡como tú cuando montas en bici!",
      },
      {
        q: "¿Por qué es importante que un robot explorador tenga luces potentes?",
        options: [
          "Para que se vea más bonito",
          "Para poder ver en lugares oscuros como cuevas o el fondo del mar",
          "Para calentar su comida",
          "Para asustar a los peces",
        ],
        correct: 1,
        exp: "¡Así es! Sin luces, el robot no podría ver los obstáculos en la oscuridad.",
      },
    ];

    this.currentQ = 0;
    this.showQuestion();
  }

  showQuestion() {
    if (this.currentQ >= this.questions.length) {
      this.finishPhase2();
      return;
    }

    const qData = this.questions[this.currentQ];
    this.phase2Objects = [];

    const title = this.add
      .text(
        this.screenWidth / 2,
        110,
        "ANÁLISIS TÉCNICO — SISTEMAS DE PERCEPCIÓN",
        {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#00ffff",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);
    this.phase2Objects.push(title);

    const questionTxt = this.add
      .text(this.screenWidth / 2, 180, qData.q, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        wordWrap: { width: 800 },
        align: "center",
      })
      .setOrigin(0.5);
    this.phase2Objects.push(questionTxt);

    qData.options.forEach((opt, i) => {
      const btn = this.createQuizButton(
        this.screenWidth / 2,
        280 + i * 50,
        opt,
        i === qData.correct,
      );
      this.phase2Objects.push(btn);
    });
  }

  createQuizButton(x, y, text, isCorrect) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawMatchBtnBg(bg, 600, 40, 0x001a3d, 0x00ced1);

    const txt = this.add
      .text(0, 0, text, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    container.add([bg, txt]);

    bg.setInteractive(
      new Phaser.Geom.Rectangle(-300, -20, 600, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    bg.on("pointerover", () => {
      this.drawMatchBtnBg(bg, 600, 40, 0x003366, 0x00ffff);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    bg.on("pointerout", () => {
      this.drawMatchBtnBg(bg, 600, 40, 0x001a3d, 0x00ced1);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    bg.on("pointerdown", () =>
      this.handleAnswer(isCorrect ? this.questions[this.currentQ].correct : -1),
    );

    return container;
  }

  handleAnswer(answerIdx) {
    if (this.isAnswering) return;
    this.isAnswering = true;

    const qData = this.questions[this.currentQ];
    const isCorrect = answerIdx === qData.correct;

    if (isCorrect) {
      this.safePlay("sonar_ping");
      this.updateScore(100);
    } else {
      this.safePlay("error_sound");
      this.cameras.main.shake(200, 0.01);
    }

    // Mostrar explicación con diseño mejorado
    const expBg = this.add.graphics();
    expBg.fillStyle(0x000510, 0.95);
    expBg.lineStyle(2, isCorrect ? 0x00ffff : 0xff0000, 1);
    expBg.fillRoundedRect(100, 150, 800, 220, 15);
    expBg.strokeRoundedRect(100, 150, 800, 220, 15);

    const feedbackTitle = this.add
      .text(500, 180, isCorrect ? "¡CORRECTO!" : "INCORRECTO", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: isCorrect ? "#00ffff" : "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const expTxt = this.add
      .text(500, 260, qData.exp, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        wordWrap: { width: 700 },
        align: "center",
      })
      .setOrigin(0.5);

    const nextTxt = this.add
      .text(500, 340, "Haga clic para continuar...", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#00ced1",
        alpha: 0.7,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: nextTxt,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.phase2Objects.push(expBg, feedbackTitle, expTxt, nextTxt);

    this.input.once("pointerdown", () => {
      this.isAnswering = false;
      this.phase2Objects.forEach((obj) => obj.destroy());
      this.currentQ++;
      this.showQuestion();
    });
  }

  finishPhase2() {
    this.startPhase3();
  }

  // --- FASE 3: PIPELINE ---
  startPhase3() {
    this.currentPhase = 3;
    this.phaseText.setText("FASE: 3/3 - ARQUITECTURA SENSORIAL");

    const title = this.add
      .text(
        this.screenWidth / 2,
        70,
        "ARQUITECTURA SENSORIAL — PIPELINE DE PERCEPCIÓN",
        {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#00ffff",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);

    this.blocks = [
      { id: 0, text: "Entorno Físico" },
      { id: 1, text: "Transducción" },
      { id: 2, text: "Acondicionamiento" },
      { id: 3, text: "Conversión A/D" },
      { id: 4, text: "Procesamiento" },
      { id: 5, text: "Actuación" },
    ];

    this.slots = [];
    this.slotGraphics = [];
    for (let i = 0; i < 6; i++) {
      const slotX = 50 + i * 155 + 70;
      const slotY = 180;

      const slotG = this.add.graphics();
      slotG.lineStyle(2, 0x00ced1, 0.3);
      slotG.strokeRoundedRect(slotX - 70, slotY - 30, 140, 60, 10);

      this.add
        .text(slotX, slotY - 45, (i + 1).toString(), {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#00ffff",
        })
        .setOrigin(0.5);

      this.slots.push({ x: slotX, y: slotY });
      this.slotGraphics.push(slotG);
    }

    // Línea conectora visual estilizada
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffff, 0.2);
    line.beginPath();
    line.moveTo(120, 180);
    line.lineTo(880, 180);
    line.strokePath();

    const shuffledBlocks = [...this.blocks].sort(() => Math.random() - 0.5);
    this.draggableBlocks = [];

    shuffledBlocks.forEach((b, i) => {
      const block = this.createDraggableBlock(100 + i * 160, 380, b.text, b.id);
      this.draggableBlocks.push(block);
    });

    // Botón de Pista (Hint)
    this.hintBtn = this.add.container(100, 470);
    const hintBg = this.add.graphics();
    this.drawMatchBtnBg(hintBg, 120, 40, 0x001a3d, 0x00ffff);
    const hintTxt = this.add
      .text(0, 0, "PISTA", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00ffff",
      })
      .setOrigin(0.5);
    this.hintBtn.add([hintBg, hintTxt]);

    hintBg.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains,
    );
    hintBg.on("pointerover", () =>
      this.drawMatchBtnBg(hintBg, 120, 40, 0x003366, 0x00ffff),
    );
    hintBg.on("pointerout", () =>
      this.drawMatchBtnBg(hintBg, 120, 40, 0x001a3d, 0x00ffff),
    );
    hintBg.on("pointerdown", () => this.showHint());

    // Botón Verificar
    this.verifyBtn = this.add.container(this.screenWidth - 100, 470);
    const vBg = this.add.graphics();
    this.drawMatchBtnBg(vBg, 150, 40, 0x001a3d, 0x00ffff);
    const vTxt = this.add
      .text(0, 0, "VERIFICAR", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00ffff",
      })
      .setOrigin(0.5);
    this.verifyBtn.add([vBg, vTxt]);
    this.verifyBtn.setVisible(false);

    vBg.setInteractive(
      new Phaser.Geom.Rectangle(-75, -20, 150, 40),
      Phaser.Geom.Rectangle.Contains,
    );
    vBg.on("pointerover", () =>
      this.drawMatchBtnBg(vBg, 150, 40, 0x003366, 0x00ffff),
    );
    vBg.on("pointerout", () =>
      this.drawMatchBtnBg(vBg, 150, 40, 0x001a3d, 0x00ffff),
    );
    vBg.on("pointerdown", () => this.checkPipeline());
  }

  showHint() {
    // Buscar el primer bloque que no esté en su lugar correcto
    const nextBlockToFix = this.draggableBlocks.find(
      (b) => b.currentSlot !== b.id,
    );
    if (nextBlockToFix) {
      const targetSlot = this.slots[nextBlockToFix.id];

      // Resaltar el slot destino
      const highlight = this.add.graphics();
      highlight.lineStyle(4, 0x00ffff, 1);
      highlight.strokeRoundedRect(
        targetSlot.x - 70,
        targetSlot.y - 30,
        140,
        60,
        10,
      );

      this.tweens.add({
        targets: highlight,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: 3,
        onComplete: () => highlight.destroy(),
      });

      // Efecto en el bloque también
      this.tweens.add({
        targets: nextBlockToFix,
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  createDraggableBlock(x, y, text, id) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawMatchBtnBg(bg, 140, 50, 0x001a3d, 0x00ced1);
    const txt = this.add
      .text(0, 0, text, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ffffff",
        wordWrap: { width: 120 },
        align: "center",
      })
      .setOrigin(0.5);

    container.add([bg, txt]);
    container.id = id;
    container.originalX = x;
    container.originalY = y;
    container.currentSlot = -1;

    bg.setInteractive(
      new Phaser.Geom.Rectangle(-70, -25, 140, 50),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input.setDraggable(bg);

    bg.on("pointerover", () => {
      this.drawMatchBtnBg(bg, 140, 50, 0x003366, 0x00ffff);
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });

    bg.on("pointerout", () => {
      if (container.currentSlot === -1) {
        this.drawMatchBtnBg(bg, 140, 50, 0x001a3d, 0x00ced1);
      }
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    bg.on("drag", (pointer, dragX, dragY) => {
      container.x = pointer.x;
      container.y = pointer.y;
      container.setDepth(1000);
    });

    bg.on("dragend", () => {
      let snapped = false;
      container.setDepth(1);

      this.slots.forEach((slot, i) => {
        const dist = Phaser.Math.Distance.Between(
          container.x,
          container.y,
          slot.x,
          slot.y,
        );
        if (dist < 60) {
          // Si ya hay un bloque en ese slot, devolverlo a su origen
          this.draggableBlocks.forEach((b) => {
            if (b !== container && b.currentSlot === i) {
              b.x = b.originalX;
              b.y = b.originalY;
              b.currentSlot = -1;
              this.drawMatchBtnBg(b.list[0], 140, 50, 0x001a3d, 0x00ced1);
            }
          });

          container.x = slot.x;
          container.y = slot.y;
          container.currentSlot = i;
          snapped = true;
          this.safePlay("bubbles");
          this.drawMatchBtnBg(bg, 140, 50, 0x004466, 0x00ffff);
        }
      });

      if (!snapped) {
        this.tweens.add({
          targets: container,
          x: container.originalX,
          y: container.originalY,
          duration: 300,
          ease: "Back.easeOut",
        });
        container.currentSlot = -1;
        this.drawMatchBtnBg(bg, 140, 50, 0x001a3d, 0x00ced1);
      }

      this.checkAllSnapped();
    });

    return container;
  }

  checkAllSnapped() {
    const allSnapped = this.draggableBlocks.every((b) => b.currentSlot !== -1);
    this.verifyBtn.setVisible(allSnapped);
  }

  checkPipeline() {
    let errors = 0;
    this.draggableBlocks.forEach((block) => {
      if (block.currentSlot !== block.id) {
        errors++;
        this.drawMatchBtnBg(block.list[0], 140, 50, 0x440000, 0xff0000);
        this.tweens.add({
          targets: block,
          x: block.x + 5,
          yoyo: true,
          repeat: 3,
          duration: 50,
        });
      } else {
        this.drawMatchBtnBg(block.list[0], 140, 50, 0x004400, 0x00ff00);
      }
    });

    if (errors === 0) {
      this.safePlay("sonar_ping");
      this.updateScore(200);
      this.time.delayedCall(1500, () => this.showFinalScreen());
    } else {
      this.safePlay("error_sound");
      this.cameras.main.shake(200, 0.01);
    }
  }

  showFinalScreen() {
    this.children.removeAll();
    this.createBackground();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000a1a, 0.8);
    overlay.fillRect(0, 0, this.screenWidth, this.screenHeight);

    this.add
      .text(this.screenWidth / 2, 100, "AQUARIX SALVADO", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#00ffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(this.screenWidth / 2, 180, `PUNTUACIÓN TOTAL: ${this.score}`, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const badges = [
      "FUSIÓN SENSORIAL",
      "FILTRO DE KALMAN",
      "PIPELINE DE DATOS",
    ];
    badges.forEach((b, i) => {
      const badge = this.add.container(
        this.screenWidth / 2 - 200 + i * 200,
        300,
      );
      const bg = this.add.graphics();
      bg.lineStyle(2, 0x00ffff, 1);
      bg.strokeCircle(0, 0, 60);
      const txt = this.add
        .text(0, 0, b, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#00ffff",
          align: "center",
          wordWrap: { width: 80 },
        })
        .setOrigin(0.5);
      badge.add([bg, txt]);

      this.tweens.add({
        targets: badge,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: i * 200,
      });
    });

    const nextBtn = this.add.container(this.screenWidth / 2, 420);
    const nBg = this.add.graphics();
    this.drawMatchBtnBg(nBg, 200, 50, 0x001a3d, 0x00ffff);
    const nTxt = this.add
      .text(0, 0, "CONTINUAR", { fontFamily: "monospace", fontSize: "20px" })
      .setOrigin(0.5);
    nextBtn.add([nBg, nTxt]);

    nBg.setInteractive(
      new Phaser.Geom.Rectangle(-100, -25, 200, 50),
      Phaser.Geom.Rectangle.Contains,
    );
    nBg.on("pointerdown", () => {
      this.scene.start("Nivel3");
    });
  }
}
