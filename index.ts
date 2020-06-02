// This is an example of how to use the package
import OneAccount, { HttpError, Request } from './src'
import { Request as ExpressRequest, Response, NextFunction } from 'express'

import express from 'express'
const app = express()

app.use(express.json())

// @ts-ignore
app.use(new OneAccount({
  callbackURL: '/oneaccountauth',
}))

app.post('/oneaccountauth', (request: ExpressRequest, res: Response, next: NextFunction) => {
  let req = request as any as Request
  if (!req.oneaccount) {
    // save to database or update
    return res.status(401).json({ error: 'unauthorized' })
  }
  return res.json(req.oneaccount)
})

app.use((err: HttpError, req: ExpressRequest, res: Response, next: NextFunction) => {
  console.error(err.devMessage) // Log dev error message in our server's console
  if (!err.status) err.status = 500 // If err has no specified error code, set error code to 'Internal Server Error (500)'
  res.status(err.status).send(err.message)
})

app.listen(process.env.PORT || 3000)