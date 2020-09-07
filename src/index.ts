import { HttpError, BadRequest, InternalServerError } from './utils/errors';
import { Response, Request as ExpressRequest, Handler, NextFunction } from 'express';
import https, { RequestOptions } from 'https';
import InMemory from './caches/inmemory';
import { Engine, Request, Options, trimBy } from './utils';

export * from './utils';

export class OneAccount {
  engine: Engine
  options: Options
  authHeader?: string
  uuid?: string
  req?: Request
  // @ts-ignore
  constructor(options: Options = {}): Handler {
    this.options = options;
    this.engine = options.engine || new InMemory();
    if (this.options.callbackURL) {
      this.options.callbackURL = trimBy(this.options.callbackURL, "/")
    }
  }

  auth = async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      if (this.options.callbackURL && trimBy(req.path, "/") !== this.options.callbackURL) return next();
      this.authHeader = req.headers.authorization;
      if (!this.authHeader) {
        // handle data from the callback
        await this.save(req.body);
        return res.json({success: true});
      }
      // handle auth request
      this.uuid = req.body.uuid as string;
      const data = await this.authorize();
      if (typeof data === 'string') {
        (req as any as Request).oneaccount = JSON.parse(data);
      } else {
        (req as any as Request).oneaccount = data;
      }
      return next();
    } catch (e) {
      return next(e);
    }
  }

  private async save(body: any) {
    if (!body) throw new BadRequest('no data has been sent', 'body is empty');
    let { uuid, externalId, ...rest } = body;
    if (!uuid) throw new BadRequest('uuid is required');
    let err = await this.engine.set(uuid, JSON.stringify(rest));
    if (err && err != 'OK') throw new InternalServerError('unknown error, please try again later', 'engine error: ' + err.stack || err.message || err || 'unknown error');
  }

  private async authorize(): Promise<string> {
    if (!this.authHeader || !this.authHeader.startsWith('Bearer ')) {
      throw new BadRequest('empty or wrong bearer token');
    }
    if (!this.uuid) throw new BadRequest('uuid is not provided');
    let data: string;
    try {
      data = await this.engine.get(this.uuid);
      if (!data) throw new BadRequest('empty or wrong uuid');
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new InternalServerError('unknown error, please try again later', 'engine error: ' + err.stack || err.message);
    }
    const verified = await this.verify();
    if (!verified) throw new BadRequest('One account token verification failed');
    return data;
  }

  private async verify() {
    const data = JSON.stringify({ uuid: this.uuid });
    const options = {
      method: 'POST',
      port: 443,
      host: 'api.oneaccount.app',
      path: '/widget/verify',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data, 'utf8'),
        'Authorization': this.authHeader
      }
    };

    const response = await this.requestPromise(options, data);
    return response.statusCode === 200 && response.body && response.body.success;
  }

  private requestPromise(options: RequestOptions, data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let req = https.request(options, (res) => {
        let output = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          output += chunk;
        });

        res.on('end', () => {
          try {
            let body = JSON.parse(output);
            let response = { body, statusCode: res.statusCode };
            return resolve(response);
          } catch (e) {
            return reject(e);
          }
        });
      });
      req.on('error', (err) => {
        reject(err);
      });
      req.write(data);
      req.end();
    });
  }
}