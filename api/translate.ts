import { chain } from '@amaurym/now-middleware'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Logger } from '../services/logging/Logging.logger'
import cors from 'cors'
import {
  returnEndpointPayload,
  transformRequest,
  returnHttpJson,
  handleRejections,
} from '../services/http/Http.facilitators'
import { translateTriage, translateService } from '../services/translator/Translator.service'
import { redisGet, redisSet } from '../services/redis/Redis.actions'

const handler = (req: VercelRequest, res: VercelResponse): void => {
  Promise.resolve(transformRequest(req, res))
    .then(returnEndpointPayload)
    .then((translateData) => {
      Logger.info('Payload normalized::')
      Logger.info(JSON.stringify(translateData))
      return translateData
    })
    .then(translateTriage)
    .then((translateData) => {
      Logger.info('Triage done. Continuing::')
      return translateData
    })
    .then(redisGet)
    .then((translateData) => {
      Logger.info('No Cache found. Continuing::')
      return translateData
    })
    .then(translateService)
    .then((translateResponse) => {
      Logger.info('Translate service completed::')
      Logger.info(JSON.stringify(translateResponse))
      return translateResponse
    })
    .then(redisSet)
    .then((translateResponse) => {
      Logger.info('Cache set successfully::')
      return translateResponse
    })
    .then((translateReponse) => {
      return returnHttpJson(res, 200, {
        information: 'Translation successful!',
        translation: translateReponse,
      })
    })
    .catch(handleRejections(res))
}

export default chain(cors())(handler)
