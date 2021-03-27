import { getProject } from './modules/IDE/actions/project';
import { hideHeader, validateAndLoginUser } from './modules/User/actions';

export default function messageControl(store) {
  function messageHandler(event) {
    if (event.data && event.data.type === 'initResponse') {
      store.dispatch(validateAndLoginUser(event.data.token));
      store.dispatch(hideHeader(!event.data.showHeader));

      if (event.data.projectID && event.data.username) {
        store.dispatch(getProject(event.data.projectID, event.data.username));
      }
    }
  }

  window.addEventListener('message', messageHandler);
  window.parent.postMessage({ type: 'init' }, '*');
}
