const authRouter = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const sessionControl = require("../middlewares/sessionControl");

// LOGİN
authRouter.get("/login",sessionControl.loggedIn,authController.loginFormShow)
authRouter.post("/login",sessionControl.loggedIn,authMiddleware.loginUser(),authController.loginFormPost);


// REGİSTER
authRouter.get("/register",sessionControl.loggedIn,authController.registerFormShow);
authRouter.post("/register",sessionControl.loggedIn,authMiddleware.newUserAdd(),authController.registerFormPost);


// PASSWORD
authRouter.get("/forgetPassword",sessionControl.loggedIn,authController.forgetPasswordFormShow)
authRouter.post("/forgetPassword",sessionControl.loggedIn,authMiddleware.validateEmail(),authController.forgetPasswordFormPost)
authRouter.get("/reset-password/:id/:token",authController.newPasswordFormShow);
authRouter.get("/reset-password",authController.newPasswordFormShow);
authRouter.post("/reset-password",authMiddleware.validateNewPassword(),authController.newPasswordFormPost);


// LOGOUT
authRouter.get("/logout",sessionControl.loggedOut,authController.logout);


// HOMEPAGE
authRouter.get("/homePage",sessionControl.loggedOut,authController.homePage);


// EMAİL VERİFY
authRouter.get("/verify",authController.verify);


module.exports=authRouter;