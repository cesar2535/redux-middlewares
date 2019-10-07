import { Action } from 'redux'

type reduceFunction<S> = (state: S, action: Action) => S
type ReducerMap<S> = {
  [key: string]: reduceFunction<S>
}

export default <S = any>(initialState: S) => (reducerMap: ReducerMap<S>) => (
  state = initialState,
  action: Action
) => {
  const reducer = reducerMap[action.type]
  return reducer ? reducer(state, action) : state
}
