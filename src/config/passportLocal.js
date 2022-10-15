const localStrategy = require("passport-local").Strategy;
const passport = require("passport");
const userModule = require("../models/authModule");
const bcrypt = require("bcrypt");

module.exports = function (passport) {
    const options = {
        usernameField: "emaill",
        passwordField: "password"
    }
    passport.use(new localStrategy(options, async (emaill, passwordd, done) => {
        try {

            const userr = await userModule.findOne({ emaill }) // IS THERE A USER?7
            if (!userr) {
                return done(null, false, { message: "USER İS NOT FOUND" });
            }

            const userPass = await bcrypt.compare(passwordd, userr.password);
            if (!userPass) {
                return done(null, false, { message: "PASSWORD OR EMAİL İS FALSE" })
            } else {
                if (userr && userr.emailActive==false) {
                    return done(null,false,{message:"PLEASE VERİFY EMAİL"})
                }else{
                    return done(null,userr)
                }
            }


        } catch (error) {
            return done(error);
        }
    }));
    passport.serializeUser(function (user, done) { // COOKIE ALSO STORES THIS USER
        done(null, user._id)
    });

    passport.deserializeUser(function (_id, done) { // RETURN OF THE USER FOUND

        userModule.findById(_id, function (err, user) {
            const yeniUser = {
                id: user._id,
                isim: user.fullName,
                emailll: user.emaill
            }
            done(err, yeniUser)
        })
    });
}