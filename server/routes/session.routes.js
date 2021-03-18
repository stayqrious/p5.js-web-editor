import { Router } from 'express';
import * as SessionController from '../controllers/session.controller';
import isAuthenticated from '../utils/isAuthenticated';

const router = new Router();

router.post('/login', isAuthenticated, SessionController.createSession);

router.get('/session', isAuthenticated, SessionController.getSession);

router.get('/logout', SessionController.destroySession);

export default router;
