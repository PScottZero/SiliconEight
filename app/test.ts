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

    this.test("Assign Program Counter", () => {
      this.chip8.mem[0x200] = 0x1f;
      this.chip8.mem[0x201] = 0xfe;

      this.chip8.step();
      let results = this.expectPCToEqual(0xffe);

      return results;
    });

    this.test("Skip If Reg X = NN", () => {
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

    this.test("Skip If Reg X != NN", () => {
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

    this.test("Skip If Reg X = Reg Y", () => {
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
  }

  test(name: string, f: Function) {
    this.chip8.reset();
    let results = f();
    if (results.length === 0) results += "PASS\n";
    results = name + ":\n" + results;
    console.log(results);
  }

  expectPCToEqual(value: number): string {
    return this.chip8.pc !== value
      ? "FAILED !!!! pc = " +
          this.chip8.pc.toString(16) +
          " != " +
          value.toString(16) +
          "\n"
      : "";
  }
}
