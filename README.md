### oneaccount-express

This library is a middleware for Node.js `express` web framework.

Please follow the instructions or official documentations for an integration.
#### NOTE: example 2 is the most preferred approach for a production setup

##### Installation
```npm install -S oneaccount-express```

#### Example 1 (In Memory Engine):
`oneaccount-express` by default uses in memory cache engine if a custom engine is not supplied.
```js
const express = require('express')
const { OneAccount } = require('oneaccount-express')
const app = express()

app.use(express.json())

// The callback URL is the URL you have set when you created One account app.
// The path for the router, callbackURL 
// and callback URL of the application must be the same.
app.use(new OneAccount({
  callbackURL: '/oneaccountauth',
}))

app.post('/oneaccountauth', (req, res, next) => {
  if (!req.oneaccount) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  // user authenticated and you can implement any logic your application 
  // needs. req.oneaccount holds data sent by the user 
  // after successful authentication
  
  // since One account doesn't differentiate between sign up and sign in, 
  // you can use userId to check if the user signed up on your website or not.
  // the same way you can access any other data you requested from the user:
  const { userId, firstName } = req.oneaccount
  // any data returned here would be sent to onAuth function on front-end e.g.:
  return res.json({ firstName })
})

// OPTIONAL: in addition you can read error messages if any occured
app.use((err, req, res, next) => {
  console.error(err.devMessage)
  if (!err.status) err.status = 500
  res.status(err.status).send(err.message)
})

app.listen(process.env.PORT || 3000)
```

For brevity we will leave out comments for the following examples, 
if something is unclear please read the comments on the first example 
or check the documentation or create an issue 

Next 2 examples show how you can use any caching engine with `oneaccount-express`
this is recommended for a production environment. Both examples are used
for the same purpose the only difference is how you implement them.
We will be using `ioredis` for this example: https://github.com/luin/ioredis

#### Example 2 (Custom Engine):
For this example we will also be using `ioredis` the only difference is that
this example demonstrates how to create a custom engine
```js
const Redis = require('ioredis')
const redis = new Redis()

app.use(new OneAccount({
  engine: engine: {
    // this approach allows us to expire items so they don't pollute the caching engine
    // this approach is most prefered out of the 3 approaches
    set: (k,v)=> redis.set(k, v, "EX", 60),
    get: (k) => {
      let v = redis.get(k)
      redis.del(k)
      return v
    }
  },
  callbackURL: '/oneaccountauth',
}))

app.post('/oneaccountauth', (req, res, next) => {
  if (!req.oneaccount) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  return res.json(req.oneaccount)
})
```
Now our authentication is production ready!

#### Example 3 (Custom Engine):
```js
const Redis = require('ioredis')

app.use(new OneAccount({
  // since `ioredis` implements the Engine interface, we can use it as it is
  // although redis by default doesn't expire keys, soo example 2 is
  // preferred to this one
  engine: new Redis(),
  callbackURL: '/oneaccountauth',
}))

app.post('/oneaccountauth', (req, res, next) => {
  if (!req.oneaccount) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  return res.json(req.oneaccount)
})
```
