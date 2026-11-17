import Phaser from 'phaser'
import { GAME } from '../config'
import { Player } from '../Player'

interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  type: 'spike' | 'block'
  graphic: Phaser.GameObjects.Graphics
}

export class Game extends Phaser.Scene {
  private player!: Player
  private ground!: Phaser.GameObjects.Graphics
  private obstacles: Obstacle[] = []
  private worldX = 0
  private accumulator = 0
  private deathTimer = 0
  private canRestart = false
  private attempts = 1
  private best = 0

  private bgStars!: Phaser.GameObjects.Graphics
  private bgMid!: Phaser.GameObjects.Graphics
  private progressBar!: Phaser.GameObjects.Graphics
  private attemptText!: Phaser.GameObjects.Text
  private bestText!: Phaser.GameObjects.Text

  private sectionLength = 3200

  constructor() {
    super('Game')
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BG)

    this.bgStars = this.add.graphics()
    this.bgMid = this.add.graphics()
    this.drawAtmosphere()

    this.ground = this.add.graphics()
    this.drawGround()

    this.player = new Player(this)

    this.spawnSection()

    // UI
    this.progressBar = this.add.graphics()
    this.attemptText = this.add
      .text(24, 20, 'ATTEMPT 1', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#a1a1aa'
      })
      .setDepth(20)

    this.bestText = this.add
      .text(24, 42, 'BEST 0%', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#71717a'
      })
      .setDepth(20)

    this.add
      .text(GAME.WIDTH / 2, 28, 'LOFI DASH', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#c4b5fd',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setAlpha(0.85)
      .setDepth(20)

    // input
    this.input.on('pointerdown', () => this.handleInput())
    this.input.keyboard?.on('keydown-SPACE', () => this.handleInput())
    this.input.keyboard?.on('keydown-UP', () => this.handleInput())
  }

  private handleInput() {
    if (this.player.dead && this.canRestart) {
      this.restart()
    } else {
      this.player.requestJump()
    }
  }

  private drawAtmosphere() {
    // stars
    this.bgStars.fillStyle(0xffffff, 0.35)
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * GAME.WIDTH * 2
      const y = Math.random() * 420
      const s = 0.8 + Math.random() * 1.6
      this.bgStars.fillCircle(x, y, s)
    }

    // soft distant shapes
    this.bgMid.fillStyle(0x12121f, 0.7)
    this.bgMid.fillRect(0, 380, GAME.WIDTH * 3, 200)
  }

  private drawGround() {
    this.ground.clear()
    this.ground.fillStyle(GAME.GROUND_COLOR, 1)
    this.ground.fillRect(-200, GAME.GROUND_Y, GAME.WIDTH * 5, GAME.HEIGHT - GAME.GROUND_Y + 40)

    this.ground.lineStyle(2, GAME.ACCENT_DIM, 0.55)
    this.ground.lineBetween(-200, GAME.GROUND_Y, GAME.WIDTH * 5, GAME.GROUND_Y)

    // subtle floor texture lines
    this.ground.lineStyle(1, 0x1f1f32, 0.4)
    for (let i = 0; i < 40; i++) {
      const x = i * 90
      this.ground.lineBetween(x, GAME.GROUND_Y + 8, x + 40, GAME.GROUND_Y + 8)
    }
  }

  private spawnSection() {
    this.obstacles.forEach(o => o.graphic.destroy())
    this.obstacles = []

    const base = 620

    // mixed spike + block layout that forces real timing
    const layout: { x: number; h: number; type: 'spike' | 'block' }[] = [
      { x: base + 0, h: 42, type: 'spike' },
      { x: base + 210, h: 38, type: 'spike' },
      { x: base + 420, h: 55, type: 'spike' },
      { x: base + 680, h: 36, type: 'block' },
      { x: base + 920, h: 48, type: 'spike' },
      { x: base + 1180, h: 62, type: 'spike' },
      { x: base + 1420, h: 40, type: 'spike' },
      { x: base + 1650, h: 50, type: 'block' },
      { x: base + 1920, h: 44, type: 'spike' },
      { x: base + 2180, h: 70, type: 'spike' },
      { x: base + 2450, h: 38, type: 'spike' },
      { x: base + 2680, h: 58, type: 'spike' },
      { x: base + 2950, h: 46, type: 'block' }
    ]

    for (const item of layout) {
      const g = this.add.graphics()
      const h = item.h
      const w = item.type === 'spike' ? 26 : 46

      if (item.type === 'spike') {
        g.fillStyle(0x2a2a40, 1)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(w / 2, -h)
        g.lineTo(w, 0)
        g.closePath()
        g.fillPath()

        g.lineStyle(2, GAME.ACCENT, 0.4)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(w / 2, -h)
        g.lineTo(w, 0)
        g.strokePath()
      } else {
        // floating block
        g.fillStyle(0x1e1e32, 1)
        g.fillRoundedRect(0, -h, w, h, 4)
        g.lineStyle(2, GAME.ACCENT_DIM, 0.7)
        g.strokeRoundedRect(0, -h, w, h, 4)
      }

      g.setPosition(item.x, GAME.GROUND_Y)

      this.obstacles.push({
        x: item.x,
        y: GAME.GROUND_Y - h,
        w,
        h,
        type: item.type,
        graphic: g
      })
    }
  }

  update(_: number, delta: number) {
    this.accumulator += delta / 1000

    while (this.accumulator >= GAME.DT) {
      this.physicsStep(GAME.DT)
      this.accumulator -= GAME.DT
    }

    this.renderWorld()
    this.drawProgress()
  }

  private physicsStep(dt: number) {
    if (this.player.dead) {
      this.deathTimer += dt
      if (this.deathTimer > 0.38) this.canRestart = true
      return
    }

    this.worldX += GAME.PLAYER_SPEED * dt
    this.player.step(dt)

    // collision
    const px = this.player.x + this.worldX
    const py = this.player.y
    const half = GAME.PLAYER_SIZE * GAME.HITBOX_SCALE

    for (const o of this.obstacles) {
      if (
        px + half > o.x &&
        px - half < o.x + o.w &&
        py + half > o.y &&
        py - half < o.y + o.h
      ) {
        this.player.die()
        this.deathTimer = 0
        this.canRestart = false

        const progress = Math.min(100, Math.floor((this.worldX / this.sectionLength) * 100))
        if (progress > this.best) this.best = progress
        break
      }
    }

    // loop section
    if (this.worldX > this.sectionLength) {
      this.worldX = 0
      this.spawnSection()
    }
  }

  private renderWorld() {
    for (const o of this.obstacles) {
      o.graphic.x = o.x - this.worldX
    }
    this.bgMid.x = -this.worldX * 0.18
    this.bgStars.x = -this.worldX * 0.06
  }

  private drawProgress() {
    const pct = Math.min(1, this.worldX / this.sectionLength)

    this.progressBar.clear()
    this.progressBar.fillStyle(0x1f1f2e, 0.8)
    this.progressBar.fillRect(GAME.WIDTH / 2 - 120, 58, 240, 5)
    this.progressBar.fillStyle(GAME.ACCENT, 0.9)
    this.progressBar.fillRect(GAME.WIDTH / 2 - 120, 58, 240 * pct, 5)

    this.attemptText.setText(`ATTEMPT ${this.attempts}`)
    this.bestText.setText(`BEST ${this.best}%`)
  }

  private restart() {
    this.attempts++
    this.player.reset()
    this.worldX = 0
    this.spawnSection()
    this.deathTimer = 0
    this.canRestart = false
  }
}