import { Middleware } from 'redux'
import mixpanel from 'mixpanel-browser'

interface MixpanelMeta {}

export default function createMiddleware(
  token: string,
  config: mixpanel.Config
): Middleware {
  const instance = mixpanel.init(token, config)

  function setUser(key: string, value: string | number, once: boolean) {
    const methodKey = once ? 'set_once' : 'set'
    instance.people[methodKey](key, value)
  }

  return store => next => action => next(action)
}
