import { Dispatch, Action, Middleware, MiddlewareAPI } from 'redux'
import createReducer from './utils/createReducer'

const NO_CONTROLLER = '@@sw/NO_CONTROLLER'
const CONTROLLER_CHANGE = '@@sw/CONTROLLER_CHANGE'
const CONTROLLER_ATTACHED = '@@sw/CONTROLLER_ATTACHED'
const MESSAGE = '@@sw/MESSAGE'
const UPDATE = '@@sw/UPDATE'
const SUCCESS = '@@sw/SUCCESS'

interface SwAction<T = any> extends Action<T> {
  payload: any
  meta: any
}

function createMiddleware(
  swUrl: string,
  options: RegistrationOptions
): Middleware {
  if (!('serviceWorker' in navigator)) {
    return () => (next: Dispatch) => (action: Action) => next(action)
  }

  const promise = navigator.serviceWorker.register(swUrl, options)

  return function(store: MiddlewareAPI) {
    navigator.serviceWorker.oncontrollerchange = event => {
      console.log('Controller loaded', event)
      store.dispatch({ type: CONTROLLER_CHANGE })
    }

    navigator.serviceWorker.onmessage = event => {
      if ('type' in event.data) {
        store.dispatch(event.data)
      } else {
        store.dispatch({ type: MESSAGE, payload: event.data })
      }
    }

    promise
      .then(registration => {
        console.log(
          'service worker controler',
          navigator.serviceWorker.controller
        )

        if (!navigator.serviceWorker.controller) {
          // The window client isn't currently controlled so it's a new service
          // worker that will activate immediately
          console.log('no sw controller')
          store.dispatch({ type: NO_CONTROLLER, meta: { registration } })
        } else {
          store.dispatch({ type: CONTROLLER_ATTACHED, meta: { registration } })
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (installingWorker == null) {
            return
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the updated precached content has been fetched,
                // but the previous service worker will still serve the older
                // content until all client tabs are closed.
                console.log(
                  'New content is available and will be used when all tabs for this page are closed.'
                )

                store.dispatch({ type: UPDATE, meta: { registration } })
              } else {
                // At this point, everything has been precached.
                // It's the perfect time to display a
                // "Content is cached for offline use." message.
                console.log('Content is cached for offline use.')

                store.dispatch({ type: SUCCESS, meta: { registration } })
              }
            }
          }
        }
      })
      .catch(error => {
        console.error('Error during service worker registration:', error)
        store.dispatch({ type: NO_CONTROLLER, meta: { error } })
      })

    return (next: Dispatch) => (action: SwAction) => {
      const controller = navigator.serviceWorker.controller

      if (controller != null) {
        if (action.meta && action.meta.ServiceWorker) {
          controller.postMessage(action)
        }

        return next(action)
      }
    }
  }
}

const initialState = {
  status: 'waiting',
  new: false,
  changed: false
}

const reducer = createReducer(initialState)({
  [NO_CONTROLLER]: state => ({ ...state, status: 'unavailable' }),
  [CONTROLLER_ATTACHED]: state => ({ ...state, status: 'available' }),
  [UPDATE]: state => ({ ...state, new: true }),
  [CONTROLLER_CHANGE]: state => ({ ...state, changed: true })
})

export { reducer }

export default createMiddleware
