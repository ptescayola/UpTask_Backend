import { CorsOptions } from 'cors'

export const corsConfig: CorsOptions = {
  origin: function(origin, callback) {
    const whitelist = [process.env.FRONTEND_URL]

    // if (process.argv[2] === '--api') {
      whitelist.push(undefined)
    // }

    console.log('whitelist', whitelist)
    console.log('origin', origin)

    if (whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS Error'))
    }
  }
}
