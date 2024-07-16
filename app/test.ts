import { Chip8Interpreter } from "./interpreter";

export class Chip8Tests {
  chip8: Chip8Interpreter;

  constructor(ctx: CanvasRenderingContext2D) {
    this.chip8 = new Chip8Interpreter(ctx);

    this.test("Subroutine Call + Return", () => {
      this.chip8.mem[0x200] = 0x2f;
      this.chip8.mem[0x201] = 0xfe;
      this.chip8.mem[0xffe] = 0x00;
      this.chip8.mem[0xfff] = 0xee;

      this.chip8.step();
      let results = this.expectPCToEqual(0xffe);
      this.chip8.step();
      results += this.expectPCToEqual(0x202);

      return results;
    });

    this.test("Subroutine Call + Return", () => {
      this.chip8.mem[0x200] = 0x23;
      this.chip8.mem[0x201] = 0x00;
      this.chip8.mem[0x300] = 0x2f;
      this.chip8.mem[0x301] = 0xfe;
      this.chip8.mem[0x302] = 0x00;
      this.chip8.mem[0x303] = 0xee;
      this.chip8.mem[0xffe] = 0x00;
      this.chip8.mem[0xfff] = 0xee;

      this.chip8.step();
      let results = this.expectPCToEqual(0x300);

      this.chip8.step();
      results += this.expectPCToEqual(0xffe);

      this.chip8.step();
      results += this.expectPCToEqual(0x302);

      this.chip8.step();
      results += this.expectPCToEqual(0x202);

      return results;
    });

    this.test("Set PC = NNN", () => {
      this.chip8.mem[0x200] = 0x1f;
      this.chip8.mem[0x201] = 0xfe;

      this.chip8.step();
      let results = this.expectPCToEqual(0xffe);

      return results;
    });

    this.test("Skip If VX = NN", () => {
      this.chip8.mem[0x200] = 0x3a;
      this.chip8.mem[0x201] = 0xff;
      this.chip8.mem[0x202] = 0x3a;
      this.chip8.mem[0x203] = 0xff;

      this.chip8.v[0xa] = 0x00;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Skip If VX != NN", () => {
      this.chip8.mem[0x200] = 0x4a;
      this.chip8.mem[0x201] = 0xff;
      this.chip8.mem[0x202] = 0x4a;
      this.chip8.mem[0x203] = 0xff;

      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.v[0xa] = 0x00;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Skip If VX = VY", () => {
      this.chip8.mem[0x200] = 0x5a;
      this.chip8.mem[0x201] = 0xb0;
      this.chip8.mem[0x202] = 0x5a;
      this.chip8.mem[0x203] = 0xb0;

      this.chip8.v[0xa] = 0x00;
      this.chip8.v[0xb] = 0xff;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.v[0xa] = 0xff;
      this.chip8.v[0xb] = 0xff;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Set VX = NN", () => {
      this.chip8.mem[0x200] = 0x6a;
      this.chip8.mem[0x201] = 0xff;

      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0xff);

      return results;
    });

    this.test("Set VX += NN", () => {
      this.chip8.mem[0x200] = 0x7a;
      this.chip8.mem[0x201] = 0xff;

      this.chip8.v[0xa] = 0x02;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0x01);

      return results;
    });

    this.test("Set VX = VY", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xb0;

      this.chip8.v[0xb] = 0xff;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0xff);

      return results;
    });

    this.test("Set VX |= VY", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xb1;

      this.chip8.v[0xa] = 0x55;
      this.chip8.v[0xb] = 0xaa;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0xff);

      return results;
    });

    this.test("Set VX &= VY", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xb2;

      this.chip8.v[0xa] = 0xff;
      this.chip8.v[0xb] = 0xaa;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0xaa);

      return results;
    });

    this.test("Set VX ^= VY", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xb3;

      this.chip8.v[0xa] = 0xff;
      this.chip8.v[0xb] = 0xaa;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0x55);

      return results;
    });

    this.test("Set VX += VY", () => {
      const addTest = (
        xVal: number,
        yVal: number,
        expected: number,
        overflow: boolean
      ): string => {
        this.chip8.reset();

        this.chip8.mem[0x200] = 0x8a;
        this.chip8.mem[0x201] = 0xb4;

        this.chip8.v[0xa] = xVal;
        this.chip8.v[0xb] = yVal;
        this.chip8.step();

        let results = this.expectVXToEqual(0xa, expected);
        results += this.expectVXToEqual(0xf, overflow ? 1 : 0);

        return results;
      };

      let results = addTest(0x12, 0x34, 0x46, false);
      results += addTest(0xff, 0x01, 0x00, true);
      results += addTest(0xff, 0x00, 0xff, false);
      results += addTest(0x00, 0xff, 0xff, false);

      return results;
    });

    this.test("Set VX -= VY", () => {
      const addTest = (
        xVal: number,
        yVal: number,
        expected: number,
        underflow: boolean
      ): string => {
        this.chip8.reset();

        this.chip8.mem[0x200] = 0x8a;
        this.chip8.mem[0x201] = 0xb5;

        this.chip8.v[0xa] = xVal;
        this.chip8.v[0xb] = yVal;
        this.chip8.step();

        let results = this.expectVXToEqual(0xa, expected);
        results += this.expectVXToEqual(0xf, underflow ? 0 : 1);

        return results;
      };

      let results = addTest(0x46, 0x34, 0x12, false);
      results += addTest(0x00, 0xff, 0x01, true);
      results += addTest(0xff, 0xff, 0x00, false);
      results += addTest(0xfe, 0xff, 0xff, true);
      results += addTest(0xff, 0x00, 0xff, false);

      return results;
    });

    this.test("Set VX >>= 1", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xb6;
      this.chip8.mem[0x202] = 0x8a;
      this.chip8.mem[0x203] = 0xb6;

      this.chip8.v[0xa] = 0x7d;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0x3e);
      results += this.expectVXToEqual(0xf, 1);

      this.chip8.step();
      results += this.expectVXToEqual(0xa, 0x1f);
      results += this.expectVXToEqual(0xf, 0);

      return results;
    });

    this.test("Set VX = VY - VX", () => {
      const addTest = (
        xVal: number,
        yVal: number,
        expected: number,
        underflow: boolean
      ): string => {
        this.chip8.reset();

        this.chip8.mem[0x200] = 0x8a;
        this.chip8.mem[0x201] = 0xb7;

        this.chip8.v[0xa] = xVal;
        this.chip8.v[0xb] = yVal;
        this.chip8.step();

        let results = this.expectVXToEqual(0xa, expected);
        results += this.expectVXToEqual(0xf, underflow ? 0 : 1);

        return results;
      };

      let results = addTest(0x34, 0x46, 0x12, false);
      results += addTest(0xff, 0x00, 0x01, true);
      results += addTest(0xff, 0xff, 0x00, false);
      results += addTest(0xff, 0xfe, 0xff, true);
      results += addTest(0x00, 0xff, 0xff, false);

      return results;
    });

    this.test("Set VX <<= 1", () => {
      this.chip8.mem[0x200] = 0x8a;
      this.chip8.mem[0x201] = 0xbe;
      this.chip8.mem[0x202] = 0x8a;
      this.chip8.mem[0x203] = 0xbe;

      this.chip8.v[0xa] = 0xbe;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0x7c);
      results += this.expectVXToEqual(0xf, 1);

      this.chip8.step();
      results += this.expectVXToEqual(0xa, 0xf8);
      results += this.expectVXToEqual(0xf, 0);

      return results;
    });

    this.test("Skip If VX != VY", () => {
      this.chip8.mem[0x200] = 0x9a;
      this.chip8.mem[0x201] = 0xb0;
      this.chip8.mem[0x202] = 0x9a;
      this.chip8.mem[0x203] = 0xb0;

      this.chip8.v[0xa] = 0xff;
      this.chip8.v[0xb] = 0xff;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.v[0xa] = 0xff;
      this.chip8.v[0xb] = 0x00;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Set I = NNN", () => {
      this.chip8.mem[0x200] = 0xaf;
      this.chip8.mem[0x201] = 0xff;

      this.chip8.step();
      let results = this.expectIToEqual(0xfff);

      return results;
    });

    this.test("Set PC = V0 + NNN", () => {
      this.chip8.mem[0x200] = 0xbf;
      this.chip8.mem[0x201] = 0x00;
      this.chip8.mem[0xffe] = 0xbf;
      this.chip8.mem[0xfff] = 0xff;

      this.chip8.v[0] = 0xfe;
      this.chip8.step();
      let results = this.expectPCToEqual(0xffe);

      this.chip8.v[0] = 0x01;
      this.chip8.step();
      results += this.expectPCToEqual(0x000);

      return results;
    });

    this.test("Set PC = V0 + NNN", () => {
      this.chip8.mem[0x200] = 0xbf;
      this.chip8.mem[0x201] = 0x00;
      this.chip8.mem[0xffe] = 0xbf;
      this.chip8.mem[0xfff] = 0xff;

      this.chip8.v[0] = 0xfe;
      this.chip8.step();
      let results = this.expectPCToEqual(0xffe);

      this.chip8.v[0] = 0x01;
      this.chip8.step();
      results += this.expectPCToEqual(0x000);

      return results;
    });

    this.test("Draw Sprite", async () => {
      this.chip8.mem[0x200] = 0xda;
      this.chip8.mem[0x201] = 0xbf;
      this.chip8.mem[0x202] = 0x12;
      this.chip8.mem[0x203] = 0x00;

      const sprite1Addr = 0x300;
      for (let i = 0; i < 8; i++) {
        this.chip8.mem[sprite1Addr + 2 * i] = 0xaa;
        this.chip8.mem[sprite1Addr + 2 * i + 1] = 0x55;
      }

      const sprite2Addr = 0x310;
      for (let i = 0; i < 8; i++) {
        this.chip8.mem[sprite2Addr + 2 * i] = 0x55;
        this.chip8.mem[sprite2Addr + 2 * i + 1] = 0xaa;
      }

      this.chip8.v[0xa] = 0;
      this.chip8.v[0xb] = 0;

      this.chip8.i = sprite1Addr;
      this.chip8.step();
      this.chip8.step();
      let results = this.expectVXToEqual(0xf, 0);

      this.chip8.renderFrame();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.chip8.i = sprite2Addr;
      this.chip8.step();
      this.chip8.step();
      results += this.expectVXToEqual(0xf, 0);

      this.chip8.renderFrame();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.chip8.i = sprite1Addr;
      this.chip8.step();
      this.chip8.step();
      results += this.expectVXToEqual(0xf, 1);

      this.chip8.renderFrame();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.chip8.v[0xa] = 57;
      this.chip8.v[0xb] = 30;
      this.chip8.i = sprite2Addr;
      this.chip8.step();
      this.chip8.step();
      results += this.expectVXToEqual(0xf, 0);

      this.chip8.renderFrame();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(results);

      return results;
    });
  }

  test(name: string, f: Function) {
    this.chip8.reset();
    let results = f();
    if (results.length === 0) results += "PASS\n";
    results = `:::::::: ${name} ::::::::\n${results}`;
    console.log(results);
  }

  expectPCToEqual(value: number): string {
    let pcHex = this.chip8.pc.toString(16);
    let valueHex = value.toString(16);
    return pcHex === valueHex
      ? `PASS pc = ${pcHex}\n`
      : `FAIL pc = ${pcHex} != ${valueHex}\n`;
  }

  expectIToEqual(value: number): string {
    let iHex = this.chip8.i.toString(16);
    let valueHex = value.toString(16);
    return iHex === valueHex
      ? `PASS i = ${iHex}\n`
      : `FAIL i = ${iHex} != ${valueHex}\n`;
  }

  expectVXToEqual(x: number, value: number): string {
    let xHex = x.toString(16);
    let vxHex = this.chip8.v[x].toString(16);
    let valueHex = value.toString(16);
    return vxHex === valueHex
      ? `PASS v[${xHex}] = ${vxHex}\n`
      : `FAIL v[${xHex}] = ${vxHex} != ${valueHex}\n`;
  }
}
