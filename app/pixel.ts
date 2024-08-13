const OFF_DELAY = 2;
const FADE_DELAY = 10;
export const PX_SCALE = 32;
const SCANLINE_HEIGHT = 6;
const SCANLINE_COLOR = "#111";
const SCANLINES_PER_PX = 2;

export enum Filter {
  None = "No Filter",
  FixFlicker = "Fix Flicker",
  Fade = "Fade",
  CRT1 = "CRT 1",
  CRT2 = "CRT 2",
}

const FADE_FILTERS = [Filter.Fade, Filter.CRT1, Filter.CRT2];
const CRT_FILTERS = [Filter.CRT1, Filter.CRT2];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

function mixColors(c1: string, c2: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const rMix = Math.round(r1 + (r2 - r1) * amount);
  const gMix = Math.round(g1 + (g2 - g1) * amount);
  const bMix = Math.round(b1 + (b2 - b1) * amount);
  return rgbToHex(rMix, gMix, bMix);
}

export class Pixel {
  on: boolean;
  framesUntilOff: number;

  constructor() {
    this.on = false;
    this.framesUntilOff = 0;
  }

  turnOn() {
    this.on = true;
    this.framesUntilOff = 0;
  }

  turnOff(filter: Filter) {
    if (this.on) {
      this.on = false;
      this.framesUntilOff = FADE_FILTERS.includes(filter)
        ? FADE_DELAY
        : filter === Filter.FixFlicker
          ? OFF_DELAY
          : 0;
    }
  }

  draw(
    x: number,
    y: number,
    onColor: string,
    offColor: string,
    filter: Filter,
    ctx: CanvasRenderingContext2D
  ) {
    if (!this.on && FADE_FILTERS.includes(filter)) {
      let mixAmount = (FADE_DELAY - this.framesUntilOff) / FADE_DELAY;
      mixAmount = Math.min(Math.max(0, mixAmount), 1);
      ctx.fillStyle = mixColors(onColor, offColor, mixAmount);
    } else {
      ctx.fillStyle = this.on || this.framesUntilOff > 0 ? onColor : offColor;
    }

    x *= PX_SCALE;
    y *= PX_SCALE;
    ctx.fillRect(x, y, PX_SCALE, PX_SCALE);
    if (CRT_FILTERS.includes(filter)) {
      ctx.fillStyle = filter === Filter.CRT1 ? SCANLINE_COLOR : offColor;
      for (let i = 0; i < SCANLINES_PER_PX; i++) {
        ctx.fillRect(
          x,
          y + (PX_SCALE / SCANLINES_PER_PX) * (i + 1) - SCANLINE_HEIGHT,
          PX_SCALE,
          SCANLINE_HEIGHT
        );
      }
    }

    this.framesUntilOff = Math.max(0, this.framesUntilOff - 1);
  }
}
