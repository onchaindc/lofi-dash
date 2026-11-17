import Phaser from 'phaser'
import { GAME } from './config'

export class Player {
  public body: Phaser.GameObjects.Container
  public x = 180
  public y = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
  public vy = 0
  public grounded = true
  public dead = false
  public angle = 0

  private visual: Phaser.GameObjects.Graphics
  private glow: Phaser.GameObjects.Graphics
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.body = scene.add.container(this.x, this.y)

    // soft glow behind Lofi
    this.glow = scene.add.graphics()
    this.glow.fillStyle(GAME.ACCENT, 0.18)
    this.glow.fillCircle(0, 0, 38)
    this.body.add(this.glow)

    // Lofi the Yeti — simple geometric form
    this.visual = scene.add.graphics()
    this.drawLofi()
    this.body.add(this.visual)
  }

  private drawLofi() {
    const g = this.visual
    g.clear()

    // body (chunky yeti)
    g.fillStyle(0xe8e4f0, 1)
    g.fillRoundedRect(-22, -18, 44, 40, 12)

    // head
    g.fillStyle(0xf0ecf8, 1)
    g.fillCircle(0, -28, 20)

    // ears
    g.fillStyle(0xd4cfe0, 1)
    g.fillCircle(-16, -36, 8)
    g.fillCircle(16, -36, 8)

    // eyes (glowing)
    g.fillStyle(GAME.ACCENT, 1)
    g.fillCircle(-7, -30, 4)
    g.fillCircle(7, -30, 4)

    // pupils
    g.fillStyle(0x0a0a12, 1)
    g.fillCircle(-7, -30, 1.8)
    g.fillCircle(7, -30, 1.8)

    // soft smile
    g.lineStyle(2, 0x2a2a3a, 0.7)
    g.beginPath()
    g.arc(0, -22, 6, 0.15, Math.PI - 0.15)
    g.strokePath()
  }

  jump() {
    if (this.dead) return
    if (this.grounded) {
      this.vy = GAME.JUMP_VELOCITY
      this.grounded = false
    }
  }

  /** fixed timestep physics step */
  step(dt: number) {
    if (this.dead) return

    // constant forward movement is handled by the world scrolling
    // we only manage vertical here

    this.vy += GAME.GRAVITY * dt
    this.y += this.vy * dt

    // ground collision
    const groundY = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
    if (this.y >= groundY) {
      this.y = groundY
      this.vy = 0
      this.grounded = true
      // snap rotation on land — this is the GD trick
      this.angle = Math.round(this.angle / 90) * 90
    } else {
      this.grounded = false
      // cosmetic spin while airborne
      this.angle += 420 * dt
    }

    this.body.setPosition(this.x, this.y)
    this.body.setAngle(this.angle)
  }

  die() {
    if (this.dead) return
    this.dead = true
    this.vy = -200

    // quick visual feedback
    this.scene.tweens.add({
      targets: this.body,
      alpha: 0.3,
      scale: 0.7,
      duration: 180,
      ease: 'Power2'
    })
  }

  reset() {
    this.x = 180
    this.y = GAME.GROUND_Y - GAME.PLAYER_SIZE / 2
    this.vy = 0
    this.grounded = true
    this.dead = false
    this.angle = 0
    this.body.setPosition(this.x, this.y)
    this.body.setAngle(0)
    this.body.setAlpha(1)
    this.body.setScale(1)
  }
}