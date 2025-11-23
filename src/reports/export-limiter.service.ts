import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportLimiterService {
  private activeExports = 0;
  private readonly maxExports = 2; // ajusta según tu entorno

  acquire(): boolean {
    if (this.activeExports >= this.maxExports) {
      return false;
    }
    this.activeExports++;
    return true;
  }

  release(): void {
    if (this.activeExports > 0) {
      this.activeExports--;
    }
  }

  getActive(): number {
    return this.activeExports;
  }
}
