import { Request as ExpressRequest } from 'express';
export interface Engine {
  get(k: string): Promise<string>;
  set(k: string, v: string): Promise<any>;
}

export interface Request extends ExpressRequest {
  oneaccount?: any;
}

export interface Options {
  engine?: Engine;
  callbackURL?: string;
}
