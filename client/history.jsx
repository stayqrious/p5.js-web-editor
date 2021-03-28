import { browserHistory, createMemoryHistory } from 'react-router';

const history =
  window.location.href === 'about:srcdoc'
    ? createMemoryHistory()
    : browserHistory;

export default history;
