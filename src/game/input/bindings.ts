import { EMPTY_INTENT, type Intent } from '../sim/types'

const FORWARD = new Set(['KeyW', 'ArrowUp'])
const LEFT = new Set(['KeyA', 'ArrowLeft'])
const RIGHT = new Set(['KeyD', 'ArrowRight'])
const FRONT = new Set(['Space'])
const BROADSIDE_LEFT = new Set(['KeyQ'])
const BROADSIDE_RIGHT = new Set(['KeyE'])

export const GAME_KEY_CODES = new Set([
  ...FORWARD,
  ...LEFT,
  ...RIGHT,
  ...FRONT,
  ...BROADSIDE_LEFT,
  ...BROADSIDE_RIGHT,
  'Escape',
])

export class InputController {
  private readonly held = new Set<string>()
  private readonly touch = { ...EMPTY_INTENT }

  keyDown(code: string): void {
    this.held.add(code)
  }

  keyUp(code: string): void {
    this.held.delete(code)
  }

  setTouch(partial: Partial<Intent>): void {
    Object.assign(this.touch, partial)
  }

  clear(): void {
    this.held.clear()
    Object.assign(this.touch, EMPTY_INTENT)
  }

  intent(): Intent {
    return {
      forward: this.isHeld(FORWARD) || this.touch.forward,
      rotateLeft: this.isHeld(LEFT) || this.touch.rotateLeft,
      rotateRight: this.isHeld(RIGHT) || this.touch.rotateRight,
      fireFront: this.isHeld(FRONT) || this.touch.fireFront,
      fireLeft: this.isHeld(BROADSIDE_LEFT) || this.touch.fireLeft,
      fireRight: this.isHeld(BROADSIDE_RIGHT) || this.touch.fireRight,
    }
  }

  private isHeld(codes: Set<string>): boolean {
    for (const code of codes) {
      if (this.held.has(code)) return true
    }
    return false
  }
}
