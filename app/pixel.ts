const OFF_DELAY = 2;
const FADE_DELAY = 8;

const LCD_BORDER_LINE_WIDTH = 4;
const CRT_SCANLINE_HEIGHT = 4;
const CRT_SCANLINES_PER_PX = 2;

const OFF_COLOR_ADJUST = 50;
const OFF_COLOR_LIGHTEN_THRESHOLD = 128;

export const PX_SCALE = 32;

enum FilterStyle {
  None,
  Lcd,
  Crt,
}

enum FlickerFix {
  None,
  DelayOff,
  Fade,
}

export type Filter = {
  name: string;
  filterStyle: FilterStyle;
  flickerFix: FlickerFix;
};

export const FILTERS: Filter[] = [
  {
    name: "No Filter",
    filterStyle: FilterStyle.None,
    flickerFix: FlickerFix.None,
  },
  {
    name: "Fix Flicker",
    filterStyle: FilterStyle.None,
    flickerFix: FlickerFix.DelayOff,
  },
  {
    name: "Fade",
    filterStyle: FilterStyle.None,
    flickerFix: FlickerFix.Fade,
  },
  {
    name: "LCD",
    filterStyle: FilterStyle.Lcd,
    flickerFix: FlickerFix.None,
  },
  {
    name: "LCD+FFix",
    filterStyle: FilterStyle.Lcd,
    flickerFix: FlickerFix.DelayOff,
  },
  {
    name: "LCD+Fade",
    filterStyle: FilterStyle.Lcd,
    flickerFix: FlickerFix.Fade,
  },
  {
    name: "CRT",
    filterStyle: FilterStyle.Crt,
    flickerFix: FlickerFix.None,
  },
  {
    name: "CRT+FFix",
    filterStyle: FilterStyle.Crt,
    flickerFix: FlickerFix.DelayOff,
  },
  {
    name: "CRT+Fade",
    filterStyle: FilterStyle.Crt,
    flickerFix: FlickerFix.Fade,
  },
];

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

function adjustOffColor(offColor: string) {
  const [r, g, b] = hexToRgb(offColor);
  const adjDir = (r + g + b) / 3 < OFF_COLOR_LIGHTEN_THRESHOLD ? 1 : -1;
  const rAdj = Math.max(0, r + adjDir * OFF_COLOR_ADJUST);
  const gAdj = Math.max(0, g + adjDir * OFF_COLOR_ADJUST);
  const bAdj = Math.max(0, b + adjDir * OFF_COLOR_ADJUST);
  return rgbToHex(rAdj, gAdj, bAdj);
}

function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
      if (filter.flickerFix === FlickerFix.Fade) {
        this.framesUntilOff = FADE_DELAY;
      } else if (filter.flickerFix === FlickerFix.DelayOff) {
        this.framesUntilOff = OFF_DELAY;
      } else {
        this.framesUntilOff = 0;
      }
    }
  }

  draw(
    x: number,
    y: number,
    onColor: string,
    offColor: string,
    filter: Filter,
    ctx: CanvasRenderingContext2D,
  ) {
    if (!this.on && filter.flickerFix === FlickerFix.Fade) {
      let mixAmount = (FADE_DELAY - this.framesUntilOff) / FADE_DELAY;
      mixAmount = clip(mixAmount, 0, 1);
      ctx.fillStyle = mixColors(onColor, offColor, mixAmount);
    } else {
      ctx.fillStyle = this.on || this.framesUntilOff > 0 ? onColor : offColor;
    }

    x *= PX_SCALE;
    y *= PX_SCALE;
    ctx.fillRect(x, y, PX_SCALE, PX_SCALE);

    if (filter.filterStyle === FilterStyle.Lcd) {
      this.lcdFilter(x, y, offColor, ctx);
    } else if (filter.filterStyle === FilterStyle.Crt) {
      this.crtFilter(x, y, offColor, ctx);
    }

    this.framesUntilOff = Math.max(0, this.framesUntilOff - 1);
  }

  lcdFilter(
    x: number,
    y: number,
    offColor: string,
    ctx: CanvasRenderingContext2D,
  ) {
    ctx.strokeStyle = adjustOffColor(offColor);
    ctx.lineWidth = LCD_BORDER_LINE_WIDTH;
    let pxSize = PX_SCALE;
    ctx.strokeRect(x, y, pxSize, pxSize);
  }

  crtFilter(
    x: number,
    y: number,
    offColor: string,
    ctx: CanvasRenderingContext2D,
  ) {
    ctx.fillStyle = adjustOffColor(offColor);
    for (let i = 0; i < CRT_SCANLINES_PER_PX; i++) {
      ctx.fillRect(
        x,
        y + (PX_SCALE / CRT_SCANLINES_PER_PX) * i,
        PX_SCALE,
        CRT_SCANLINE_HEIGHT,
      );
    }
  }
}
