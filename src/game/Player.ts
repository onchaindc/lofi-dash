import Phaser from 'phaser'
import { GAME } from './config'

export class Player {
  public body: Phaser.GameObjects.Container
  public x = 200
  public y = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
  public vy = 0
  public grounded = true
  public dead = false
  public angle = 0

  // quality-of-life timers
  private coyoteTimer = 0
  private jumpBufferTimer = 0
  private wasGrounded = true

  private visual: Phaser.GameObjects.Graphics
  private glow: Phaser.GameObjects.Graphics
  private trail: Phaser.GameObjects.Graphics[] = []
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.body = scene.add.container(this.x, this.y)

    // soft glow
    this.glow = scene.add.graphics()
    this.glow.fillStyle(GAME.ACCENT, 0.22)
    this.glow.fillCircle(0, -6, 36)
    this.body.add(this.glow)

    // Lofi
    this.visual = scene.add.graphics()
    this.drawLofi()
    this.body.add(this.visual)
  }

  private drawLofi() {
    const g = this.visual
    g.clear()

    // body
    g.fillStyle(0xece8f5, 1)
    g.fillRoundedRect(-21, -16, 42, 38, 11)

    // head
    g.fillStyle(0xf5f2fa, 1)
    g.fillCircle(0, -26, 19)

    // ears
    g.fillStyle(0xd8d2e8, 1)
    g.fillCircle(-15, -34, 7.5)
    g.fillCircle(15, -34, 7.5)

    // inner ears
    g.fillStyle(0xc4b5fd, 0.5)
    g.fillCircle(-15, -34, 3.5)
    g.fillCircle(15, -34, 3.5)

    // eyes
    g.fillStyle(GAME.ACCENT_GLOW, 1)
    g.fillCircle(-6.5, -28, 4.2)
    g.fillCircle(6.5, -28, 4.2)

    // pupils
    g.fillStyle(0x0a0a12, 1)
    g.fillCircle(-6.5, -28, 1.9)
    g.fillCircle(6.5, -28, 1.9)

    // soft smile
    g.lineStyle(2.2, 0x2e2a3a, 0.75)
    g.beginPath()
    g.arc(0, -20, 5.5, 0.2, Math.PI - 0.2)
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
      this.vy += GAME.GRAVITY * dt * 0.6
      this.y += this.vy * dt
      this.body.setPosition(this.x, this.y)
      return
    }

    // timers
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
        // just landed
        this.angle = Math.round(this.angle / 90) * 90
        this.spawnLandParticles()
      }

      this.grounded = true
      this.coyoteTimer = GAME.COYOTE_TIME
      this.wasGrounded = true
    } else {
      if (this.wasGrounded) {
        // just left ground
        this.coyoteTimer = GAME.COYOTE_TIME
      }
      this.grounded = false
      this.wasGrounded = false
      this.angle += 480 * dt
    }

    this.body.setPosition(this.x, this.y)
    this.body.setAngle(this.angle)

    // subtle glow pulse
    const pulse = 0.18 + Math.sin(this.scene.time.now / 280) * 0.04
    this.glow.clear()
    this.glow.fillStyle(GAME.ACCENT, pulse)
    this.glow.fillCircle(0, -6, 36)
  }

  private spawnJumpParticles() {
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(GAME.ACCENT_GLOW, 0.7)
      p.fillCircle(0, 0, 3 + Math.random() * 2)
      p.setPosition(this.x + (Math.random() - 0.5) * 20, this.y + 18)

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 40,
        y: p.y + 20 + Math.random() * 30,
        alpha: 0,
        scale: 0.2,
        duration: 280 + Math.random() * 120,
        ease: 'Power2',
        onComplete: () => p.destroy()
      })
    }
  }

  private spawnLandParticles() {
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(0xc4b5fd, 0.5)
      p.fillCircle(0, 0, 2.5)
      p.setPosition(this.x + (Math.random() - 0.5) * 28, this.y + 20)

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 50,
        y: p.y - 8,
        alpha: 0,
        duration: 220,
        ease: 'Power2',
        onComplete: () => p.destroy()
      })
    }
  }

  die() {
    if (this.dead) return
    this.dead = true
    this.vy = -280

    // death burst
    for (let i = 0; i < 14; i++) {
      const p = this.scene.add.graphics()
      p.fillStyle(GAME.ACCENT_GLOW, 0.9)
      p.fillCircle(0, 0, 2 + Math.random() * 3)
      p.setPosition(this.x, this.y)

      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 160

      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 320 + Math.random() * 180,
        ease: 'Power3',
        onComplete: () => p.destroy()
      })
    }

    this.scene.tweens.add({
      targets: this.body,
      alpha: 0.15,
      scale: 0.55,
      duration: 200,
      ease: 'Power2'
    })

    // camera shake
    this.scene.cameras.main.shake(160, 0.012)
  }

  reset() {
    this.x = 200
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