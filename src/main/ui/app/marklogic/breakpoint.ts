export class Breakpoint {
  uri: string;
  line: number;
  enabled: boolean;

  constructor(uri: string, line: number, enabled: boolean) {
    this.uri = uri;
    this.line = line;
    this.enabled = enabled;
  }
}
