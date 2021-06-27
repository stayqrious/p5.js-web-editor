/* eslint-disable consistent-return */
import browserHistory from '../../history';
import * as ActionTypes from '../../constants';
import apiClient from '../../utils/apiClient';
import { showErrorModal, justOpenedProject } from '../IDE/actions/ide';
import { setLanguage } from '../IDE/actions/preferences';
import { showToast, setToastText } from '../IDE/actions/toast';

export function authError(error) {
  return {
    type: ActionTypes.AUTH_ERROR,
    payload: error
  };
}

export function hideHeader(val) {
  return (dispatch) => {
    dispatch({ type: 'CONFIG_CHANGE', payload: { hideHeader: val } });
  };
}

export function signUpUser(formValues) {
  return apiClient.post('/signup', formValues);
}

export function loginUser(token) {
  return apiClient.post(
    '/login',
    {},
    { headers: { Authorization: `bearer ${token}` } }
  );
}

export function loginUserSuccess(user) {
  return {
    type: ActionTypes.AUTH_USER,
    user
  };
}

export function authenticateUser(user) {
  return {
    type: ActionTypes.AUTH_USER,
    user
  };
}

export function loginUserFailure(error) {
  return {
    type: ActionTypes.AUTH_ERROR,
    error
  };
}

export function setPreferences(preferences) {
  return {
    type: ActionTypes.SET_PREFERENCES,
    preferences
  };
}

export function validateAndLoginUser(token) {
  return (dispatch, getState) => {
    const state = getState();
    const { previousPath } = state.ide;
    return new Promise((resolve) => {
      loginUser(token)
        .then((response) => {
          dispatch(loginUserSuccess({ ...response.data, token }));
          dispatch(setPreferences(response.data.preferences));
          dispatch(
            setLanguage(response.data.preferences.language, {
              persistPreference: false
            })
          );
          dispatch(justOpenedProject());
          localStorage.setItem('token', token);
          apiClient.defaults.headers.common.Authorization = `bearer ${token}`;
          browserHistory.push(previousPath);
          resolve();
        })
        .catch((error) =>
          resolve({
            password: error.response.data.message,
            _error: 'Login failed!'
          })
        );
    });
  };
}

export function validateAndSignUpUser(formValues) {
  return (dispatch, getState) => {
    const state = getState();
    const { previousPath } = state.ide;
    return new Promise((resolve) => {
      signUpUser(formValues)
        .then((response) => {
          dispatch(authenticateUser(response.data));
          dispatch(justOpenedProject());
          browserHistory.push(previousPath);
          resolve();
        })
        .catch((error) => {
          const { response } = error;
          dispatch(authError(response.data.error));
          resolve({ error });
        });
    });
  };
}

export function getUser() {
  return (dispatch) => {
    const token = localStorage.getItem('token');
    if (!token) return dispatch(authError("Token doesn't exist"));
    apiClient
      .get('/session', {
        headers: { Authorization: `bearer ${token}` }
      })
      .then((response) => {
        dispatch({
          type: ActionTypes.AUTH_USER,
          user: { ...response.data, token }
        });
        dispatch({
          type: ActionTypes.SET_PREFERENCES,
          preferences: response.data.preferences
        });
        setLanguage(response.data.preferences.language, {
          persistPreference: false
        });
        // Setting the default header for the API client of axios.
        apiClient.defaults.headers.common.Authorization = `bearer ${token}`;
      })
      .catch((error) => {
        const { response } = error;
        const message = response.message || response.data.error;
        dispatch(authError(message));
      });
  };
}

export function validateSession() {
  return (dispatch, getState) => {
    apiClient
      .get('/session')
      .then((response) => {
        const state = getState();
        if (state.user.username !== response.data.username) {
          dispatch(showErrorModal('staleSession'));
        }
      })
      .catch((error) => {
        const { response } = error;
        if (response.status === 404) {
          dispatch(showErrorModal('staleSession'));
        }
      });
  };
}

export function resetProject(dispatch) {
  dispatch({
    type: ActionTypes.RESET_PROJECT
  });
  dispatch({
    type: ActionTypes.CLEAR_CONSOLE
  });
  browserHistory.push('/');
}

export function logoutUser() {
  return (dispatch) => {
    // Removing token from the local storage.
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common.Authorization;
    dispatch({
      type: ActionTypes.UNAUTH_USER
    });
    resetProject(dispatch);
    // apiClient.get('/logout').then(() => {});
    // .catch((error) => {
    //   const { response } = error;
    //   dispatch(authError(response.data.error));
    // });
  };
}

export function initiateResetPassword(formValues) {
  return (dispatch) =>
    new Promise((resolve) => {
      dispatch({
        type: ActionTypes.RESET_PASSWORD_INITIATE
      });
      return apiClient
        .post('/reset-password', formValues)
        .then(() => resolve())
        .catch((error) => {
          const { response } = error;
          dispatch({
            type: ActionTypes.ERROR,
            message: response.data
          });
          resolve({ error });
        });
    });
}

export function initiateVerification() {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.EMAIL_VERIFICATION_INITIATE
    });
    apiClient
      .post('/verify/send', {})
      .then(() => {
        // do nothing
      })
      .catch((error) => {
        const { response } = error;
        dispatch({
          type: ActionTypes.ERROR,
          message: response.data
        });
      });
  };
}

export function verifyEmailConfirmation(token) {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.EMAIL_VERIFICATION_VERIFY,
      state: 'checking'
    });
    return apiClient
      .get(`/verify?t=${token}`, {})
      .then((response) =>
        dispatch({
          type: ActionTypes.EMAIL_VERIFICATION_VERIFIED,
          message: response.data
        })
      )
      .catch((error) => {
        const { response } = error;
        dispatch({
          type: ActionTypes.EMAIL_VERIFICATION_INVALID,
          message: response.data
        });
      });
  };
}

export function resetPasswordReset() {
  return {
    type: ActionTypes.RESET_PASSWORD_RESET
  };
}

export function validateResetPasswordToken(token) {
  return (dispatch) => {
    apiClient
      .get(`/reset-password/${token}`)
      .then(() => {
        // do nothing if the token is valid
      })
      .catch(() =>
        dispatch({
          type: ActionTypes.INVALID_RESET_PASSWORD_TOKEN
        })
      );
  };
}

export function updatePassword(formValues, token) {
  return (dispatch) =>
    new Promise((resolve) =>
      apiClient
        .post(`/reset-password/${token}`, formValues)
        .then((response) => {
          dispatch(loginUserSuccess(response.data));
          browserHistory.push('/');
          resolve();
        })
        .catch((error) => {
          dispatch({
            type: ActionTypes.INVALID_RESET_PASSWORD_TOKEN
          });
          resolve({ error });
        })
    );
}

export function updateSettingsSuccess(user) {
  return {
    type: ActionTypes.SETTINGS_UPDATED,
    user
  };
}

export function submitSettings(formValues) {
  return apiClient.put('/account', formValues);
}

export function updateSettings(formValues) {
  return (dispatch) =>
    new Promise((resolve) =>
      submitSettings(formValues)
        .then((response) => {
          dispatch(updateSettingsSuccess(response.data));
          dispatch(showToast(5500));
          dispatch(setToastText('Toast.SettingsSaved'));
          resolve();
        })
        .catch((error) => resolve({ error }))
    );
}

export function createApiKeySuccess(user) {
  return {
    type: ActionTypes.API_KEY_CREATED,
    user
  };
}

export function createApiKey(label) {
  return (dispatch) =>
    apiClient
      .post('/account/api-keys', { label })
      .then((response) => {
        dispatch(createApiKeySuccess(response.data));
      })
      .catch((error) => {
        const { response } = error;
        Promise.reject(new Error(response.data.error));
      });
}

export function removeApiKey(keyId) {
  return (dispatch) =>
    apiClient
      .delete(`/account/api-keys/${keyId}`)
      .then((response) => {
        dispatch({
          type: ActionTypes.API_KEY_REMOVED,
          user: response.data
        });
      })
      .catch((error) => {
        const { response } = error;
        Promise.reject(new Error(response.data.error));
      });
}

export function unlinkService(service) {
  return (dispatch) => {
    if (!['github', 'google'].includes(service)) return;
    apiClient
      .delete(`/auth/${service}`)
      .then((response) => {
        dispatch({
          type: ActionTypes.AUTH_USER,
          user: response.data
        });
      })
      .catch((error) => {
        const { response } = error;
        const message = response.message || response.data.error;
        dispatch(authError(message));
      });
  };
}
