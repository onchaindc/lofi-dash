import Phaser from 'phaser'
import { GAME } from '../config'
import { Player } from '../Player'

interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  graphic: Phaser.GameObjects.Graphics
}

export class Game extends Phaser.Scene {
  private player!: Player
  private ground!: Phaser.GameObjects.Graphics
  private obstacles: Obstacle[] = []
  private worldX = 0
  private accumulator = 0
  private isPointerDown = false
  private deathTimer = 0
  private canRestart = false

  // simple parallax layers
  private bgFar!: Phaser.GameObjects.Graphics
  private bgMid!: Phaser.GameObjects.Graphics

  constructor() {
    super('Game')
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BG)

    // atmosphere layers
    this.bgFar = this.add.graphics()
    this.bgMid = this.add.graphics()
    this.drawAtmosphere()

    // ground line
    this.ground = this.add.graphics()
    this.drawGround()

    // Lofi
    this.player = new Player(this)

    // starter obstacles (simple first section)
    this.spawnSection()

    // input
    this.input.on('pointerdown', () => {
      this.isPointerDown = true
      if (this.player.dead && this.canRestart) {
        this.restart()
      } else {
        this.player.jump()
      }
    })

    this.input.on('pointerup', () => {
      this.isPointerDown = false
    })

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.player.dead && this.canRestart) {
        this.restart()
      } else {
        this.player.jump()
      }
    })

    // title hint
    this.add
      .text(GAME.WIDTH / 2, 48, 'LOFI DASH', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#c4b5fd',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setAlpha(0.7)

    this.add
      .text(GAME.WIDTH / 2, 82, 'tap / space to jump', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#6b7280'
      })
      .setOrigin(0.5)
  }

  private drawAtmosphere() {
    // far soft hills
    this.bgFar.fillStyle(0x12121f, 1)
    this.bgFar.fillRect(0, 0, GAME.WIDTH * 3, GAME.HEIGHT)

    // subtle grid / city suggestion
    this.bgMid.lineStyle(1, 0x1e1e32, 0.4)
    for (let i = 0; i < 40; i++) {
      const x = i * 80
      this.bgMid.lineBetween(x, 400, x, GAME.HEIGHT)
    }
  }

  private drawGround() {
    this.ground.clear()
    this.ground.fillStyle(GAME.GROUND_COLOR, 1)
    this.ground.fillRect(0, GAME.GROUND_Y, GAME.WIDTH * 4, GAME.HEIGHT - GAME.GROUND_Y)

    // thin accent line
    this.ground.lineStyle(2, GAME.ACCENT_DIM, 0.6)
    this.ground.lineBetween(0, GAME.GROUND_Y, GAME.WIDTH * 4, GAME.GROUND_Y)
  }

  private spawnSection() {
    // clear old
    this.obstacles.forEach(o => o.graphic.destroy())
    this.obstacles = []

    const base = 700
    const spikes = [
      { x: base + 0, h: 40 },
      { x: base + 280, h: 55 },
      { x: base + 520, h: 40 },
      { x: base + 780, h: 70 },
      { x: base + 1100, h: 45 },
      { x: base + 1400, h: 60 },
      { x: base + 1750, h: 50 },
      { x: base + 2100, h: 80 }
    ]

    for (const s of spikes) {
      const g = this.add.graphics()
      const h = s.h
      const w = 28

      // spike shape
      g.fillStyle(0x2a2a40, 1)
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(w / 2, -h)
      g.lineTo(w, 0)
      g.closePath()
      g.fillPath()

      // glow edge
      g.lineStyle(2, GAME.ACCENT, 0.35)
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(w / 2, -h)
      g.lineTo(w, 0)
      g.strokePath()

      g.setPosition(s.x, GAME.GROUND_Y)

      this.obstacles.push({
        x: s.x,
        y: GAME.GROUND_Y - h,
        w,
        h,
        graphic: g
      })
    }
  }

  update(_: number, delta: number) {
    // fixed timestep
    this.accumulator += delta / 1000

    while (this.accumulator >= GAME.DT) {
      this.physicsStep(GAME.DT)
      this.accumulator -= GAME.DT
    }

    // visual update
    this.renderWorld()
  }

  private physicsStep(dt: number) {
    if (this.player.dead) {
      this.deathTimer += dt
      if (this.deathTimer > 0.45) this.canRestart = true
      return
    }

    // scroll the world (player stays roughly in place on screen)
    this.worldX += GAME.PLAYER_SPEED * dt

    this.player.step(dt)

    // collision vs obstacles
    const px = this.player.x + this.worldX
    const py = this.player.y
    const half = GAME.PLAYER_SIZE * 0.38 // slightly tighter hitbox

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
        break
      }
    }

    // recycle section when far enough
    if (this.worldX > 2800) {
      this.worldX = 0
      this.spawnSection()
    }
  }

  private renderWorld() {
    // move obstacles with world scroll
    for (const o of this.obstacles) {
      o.graphic.x = o.x - this.worldX
    }

    // simple parallax
    this.bgMid.x = -this.worldX * 0.25
  }

  private restart() {
    this.player.reset()
    this.worldX = 0
    this.spawnSection()
    this.deathTimer = 0
    this.canRestart = false
  }
}