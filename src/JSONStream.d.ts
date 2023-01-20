declare module 'JSONStream' {
  import { ThroughStream } from 'through';
  export function parse(path: any, map: any): ThroughStream;
}
