import Phaser from 'phaser'
import { Boot } from './game/scenes/Boot'
import { Game } from './game/scenes/Game'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#08080f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Boot, Game],
  input: {
    activePointers: 3
  },
  fps: {
    target: 120,
    forceSetTimeOut: false
  }
}

new Phaser.Game(config)