import Phaser from 'phaser'

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // nothing heavy yet — pure code for now
  }

  create() {
    this.scene.start('Game')
  }
}