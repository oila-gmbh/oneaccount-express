import { Engine } from "../utils";

export class InMemory implements Engine {
  authenticatingUsers: any = {};
  timeout: number = 1000 * 60;
  cronInterval: number = 1000 * 5;
  constructor() {
    setInterval(() => {
      const time = Date.now();
      for (let k in this.authenticatingUsers) {
        if (time > this.authenticatingUsers[k].time + this.timeout) delete this.authenticatingUsers[k];
      };
    }, this.cronInterval)
  }

  async set(k: string, v: string) {
    this.authenticatingUsers[k] = {
      v,
      time: Date.now()
    };
  }

  async get(k: string) {
    let v = { ...this.authenticatingUsers[k] };
    if (!v || Date.now() > v.time + this.timeout) return;
    delete this.authenticatingUsers[k];
    if (v) v = v.v;
    return v;
  }
}

export default InMemory;