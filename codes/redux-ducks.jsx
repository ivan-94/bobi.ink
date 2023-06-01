export const moduleName = 'auth';

export const types = {
  AUTO_LOGIN: 'AUTH/AUTH_AUTO_LOGIN',
  SIGNUP_REQUEST: 'AUTH/SIGNUP_REQUEST',
  // …
};

export const initialState = {
  user: null,
  isLoading: false,
  error: null,
};

export const actions = {
  signup: (email, password) => ({ type: SIGNUP_REQUEST, email, password }),
  login: (email, password) => ({ type: actionTypes.LOGIN_REQUEST, email, password }),
  logout: () => ({ type: actionTypes.LOGOUT }),
};

export const selectors = {
  getUser: state => state[moduleName].user,
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SIGNUP_REQUEST:
    case types.LOGIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    // …
    default:
      return state;
  }
};
