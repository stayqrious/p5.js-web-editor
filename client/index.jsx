import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import history from './history';
import './i18n';
import messageControl from './messageControl';
import Loader from './modules/App/components/loader';
import ThemeProvider from './modules/App/components/ThemeProvider';
import routes from './routes';
import configureStore from './store';

require('./styles/main.scss');

// Load the p5 png logo, so that webpack will use it
require('./images/p5js-square-logo.png');

const initialState = window.__INITIAL_STATE__;

const store = configureStore(initialState);

const App = () => (
  <Provider store={store}>
    <ThemeProvider>
      <Router history={history} routes={routes(store)} />
    </ThemeProvider>
  </Provider>
);

messageControl(store);

const HotApp = hot(App);

render(
  <Suspense fallback={<Loader />}>
    <HotApp />
  </Suspense>,
  document.getElementById('root')
);
