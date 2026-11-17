import Phaser from 'phaser'
import { GAME } from './config'

export class Player {
  public body: Phaser.GameObjects.Container
  public x = 220
  public y = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
  public vy = 0
  public grounded = true
  public dead = false
  public angle = 0

  private coyoteTimer = 0
  private jumpBufferTimer = 0
  private wasGrounded = true

  private visual: Phaser.GameObjects.Graphics
  private glow: Phaser.GameObjects.Graphics
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.body = scene.add.container(this.x, this.y)

    this.glow = scene.add.graphics()
    this.body.add(this.glow)

    this.visual = scene.add.graphics()
    this.drawLofi()
    this.body.add(this.visual)
  }

  private drawLofi() {
    const g = this.visual
    g.clear()

    // main body - chunkier
    g.fillStyle(0xf1eef8, 1)
    g.fillRoundedRect(-26, -20, 52, 46, 14)

    // head
    g.fillStyle(0xf8f6fc, 1)
    g.fillCircle(0, -32, 24)

    // ears
    g.fillStyle(0xddd6f0, 1)
    g.fillCircle(-19, -42, 10)
    g.fillCircle(19, -42, 10)

    // inner ear color
    g.fillStyle(0xa78bfa, 0.55)
    g.fillCircle(-19, -42, 4.5)
    g.fillCircle(19, -42, 4.5)

    // eyes - stronger glow
    g.fillStyle(GAME.ACCENT_GLOW, 1)
    g.fillCircle(-8, -34, 5.5)
    g.fillCircle(8, -34, 5.5)

    // pupils
    g.fillStyle(0x0a0a12, 1)
    g.fillCircle(-8, -34, 2.3)
    g.fillCircle(8, -34, 2.3)

    // mouth
    g.lineStyle(2.5, 0x2a2438, 0.8)
    g.beginPath()
    g.arc(0, -24, 7, 0.25, Math.PI - 0.25)
    g.strokePath()
  }

  requestJump() {
    if (this.dead) return
    this.jumpBufferTimer = GAME.JUMP_BUFFER
    this.tryJump()
  }

  private tryJump() {
    if (this.dead) return

    const canCoyote = this.coyoteTimer > 0
    if (this.grounded || canCoyote) {
      this.vy = GAME.JUMP_VELOCITY
      this.grounded = false
      this.coyoteTimer = 0
      this.jumpBufferTimer = 0
      this.spawnJumpParticles()
    }
  }

  step(dt: number) {
    if (this.dead) {
      this.vy += GAME.GRAVITY * dt * 0.55
      this.y += this.vy * dt
      this.body.setPosition(this.x, this.y)
      return
    }

    if (!this.grounded) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt)
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt
      this.tryJump()
    }

    this.vy += GAME.GRAVITY * dt
    this.y += this.vy * dt

    const groundY = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2

    if (this.y >= groundY) {
      this.y = groundY
      this.vy = 0

      if (!this.wasGrounded) {
        this.angle = Math.round(this.angle / 90) * 90
        this.spawnLandParticles()
      }

      this.grounded = true
      this.coyoteTimer = GAME.COYOTE_TIME
      this.wasGrounded = true
    } else {
      if (this.wasGrounded) {
        this.coyoteTimer = GAME.COYOTE_TIME
      }
      this.grounded = false
      this.wasGrounded = false
      this.angle += 520 * dt
    }

    this.body.setPosition(this.x, this.y)
    this.body.setAngle(this.angle)

    // stronger glow
    const pulse = 0.25 + Math.sin(this.scene.time.now / 240) * 0.06
    this.glow.clear()
    this.glow.fillStyle(GAME.ACCENT, pulse)
    this.glow.fillCircle(0, -8, 42)
  }

  private spawnJumpParticles() {
    for (let i = 0; i < 8; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(GAME.ACCENT_GLOW, 0.85)
      p.fillCircle(0, 0, 3.5 + Math.random() * 2.5)
      p.setPosition(this.x + (Math.random() - 0.5) * 24, this.y + 22)

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 50,
        y: p.y + 25 + Math.random() * 35,
        alpha: 0,
        scale: 0.15,
        duration: 300 + Math.random() * 140,
        ease: 'Power2',
        onComplete: () => p.destroy()
      })
    }
  }

  private spawnLandParticles() {
    for (let i = 0; i < 5; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(0xc4b5fd, 0.6)
      p.fillCircle(0, 0, 3)
      p.setPosition(this.x + (Math.random() - 0.5) * 32, this.y + 24)

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 60,
        y: p.y - 10,
        alpha: 0,
        duration: 240,
        ease: 'Power2',
        onComplete: () => p.destroy()
      })
    }
  }

  die() {
    if (this.dead) return
    this.dead = true
    this.vy = -320

    for (let i = 0; i < 18; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(GAME.ACCENT_GLOW, 0.95)
      p.fillCircle(0, 0, 2.5 + Math.random() * 3.5)
      p.setPosition(this.x, this.y)

      const angle = Math.random() * Math.PI * 2
      const speed = 90 + Math.random() * 180

      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 340 + Math.random() * 200,
        ease: 'Power3',
        onComplete: () => p.destroy()
      })
    }

    this.scene.tweens.add({
      targets: this.body,
      alpha: 0.12,
      scale: 0.5,
      duration: 180,
      ease: 'Power2'
    })

    this.scene.cameras.main.shake(180, 0.014)
  }

  reset() {
    this.x = 220
    this.y = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
    this.vy = 0
    this.grounded = true
    this.wasGrounded = true
    this.dead = false
    this.angle = 0
    this.coyoteTimer = 0
    this.jumpBufferTimer = 0
    this.body.setPosition(this.x, this.y)
    this.body.setAngle(0)
    this.body.setAlpha(1)
    this.body.setScale(1)
  }
}