class Nivel3 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel3" });
    this.currentPhase = 1;
    this.score = 0;
    this.alertLevel = 100; // Baja conforme el jugador avanza
    this.questionsPhase1 = [
      {
        q: "Si las ruedas del robot están girando pero el robot no avanza ni un poquito, ¿qué crees que pasa?",
        options: [
          "A) El robot está volando",
          "B) Las ruedas están patinando en el lodo",
          "C) El robot tiene sueño",
          "D) Se acabó la música",
        ],
        correct: 1,
        explanation:
          "¡Exacto! A veces las ruedas giran pero no agarran bien el suelo. El robot debe detectar esto para no quedarse atrapado.",
      },
      {
        q: "¿Qué es lo más importante cuando un robot planea su camino hacia una meta?",
        options: [
          "A) Que el camino sea de color rojo",
          "B) Encontrar el camino más corto y seguro sin chocar",
          "C) Ir haciendo mucho ruido",
          "D) Dar muchas vueltas en círculo",
        ],
        correct: 1,
        explanation:
          "¡Muy bien! Un buen robot siempre busca la ruta más rápida y segura para ahorrar energía y tiempo.",
      },
      {
        q: "Si el programa del robot se 'traba' o se queda congelado, ¿qué debería hacer su sistema de seguridad?",
        options: [
          "A) Apagarse para siempre",
          "B) Reiniciar el sistema automáticamente para volver a funcionar",
          "C) Cambiar el color de sus luces",
          "D) Esperar a que llueva",
        ],
        correct: 1,
        explanation:
          "¡Correcto! El sistema tiene un 'guardián' que lo reinicia si algo falla para que el robot no se quede parado.",
      },
    ];

    this.questionsPhase2 = [
      {
        text: "En programación, un 'bucle' o 'loop' sirve para repetir una instrucción muchas veces sin tener que escribirla de nuevo.",
        answer: true,
        justification:
          "¡VERDADERO! Los bucles nos ahorran mucho trabajo cuando queremos que el robot repita algo, como caminar.",
      },
      {
        text: "Los robots pueden moverse con total seguridad por un lugar que no conocen sin usar ningún sensor.",
        answer: false,
        justification:
          "¡FALSO! Sin sensores, el robot estaría 'ciego' y chocaría con todo lo que encuentre en su camino.",
      },
      {
        text: "Un botón de emergencia debe ser un botón físico real para poder detener al robot aunque la computadora falle.",
        answer: true,
        justification:
          "¡VERDADERO! Por seguridad, siempre debe haber una forma mecánica de cortar la energía si algo sale mal.",
      },
    ];
  }

  preload() {
    this.load.audio("click", [
      "assets/sounds/click.wav",
      "assets/sounds/click.mp3",
    ]);
    this.load.audio("error", [
      "assets/sounds/error.wav",
      "assets/sounds/error.mp3",
    ]);
    this.load.audio("success", [
      "assets/sounds/success.wav",
      "assets/sounds/success.mp3",
    ]);
    this.load.audio("win", ["assets/sounds/win.wav", "assets/sounds/win.mp3"]);
    this.load.image("neural_node", "assets/neural_node.svg");
    this.load.image("verdania_bg", "assets/scenaPrincipal/1.jpg");

    this.load.on("loaderror", (file) => {
      console.error(`Error loading file: ${file.key} from ${file.url}`);
    });
  }

  safePlay(key) {
    if (!this.cache.audio.exists(key)) return;

    try {
      const sound = this.sound.add(key);
      if (this.sound.context.state === "running") {
        sound.play();
      } else {
        this.input.once("pointerdown", () => {
          if (this.sound.context.state === "suspended") {
            this.sound.context.resume();
          }
        });
      }
    } catch (e) {
      // Silencio total en errores de audio
    }
  }

  create() {
    this.screenWidth = this.sys.game.config.width;
    this.screenHeight = this.sys.game.config.height;

    // Asegurar que MusicManager esté listo
    try {
      this.musicManager = MusicManager.getInstance();
    } catch (e) {
      console.error("MusicManager not found, creating dummy.", e);
      this.musicManager = {
        playMusic: () => {},
        stopMusic: () => {},
        isPlaying: () => false,
      };
    }

    this.colors = {
      forestGreen: 0x003300,
      neonGreen: 0x39ff14,
      solarYellow: 0xffd700,
      darkEarth: 0x1a0d00,
      codeWhite: 0xe8ffe8,
      alertRed: 0xff0000,
    };

    // Crear elementos en orden seguro
    this.createBackground();
    this.createHUD();
    this.createHolographicHUD();

    this.startPhase1();
  }

  createBackground() {
    try {
      // 1. CIELO DINÁMICO (Gradiente atmosférico)
      const sky = this.add.graphics();
      sky.fillGradientStyle(0x001a00, 0x001a00, 0x004400, 0x004400, 1);
      sky.fillRect(0, 0, this.screenWidth, this.screenHeight);

      // 2. SOL ALIENÍGENA Y LUNAS CON RESPLANDOR
      this.createAtmosphere();

      // 3. CAPAS DE MONTAÑAS (Parallax)
      this.mountainLayers = [];
      const layerColors = [0x002200, 0x003300, 0x0b1a00];
      for (let i = 0; i < 3; i++) {
        const layer = this.add.graphics();
        this.drawMountainLayer(layer, i, layerColors[i]);
        this.mountainLayers.push(layer);
      }

      // 4. NIEBLA VOLUMÉTRICA ENTRE CAPAS
      this.createVolumetricFog();

      // 5. CAMPOS DE CULTIVO (Suelo con textura simulada)
      const ground = this.add.graphics();
      ground.fillStyle(0x1a0d00, 1);
      ground.fillRect(0, this.screenHeight - 100, this.screenWidth, 100);

      // Surcos de cultivo con perspectiva
      ground.lineStyle(1, 0x000000, 0.3);
      for (let i = 0; i < this.screenWidth; i += 30) {
        ground.lineBetween(
          i,
          this.screenHeight - 100,
          i + (i - this.screenWidth / 2) * 0.5,
          this.screenHeight,
        );
      }

      // 6. VEGETACIÓN AVANZADA (Plantas con física de viento)
      this.createAdvancedFlora();

      // 7. ESTRUCTURAS AGRÍCOLAS (Silos)
      this.createFarmSilos();

      // 8. ROBOTS AGRÍCOLAS (Diseño integrado y visible)
      this.createIntegratedRobots();

      // 9. EFECTOS DE PARTÍCULAS ATMOSFÉRICAS (Polen/Esporas)
      this.createAtmosphericParticles();
    } catch (e) {
      console.error("Critical error in createBackground:", e);
    }
  }

  createAtmosphere() {
    // Sol Verdania (Amarillo solar con resplandor masivo)
    const sunX = 150;
    const sunY = 100;
    const sunGlow = this.add.graphics();
    for (let i = 10; i > 0; i--) {
      sunGlow.fillStyle(0xffd700, 0.05);
      sunGlow.fillCircle(sunX, sunY, 30 + i * 20);
    }
    sunGlow.fillStyle(0xffffff, 0.9);
    sunGlow.fillCircle(sunX, sunY, 30);

    // Lunas con fases sutiles
    const moon = this.add.graphics();
    moon.fillStyle(0xe8ffe8, 0.6);
    moon.fillCircle(this.screenWidth - 200, 80, 20);
    moon.fillStyle(0x001a00, 0.8); // Sombra de la luna
    moon.fillCircle(this.screenWidth - 210, 80, 18);
  }

  drawMountainLayer(graphics, index, color) {
    const depth = index + 1;
    const height = 150 + index * 50;
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(0, this.screenHeight);
    graphics.lineTo(0, this.screenHeight - height);

    for (let x = 0; x <= this.screenWidth; x += 20) {
      const y =
        this.screenHeight -
        height +
        Math.sin((x * 0.01) / depth) * (30 * depth) +
        Math.cos(x * 0.02) * 10;
      graphics.lineTo(x, y);
    }

    graphics.lineTo(this.screenWidth, this.screenHeight);
    graphics.closePath();
    graphics.fillPath();

    // Animación de paralaje sutil (movimiento de cámara simulado)
    this.tweens.add({
      targets: graphics,
      x: -20 * depth,
      duration: 10000 / depth,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createVolumetricFog() {
    const fog = this.add.particles("neural_node");
    fog.createEmitter({
      x: { min: 0, max: this.screenWidth },
      y: { min: this.screenHeight - 200, max: this.screenHeight - 50 },
      speedX: { min: 2, max: 10 },
      scale: { start: 4, end: 8 },
      alpha: { start: 0, end: 0.05 },
      lifespan: 15000,
      tint: 0x39ff14,
      frequency: 800,
      blendMode: "ADD",
    });
  }

  createAdvancedFlora() {
    this.plants = this.add.group();
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * this.screenWidth;
      const y = this.screenHeight - 80 - Math.random() * 40;
      const plantContainer = this.add.container(x, y);

      const stem = this.add.graphics();
      stem.lineStyle(4, 0x003300, 1);

      // Dibujar tallo curvado
      const height = 60 + Math.random() * 100;
      const path = new Phaser.Curves.Path(0, 0);
      path.cubicBezierTo(0, -height, -10, -height / 2, 10, -height / 2);
      path.draw(stem);

      // Hojas bioluminiscentes con glow
      for (let j = 0; j < 4; j++) {
        const leaf = this.add.graphics();
        leaf.fillStyle(this.colors.neonGreen, 0.4);
        const leafY = -height * (j / 4);
        // Usar fillCircle o una forma más simple si fillEllipse da problemas en esta versión de Phaser
        leaf.fillCircle(Math.sin(j) * 10, leafY, 10);
        plantContainer.add(leaf);
      }

      // Flor/Fruto brillante
      const flower = this.add.graphics();
      flower.fillStyle(0xffffff, 0.8);
      flower.fillCircle(0, -height, 8);
      flower.fillStyle(0x39ff14, 0.5);
      flower.fillCircle(0, -height, 15);

      plantContainer.add([stem, flower]);

      // Animación de "Viento" (Sway)
      this.tweens.add({
        targets: plantContainer,
        angle: { from: -2, to: 2 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.plants.add(plantContainer);
    }
  }

  createFarmSilos() {
    for (let i = 0; i < 2; i++) {
      const x = 50 + i * 400;
      const y = this.screenHeight - 100;
      const silo = this.add.graphics();

      // Cuerpo del silo
      silo.fillStyle(0x2c2c2c, 1);
      silo.fillRect(x, y - 120, 60, 120);

      // Techo cónico
      silo.fillStyle(0x444444, 1);
      silo.beginPath();
      silo.moveTo(x - 5, y - 120);
      silo.lineTo(x + 30, y - 150);
      silo.lineTo(x + 65, y - 120);
      silo.closePath();
      silo.fillPath();

      // Luces de advertencia (apagadas - rojo oscuro)
      silo.fillStyle(0x330000, 1);
      silo.fillCircle(x + 30, y - 150, 4);
    }
  }

  createIntegratedRobots() {
    this.robots = [];
    this.robotGraphics = [];
    // Posicionar robots en la zona visible (izquierda y centro)
    const positions = [100, 250, 400, 550];
    for (let i = 0; i < 4; i++) {
      const x = positions[i];
      const y = this.screenHeight - 85;
      const robot = this.add.container(x, y);

      const rBody = this.add.graphics();
      // Base metálica gris industrial (más visible)
      rBody.fillStyle(0x3a3a3a, 1);
      rBody.fillRoundedRect(-25, -45, 50, 60, 8);
      rBody.lineStyle(2, 0x1a1a1a, 1);
      rBody.strokeRoundedRect(-25, -45, 50, 60, 8);

      // Sensores / Ojo robótico (apagado)
      rBody.fillStyle(0x222222, 1);
      rBody.fillCircle(0, -55, 15);
      rBody.fillStyle(0x111111, 1);
      rBody.fillCircle(0, -55, 10); // Lente

      // Detalles mecánicos (antenas/brazos)
      rBody.lineStyle(2, 0x333333, 1);
      rBody.lineBetween(15, -45, 25, -70);
      rBody.fillCircle(25, -70, 3);

      // Sombra proyectada en el suelo
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.5);
      shadow.fillEllipse(0, 15, 60, 20);
      robot.add(shadow);

      robot.add(rBody);
      this.robots.push(robot);
      this.robotGraphics.push(rBody);
    }
  }

  createAtmosphericParticles() {
    // Esporas bioluminiscentes flotando por toda la pantalla
    const spores = this.add.particles("neural_node");
    spores.createEmitter({
      x: { min: 0, max: this.screenWidth },
      y: { min: 0, max: this.screenHeight },
      speed: { min: 5, max: 15 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.05, end: 0.1 },
      alpha: { start: 0.2, end: 0 },
      lifespan: 10000,
      tint: [0x39ff14, 0xffd700],
      frequency: 200,
    });
  }

  blinkRed(x, y, w, h) {
    if (x === undefined || y === undefined) return;
    this.safePlay("error");
    const overlay = this.add.graphics();
    overlay.fillStyle(0xff0000, 0.5);
    overlay.fillRoundedRect(x, y, w || 100, h || 50, 5);
    if (this.terminalContent) {
      this.terminalContent.add(overlay);
    }

    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (overlay) overlay.destroy();
      },
    });
  }

  createHUD() {
    const headerStyle = {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: "18px",
      color: "#00ffff",
      fontWeight: "bold",
    };

    const hudBg = this.add.graphics();
    hudBg.fillGradientStyle(0x000000, 0x000000, 0x001122, 0x001122, 0.8);
    hudBg.fillRect(0, 0, this.screenWidth, 75);
    hudBg.lineStyle(2, 0x00ffff, 0.5);
    hudBg.strokeLineShape(new Phaser.Geom.Line(0, 75, this.screenWidth, 75));

    this.add.text(20, 15, "🛰️ PLANETA: VERDANIA", headerStyle);
    this.phaseText = this.add.text(20, 42, "FASE 1: DIAGNÓSTICO LÓGICO", {
      ...headerStyle,
      fontSize: "14px",
      color: "#ffffff",
    });

    this.scoreText = this.add.text(
      this.screenWidth - 220,
      15,
      "SCORE: 0000",
      headerStyle,
    );
  }

  createHolographicHUD() {
    // Interfaz holográfica central más amplia y alta para evitar choques
    const uiWidth = 980;
    const uiHeight = 450;
    const x = (this.screenWidth - uiWidth) / 2;
    const y = 95;

    this.uiContainer = this.add.container(x, y);

    // Fondo holográfico unificado (Cian muy profundo)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001111, 0x001111, 0x000000, 0x000000, 0.95);
    bg.fillRoundedRect(0, 0, uiWidth, uiHeight, 20);

    // Bordes brillantes unificados
    bg.lineStyle(3, 0x00ffff, 0.6);
    bg.strokeRoundedRect(0, 0, uiWidth, uiHeight, 20);

    // Líneas de escaneo muy sutiles
    bg.lineStyle(1, 0x00ffff, 0.02);
    for (let i = 0; i < uiHeight; i += 10) {
      bg.strokeLineShape(new Phaser.Geom.Line(15, i, uiWidth - 15, i));
    }

    this.uiContainer.add(bg);

    // Título holográfico unificado y bien posicionado
    const title = this.add
      .text(uiWidth / 2, 30, "🛰️ SISTEMA DE ENLACE - VERDANIA", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "26px",
        color: "#00ffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.uiContainer.add(title);

    this.drawSciFiCorners(bg, uiWidth, uiHeight);

    // Contenedor de contenido con mejor margen
    this.terminalContent = this.add.container(60, 85);
    this.uiContainer.add(this.terminalContent);

    this.tweens.add({
      targets: this.uiContainer,
      alpha: { from: 0.98, to: 1 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      repeatDelay: 6000,
    });
  }

  drawSciFiCorners(g, w, h) {
    g.lineStyle(4, 0x00ffff, 0.8);
    const s = 15;
    // Top Left
    g.beginPath();
    g.moveTo(0, s);
    g.lineTo(0, 0);
    g.lineTo(s, 0);
    g.strokePath();
    // Top Right
    g.beginPath();
    g.moveTo(w - s, 0);
    g.lineTo(w, 0);
    g.lineTo(w, s);
    g.strokePath();
    // Bottom Left
    g.beginPath();
    g.moveTo(0, h - s);
    g.lineTo(0, h);
    g.lineTo(s, h);
    g.strokePath();
    // Bottom Right
    g.beginPath();
    g.moveTo(w - s, h);
    g.lineTo(w, h);
    g.lineTo(w, h - s);
    g.strokePath();
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score.toString().padStart(4, "0")}`);
  }

  // --- FASE 1 ---
  startPhase1() {
    this.currentPhase = 1;
    this.currentQuestionIndex = 0;
    this.showQuestionPhase1();
  }

  showQuestionPhase1() {
    this.terminalContent.removeAll(true);

    if (this.currentQuestionIndex >= this.questionsPhase1.length) {
      this.startPhase2();
      return;
    }

    const question = this.questionsPhase1[this.currentQuestionIndex];

    const qText = this.add.text(0, 0, question.q, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: "22px",
      color: "#00ffff",
      wordWrap: { width: 850 },
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.terminalContent.add(qText);

    // Opciones unificadas y más grandes
    this.optionObjects = [];
    const width = 850;
    const height = 50;
    const startY = 80; // Espacio después de la pregunta
    const spacing = 65;

    question.options.forEach((opt, index) => {
      const optY = startY + index * spacing;
      const optContainer = this.add.container(0, 0);
      const optBg = this.add.graphics();

      this.drawOptionBtnBg(
        optBg,
        width,
        height,
        optY,
        0x00ffff,
        0.1,
        0x00ffff,
        0.6,
      );

      const optText = this.add
        .text(25, optY + height / 2, opt, {
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "20px",
          color: "#ffffff",
          wordWrap: { width: 800 },
          fontStyle: "600",
        })
        .setOrigin(0, 0.5);

      const interactiveZone = this.add
        .zone(0, optY, width, height)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      interactiveZone.on("pointerdown", () => {
        this.handleAnswerPhase1(index, optBg, optY);
      });

      interactiveZone.on("pointerover", () => {
        this.drawOptionBtnBg(
          optBg,
          width,
          height,
          optY,
          0x00ffff,
          0.2,
          0x00ffff,
          1,
        );
        this.tweens.add({ targets: optContainer, scale: 1.01, duration: 100 });
        this.safePlay("click");
      });

      interactiveZone.on("pointerout", () => {
        this.drawOptionBtnBg(
          optBg,
          width,
          height,
          optY,
          0x00ffff,
          0.1,
          0x00ffff,
          0.6,
        );
        this.tweens.add({ targets: optContainer, scale: 1, duration: 100 });
      });

      optContainer.add([optBg, optText, interactiveZone]);
      this.terminalContent.add(optContainer);
      this.optionObjects.push({
        bg: optBg,
        text: optText,
        zone: interactiveZone,
      });
    });
  }

  drawOptionBtnBg(
    graphics,
    width,
    height,
    y,
    color,
    fillAlpha,
    strokeColor,
    strokeAlpha,
  ) {
    graphics.clear();
    graphics.fillStyle(color, fillAlpha);
    graphics.lineStyle(2, strokeColor, strokeAlpha);
    graphics.fillRoundedRect(0, y, width, height, 12);
    graphics.strokeRoundedRect(0, y, width, height, 12);

    // Detalles sci-fi unificados
    graphics.lineStyle(4, strokeColor, strokeAlpha);
    const s = 10;
    // Top Left
    graphics.beginPath();
    graphics.moveTo(0, y + s);
    graphics.lineTo(0, y);
    graphics.lineTo(s, y);
    graphics.strokePath();
    // Bottom Right
    graphics.beginPath();
    graphics.moveTo(width, y + height - s);
    graphics.lineTo(width, y + height);
    graphics.lineTo(width - s, y + height);
    graphics.strokePath();
  }

  handleAnswerPhase1(index, selectedBg, optY) {
    const question = this.questionsPhase1[this.currentQuestionIndex];
    const isCorrect = index === question.correct;

    if (isCorrect) {
      const points = 150;
      this.updateScore(points);
      this.safePlay("success");
      this.alertLevel = Math.max(0, this.alertLevel - 10);

      this.terminalContent.removeAll(true);
      const feedbackText = this.add
        .text(425, 10, "🌟 ¡SISTEMA RESTAURADO!", {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "30px",
          color: "#00ffff", // Unificado a Cian
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      const explText = this.add
        .text(425, 120, question.explanation, {
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "24px",
          color: "#ffffff",
          wordWrap: { width: 800 },
          align: "center",
          fontStyle: "600",
        })
        .setOrigin(0.5);

      const nextBtn = this.add
        .text(425, 260, "[ CONTINUAR ESCANEO ➔ ]", {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "24px",
          color: "#00ffff",
          backgroundColor: "#001a1a",
          padding: { x: 35, y: 12 },
          stroke: "#00ffff",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      nextBtn.on("pointerdown", () => {
        this.currentQuestionIndex++;
        this.showQuestionPhase1();
      });

      this.terminalContent.add([feedbackText, explText, nextBtn]);
    } else {
      this.blinkRed(0, optY, 850, 50);
      this.updateScore(-10);
    }
  }

  // --- FASE 2 ---
  startPhase2() {
    this.currentPhase = 2;
    this.currentQuestionIndex = 0;
    this.phaseText.setText("FASE 2: VERIFICACIÓN LÓGICA");
    this.showQuestionPhase2();
  }

  showQuestionPhase2() {
    this.terminalContent.removeAll(true);

    if (this.currentQuestionIndex >= this.questionsPhase2.length) {
      // Al terminar la Fase 2, pasamos directamente a la escena del video 4
      this.scene.start("scenaVideo4");
      return;
    }

    const question = this.questionsPhase2[this.currentQuestionIndex];

    const title = this.add
      .text(425, 0, "🔍 VERIFICACIÓN DE INTEGRIDAD", {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "24px",
        color: "#00ffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const qText = this.add
      .text(425, 100, `"${question.text}"`, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        wordWrap: { width: 850 },
        fontStyle: "italic",
        align: "center",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.terminalContent.add([title, qText]);

    const trueBtn = this.createTFButton(120, 220, "✅ VERDADERO", true);
    const falseBtn = this.createTFButton(480, 220, "❌ FALSO", false);

    this.terminalContent.add([trueBtn, falseBtn]);
  }

  createTFButton(x, y, label, value) {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 75;
    const bg = this.add.graphics();

    this.drawButtonBg(bg, width, height, 0x00ffff, 0.1, 0x00ffff, 0.6);

    const text = this.add
      .text(width / 2, height / 2, label, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(0, 0, width, height)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerdown", () => this.handleAnswerPhase2(value, x, y));

    zone.on("pointerover", () => {
      this.drawButtonBg(bg, width, height, 0x00ffff, 0.2, 0x00ffff, 1);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
      this.safePlay("click");
    });

    zone.on("pointerout", () => {
      this.drawButtonBg(bg, width, height, 0x00ffff, 0.1, 0x00ffff, 0.6);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    container.add([bg, text, zone]);
    return container;
  }

  drawButtonBg(
    graphics,
    width,
    height,
    color,
    fillAlpha,
    strokeColor,
    strokeAlpha,
  ) {
    graphics.clear();
    graphics.fillStyle(color, fillAlpha);
    graphics.lineStyle(2, strokeColor, strokeAlpha);
    graphics.fillRoundedRect(0, 0, width, height, 15);
    graphics.strokeRoundedRect(0, 0, width, height, 15);

    // Detalles sci-fi unificados
    graphics.lineStyle(4, strokeColor, strokeAlpha);
    const s = 15;
    // Top Left
    graphics.beginPath();
    graphics.moveTo(0, s);
    graphics.lineTo(0, 0);
    graphics.lineTo(s, 0);
    graphics.strokePath();
    // Bottom Right
    graphics.beginPath();
    graphics.moveTo(width, height - s);
    graphics.lineTo(width, height);
    graphics.lineTo(width - s, height);
    graphics.strokePath();
  }

  handleAnswerPhase2(value, x, y) {
    const question = this.questionsPhase2[this.currentQuestionIndex];
    const isCorrect = value === question.answer;

    if (isCorrect) {
      this.updateScore(80);
      this.safePlay("success");

      this.terminalContent.removeAll(true);
      const feedback = this.add
        .text(425, 40, "🎉 ¡NODO VALIDADO!", {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "30px",
          color: "#00ffff", // Unificado a Cian
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      const justText = this.add
        .text(425, 140, question.justification, {
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "24px",
          color: "#ffffff",
          wordWrap: { width: 850 },
          align: "center",
          fontStyle: "600",
        })
        .setOrigin(0.5);

      const nextBtn = this.add
        .text(425, 270, "[ SIGUIENTE NODO ➔ ]", {
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "24px",
          color: "#00ffff",
          backgroundColor: "#001a1a",
          padding: { x: 35, y: 12 },
          stroke: "#00ffff",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      nextBtn.on("pointerdown", () => {
        this.currentQuestionIndex++;
        this.showQuestionPhase2();
      });

      this.terminalContent.add([feedback, justText, nextBtn]);
    } else {
      this.blinkRed(x, y, 280, 75);
      this.updateScore(-20);
    }
  }
}
