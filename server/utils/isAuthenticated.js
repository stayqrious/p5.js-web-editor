import passport from 'passport';


// Cookie based authentication

// export default function isAuthenticated(req, res, next) {
//   if (req.user) {
//     next();
//     return;
//   }
//   res.status(403).send({
//     success: false,
//     message: 'You must be logged in in order to perform the requested action.'
//   });
// }



// JWT token based authentication

export default function (req, res, next) {
  passport.authenticate('client-jwt', {session: false}, (err, user, info) => {

    if (err || !user) return res.status(403).send({
          success: false,
          message: 'Invalid token'
        });

        req.user = user;    
     next();   

  })(req, res, next);

}
