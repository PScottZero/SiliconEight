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
        overflow: boolean,
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
        underflow: boolean,
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
        underflow: boolean,
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

    this.test("Skip If Key VX Pressed", () => {
      this.chip8.mem[0x200] = 0xea;
      this.chip8.mem[0x201] = 0x9e;
      this.chip8.mem[0x202] = 0xea;
      this.chip8.mem[0x203] = 0x9e;

      this.chip8.v[0xa] = 0xf;
      this.chip8.keys[0xf] = false;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.keys[0xf] = true;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Skip If Key VX Not Pressed", () => {
      this.chip8.mem[0x200] = 0xea;
      this.chip8.mem[0x201] = 0xa1;
      this.chip8.mem[0x202] = 0xea;
      this.chip8.mem[0x203] = 0xa1;

      this.chip8.v[0xa] = 0xf;
      this.chip8.keys[0xf] = true;
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.keys[0xf] = false;
      this.chip8.step();
      results += this.expectPCToEqual(0x206);

      return results;
    });

    this.test("Set VX = Delay", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x07;

      this.chip8.delay = 0xff;
      this.chip8.step();
      let results = this.expectVXToEqual(0xa, 0xff);

      return results;
    });

    this.test("Wait For Key Press", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x0a;
      this.chip8.mem[0x202] = 0x12;
      this.chip8.mem[0x203] = 0x00;

      this.chip8.step();
      this.chip8.step();
      let results = this.expectPCToEqual(0x202);

      this.chip8.keys[0xf] = true;
      this.chip8.step();
      results += this.expectPCToEqual(0x200);
      results += this.expectVXToEqual(0xa, 0xf);

      return results;
    });

    this.test("Set Delay = VX", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x15;

      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      let results = this.expectDelayToEqual(0xff);

      return results;
    });

    this.test("Set Sound = VX", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x18;

      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      let results = this.expectSoundToEqual(0xff);

      return results;
    });

    this.test("Set I += VX", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x1e;
      this.chip8.mem[0x202] = 0xfa;
      this.chip8.mem[0x203] = 0x1e;

      this.chip8.i = 0x101;
      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      let results = this.expectIToEqual(0x200);

      this.chip8.i = 0xfff;
      this.chip8.v[0xa] = 0xff;
      this.chip8.step();
      results += this.expectIToEqual(0x0fe);

      return results;
    });

    this.test("Set I = VX", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x29;

      this.chip8.v[0xa] = 0x01;
      this.chip8.step();
      let results = this.expectIToEqual(0x05);

      return results;
    });

    this.test("Binary Coded Decimal", () => {
      this.chip8.mem[0x200] = 0xfa;
      this.chip8.mem[0x201] = 0x29;

      this.chip8.v[0xa] = 0x01;
      this.chip8.step();
      let results = this.expectIToEqual(0x05);

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

  expectDelayToEqual(value: number): string {
    let delayHex = this.chip8.delay.toString(16);
    let valueHex = value.toString(16);
    return delayHex === valueHex
      ? `PASS delay = ${delayHex}\n`
      : `FAIL delay = ${delayHex} != ${valueHex}\n`;
  }

  expectSoundToEqual(value: number): string {
    let soundHex = this.chip8.sound.toString(16);
    let valueHex = value.toString(16);
    return soundHex === valueHex
      ? `PASS sound = ${soundHex}\n`
      : `FAIL sound = ${soundHex} != ${valueHex}\n`;
  }
}
