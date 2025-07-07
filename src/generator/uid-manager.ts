
// -------------------
// filename: src/generator/uid-manager.ts
// -------------------
export class UidManager {
  private currentId: number;
  constructor(startId: number = 0) {
    this.currentId = startId;
  }
  public next(): number {
    return this.currentId++;
  }
}