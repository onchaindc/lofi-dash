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
  private progressBar!: Phaser.GameObjects.Graphics
  private attemptText!: Phaser.GameObjects.Text
  private bestText!: Phaser.GameObjects.Text

  private sectionLength = 3800

  constructor() {
    super('Game')
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BG)

    this.bgStars = this.add.graphics()
    this.drawStars()

    this.ground = this.add.graphics()
    this.drawGround()

    this.player = new Player(this)
    this.spawnSection()

    this.progressBar = this.add.graphics().setDepth(30)
    this.attemptText = this.add
      .text(28, 22, 'ATTEMPT 1', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#a1a1aa',
        fontStyle: '600'
      })
      .setDepth(30)

    this.bestText = this.add
      .text(28, 46, 'BEST 0%', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#71717a'
      })
      .setDepth(30)

    this.add
      .text(GAME.WIDTH / 2, 26, 'LOFI DASH', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#c4b5fd',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setAlpha(0.9)
      .setDepth(30)

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

  private drawStars() {
    this.bgStars.fillStyle(0xffffff, 0.45)
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * GAME.WIDTH * 2.5
      const y = Math.random() * 480
      const s = 0.7 + Math.random() * 1.8
      this.bgStars.fillCircle(x, y, s)
    }
  }

  private drawGround() {
    this.ground.clear()

    this.ground.fillStyle(GAME.GROUND_COLOR, 1)
    this.ground.fillRect(-300, GAME.GROUND_Y, GAME.WIDTH * 6, GAME.HEIGHT - GAME.GROUND_Y + 60)

    this.ground.lineStyle(3, GAME.ACCENT, 0.55)
    this.ground.lineBetween(-300, GAME.GROUND_Y, GAME.WIDTH * 6, GAME.GROUND_Y)

    this.ground.lineStyle(1.5, GAME.ACCENT_DIM, 0.35)
    this.ground.lineBetween(-300, GAME.GROUND_Y + 6, GAME.WIDTH * 6, GAME.GROUND_Y + 6)
  }

  private spawnSection() {
    this.obstacles.forEach(o => o.graphic.destroy())
    this.obstacles = []

    const base = 580

    const layout: { x: number; h: number; type: 'spike' | 'block' }[] = [
      { x: base + 0, h: 52, type: 'spike' },
      { x: base + 160, h: 48, type: 'spike' },
      { x: base + 320, h: 64, type: 'spike' },
      { x: base + 520, h: 44, type: 'spike' },
      { x: base + 640, h: 56, type: 'spike' },
      { x: base + 780, h: 40, type: 'block' },
      { x: base + 980, h: 58, type: 'spike' },
      { x: base + 1120, h: 50, type: 'spike' },
      { x: base + 1340, h: 46, type: 'spike' },
      { x: base + 1480, h: 68, type: 'spike' },
      { x: base + 1640, h: 42, type: 'spike' },
      { x: base + 1860, h: 48, type: 'block' },
      { x: base + 2020, h: 60, type: 'spike' },
      { x: base + 2160, h: 52, type: 'spike' },
      { x: base + 2400, h: 54, type: 'spike' },
      { x: base + 2540, h: 72, type: 'spike' },
      { x: base + 2700, h: 46, type: 'spike' },
      { x: base + 2860, h: 58, type: 'spike' },
      { x: base + 3100, h: 50, type: 'block' },
      { x: base + 3280, h: 64, type: 'spike' },
      { x: base + 3440, h: 48, type: 'spike' }
    ]

    for (const item of layout) {
      const g = this.add.graphics()
      const h = item.h
      const w = item.type === 'spike' ? 32 : 52

      if (item.type === 'spike') {
        g.fillStyle(0x2e2a45, 1)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(w / 2, -h)
        g.lineTo(w, 0)
        g.closePath()
        g.fillPath()

        g.lineStyle(2.5, GAME.ACCENT, 0.7)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(w / 2, -h)
        g.lineTo(w, 0)
        g.strokePath()
      } else {
        g.fillStyle(0x1c1a2e, 1)
        g.fillRoundedRect(0, -h, w, h, 5)
        g.lineStyle(2.5, GAME.ACCENT, 0.6)
        g.strokeRoundedRect(0, -h, w, h, 5)
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
      if (this.deathTimer > 0.35) this.canRestart = true
      return
    }

    this.worldX += GAME.PLAYER_SPEED * dt
    this.player.step(dt)

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

    if (this.worldX > this.sectionLength) {
      this.worldX = 0
      this.spawnSection()
    }
  }

  private renderWorld() {
    for (const o of this.obstacles) {
      o.graphic.x = o.x - this.worldX
    }
    this.bgStars.x = -this.worldX * 0.07
  }

  private drawProgress() {
    const pct = Math.min(1, this.worldX / this.sectionLength)

    this.progressBar.clear()
    this.progressBar.fillStyle(0x1a1a28, 0.85)
    this.progressBar.fillRect(GAME.WIDTH / 2 - 130, 56, 260, 6)
    this.progressBar.fillStyle(GAME.ACCENT, 1)
    this.progressBar.fillRect(GAME.WIDTH / 2 - 130, 56, 260 * pct, 6)

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