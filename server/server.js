import Express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
// import session from 'express-session';
// import connectMongo from 'connect-mongo';
import passport from 'passport';
import path from 'path';
// import basicAuth from 'express-basic-auth';

// Webpack Requirements
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../webpack/config.dev';

// Import all required modules
import api from './routes/api.routes';
import users from './routes/user.routes';
import sessions from './routes/session.routes';
import projects from './routes/project.routes';
import files from './routes/file.routes';
import collections from './routes/collection.routes';
import aws from './routes/aws.routes';
import serverRoutes from './routes/server.routes';
import embedRoutes from './routes/embed.routes';
import assetRoutes from './routes/asset.routes';
import passportRoutes from './routes/passport.routes';
import { requestsOfTypeJSON } from './utils/requestsOfType';

import { renderIndex } from './views/index';
import { get404Sketch } from './views/404Page';

const app = new Express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.05
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// const MongoStore = connectMongo(session);

app.get('/health', (req, res) => res.json({ success: true }));

const allowedCorsOrigins = [/stayqrious\.(com|net)(:\d+)?$/];

// to allow client-only development
if (process.env.CORS_ALLOW_LOCALHOST === 'true') {
  allowedCorsOrigins.push(/localhost/);
}

// Run Webpack dev server in development mode
if (process.env.NODE_ENV === 'development') {
  const compiler = webpack(config);
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath
    })
  );
  app.use(webpackHotMiddleware(compiler));
}

const mongoConnectionString = process.env.MONGO_URL;
app.set('trust proxy', true);

// Enable Cross-Origin Resource Sharing (CORS) for all origins
const corsMiddleware = cors({
  credentials: true,
  // Uncomment the below line at the time of deployment
  origin: allowedCorsOrigins
});
app.use(corsMiddleware);
// Enable pre-flight OPTIONS route for all end-points
app.options('*', corsMiddleware);

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
// app.use(
//   session({
//     resave: true,
//     saveUninitialized: false,
//     secret: process.env.SESSION_SECRET,
//     proxy: true,
//     name: 'sessionId',
//     cookie: {
//       // Same site cookie set to 'None' for an explicit cross-site cookie.
//       // sameSite: 'none',
//       httpOnly: true,
//       // httpOnly: true,
//       secure: false
//     },
//     store: new MongoStore({
//       mongooseConnection: mongoose.connection,
//       autoReconnect: true
//     })
//   })
// );

app.use('/api/v1', requestsOfTypeJSON(), api);
// This is a temporary way to test access via Personal Access Tokens
// Sending a valid username:<personal-access-token> combination will
// return the user's information.
// app.get(
//   '/api/v1/auth/access-check',
//   passport.authenticate('basic', { session: false }),
//   (req, res) => res.json(req.user)
// );

// For basic auth, but can't have double basic auth for API
// if (process.env.BASIC_USERNAME && process.env.BASIC_PASSWORD) {
//   app.use(
//     basicAuth({
//       users: {
//         [process.env.BASIC_USERNAME]: process.env.BASIC_PASSWORD
//       },
//       challenge: true
//     })
//   );
// }

// Body parser, cookie parser, sessions, serve public assets
app.use(
  '/locales',
  Express.static(path.resolve(__dirname, '../dist/static/locales'), {
    // Browsers must revalidate for changes to the locale files
    // It doesn't actually mean "don't cache this file"
    // See: https://jakearchibald.com/2016/caching-best-practices/
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache')
  })
);
app.use(
  Express.static(path.resolve(__dirname, '../dist/static'), {
    maxAge:
      process.env.STATIC_MAX_AGE ||
      (process.env.NODE_ENV === 'production' ? '1d' : '0')
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use('/editor', requestsOfTypeJSON(), users);
app.use('/editor', requestsOfTypeJSON(), sessions);
app.use('/editor', requestsOfTypeJSON(), files);
app.use('/editor', requestsOfTypeJSON(), projects);
app.use('/editor', requestsOfTypeJSON(), aws);
app.use('/editor', requestsOfTypeJSON(), collections);

// this is supposed to be TEMPORARY -- until i figure out
// isomorphic rendering
app.use('/', serverRoutes);

app.use(assetRoutes);

app.use('/', embedRoutes);
app.use('/', passportRoutes);

// configure passport
require('./config/passport');

// fs
const fs = require('fs');

// Connect to MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: process.env.MONGO_SSL === 'true',
  sslCA:
    process.env.MONGO_SSL === 'true'
      ? fs.readFileSync(`./rds-combined-ca-bundle.pem`)
      : undefined
});
mongoose.set('useCreateIndex', true);
mongoose.connection.on('error', () => {
  console.error(
    'MongoDB Connection Error. Please make sure that MongoDB is running.'
  );
  process.exit(1);
});

app.get('/', (req, res) => {
  res.sendFile(renderIndex());
});

// Handle API errors
app.use('/api', (error, req, res, next) => {
  if (error && error.code && !res.headersSent) {
    res.status(error.code).json({ error: error.message });
    return;
  }

  next(error);
});

// Handle missing routes.
app.get('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    get404Sketch((html) => res.send(html));
    return;
  }
  if (req.accepts('json')) {
    res.send({ error: 'Not found.' });
    return;
  }
  res.type('txt').send('Not found.');
});

// sentry
app.use(Sentry.Handlers.errorHandler());

// start app
app.listen(process.env.PORT, (error) => {
  if (!error) {
    console.log(`p5.js Web Editor is running on port: ${process.env.PORT}!`); // eslint-disable-line
  }
});

export default app;
