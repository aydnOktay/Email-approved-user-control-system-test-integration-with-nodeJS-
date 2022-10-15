const { validationResult } = require("express-validator");
const userModule = require("../models/authModule");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const passport = require("passport");


// LOGİN
const loginFormShow = (req, res, next) => {
    res.render("login", { layout: "./layout/authLayout" });
};
const loginFormPost = (req, res, next) => {
    const errors = validationResult(req); // VALIDATION ERRORS HERE

    if (!errors.isEmpty()) {
        req.flash("validateError", errors.array());
        res.redirect("/login");

    } else { // IF NO ERRORS WILL GO TO passportLocal
        passport.authenticate("local", {
            successRedirect: "/homePage", // IF THE OPERATION IS SUCCESSFUL, TAKE THIS ROUTE
            failureRedirect: "/login", // IF THE OPERATION FAILS, TAKE THIS ROUTE
            failureFlash: true // ERRORS MESSAGE İS SHOW
        })(req, res, next);
    }
}


// REGİSTER
const registerFormShow = (req, res, next) => {
    res.render("forgetPassword", { layout: "./layout/authLayout" })
};
const registerFormPost = async (req, res, next) => {
    const errors = validationResult(req); // VALIDATION ERRORS HERE

    if (!errors.isEmpty()) { // IF THERE IS AN ERROR, THE USER IS GIVEN A MESSAGE
        req.flash("validateError", errors.array());
        res.redirect("/register");

    } else { // IF THERE ARE NO ERRORS, WE WILL SEND EMAIL CONFIRMATION

        const userFind = await userModule.findOne({ emaill: req.body.emaill }); // IF USER DOES NOT CONFIRM MAIL, ID CHANGE
        if (userFind) {
            await userModule.findByIdAndRemove({ _id: userFind._id });
        }

        // SIGN IN IF EMAIL IS CONFIRMED. IF NOT CONFIRMED, WE REGISTER THE MEMBER AND SEND EMAIL
        if (userFind && userFind.emailActive == true) { // 
            req.flash("successMessage", [{ msg: "THIS USER IS REGISTERED" }]);
            res.redirect("/login");

        } else if ((userFind && userFind.emailActive == false) || userFind == null) {
            const newUser = await new userModule({
                id: req.body._id,
                fullName: req.body.fullName,
                emaill: req.body.emaill,
                password: await bcrypt.hash(req.body.password, 10)
            });

            await newUser.save();

            const tokenInformation = { id: newUser._id, emaill: newUser.emaill };
            const jwtToken = jwt.sign(tokenInformation, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
            const url = process.env.WEB_SITE + "verify?id=" + jwtToken; // WE CREATE A LINK TO CONFIRM FROM VERIFY ROUTE

            // EMAİL SEND
            let transport = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });
            await transport.sendMail({
                from: "NODE JS",
                to: newUser.emaill,
                subject: "MAİL CONFİRM",
                text: "CLICK TO CONFIRM EMAIL -> " + url
            }, (error, info) => {
                if (error) {
                    console.log("ERROR ", error);
                }
                console.log("MAİL SEND");
                transport.close();
            });

            // EMAİL END
            req.flash("successMessage", [{ msg: "SUCCESFULLY REGİSTERED , PLEASE EMAİL VERİFY" }]);
            res.redirect("/login");
        }

    }
}

// FORGET PASSWORD
const forgetPasswordFormShow = (req, res, next) => {
    res.render("forgetPassword", { layout: "./layout/authLayout" })

};
const forgetPasswordFormPost = async (req, res, next) => {
    const errors = validationResult(req); // VALIDATION ERRORS HERE

    if (!errors.isEmpty()) {
        req.flash("validateError", errors.array());
        res.redirect("/forgetPassword");
    } else {
        const userr = await userModule.findOne({ emaill: req.body.emaill, emailActive: true });
        if (userr) {
            const jwtInformation = {
                id: userr.id,
                emaill: userr.emaill
            };
            const secret = process.env.RESET_PASSWORD_SECRET + "-" + userr.password;
            const jwtToken = jwt.sign(jwtInformation, secret, { expiresIn: "1h" });
            const url = process.env.WEB_SITE + "reset-password/" + userr.id + "/" + jwtToken;

            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.GMAIL_USER, // generated ethereal user
                    pass: process.env.GMAIL_PASS, // generated ethereal password
                },
            });

            // send mail with defined transport object
            await transporter.sendMail({
                from: '"NODE JS DENEME',
                to: userr.emaill,
                subject: "PASSWORD UPDATE",
                text: "GO TO THIS LINK TO CREATE YOUR PASSWORD " + url,
            }, (error, info) => {
                if (error) {
                    console.log("ERROR " + error);
                }
                console.log("MAİL SEND");
                transporter.close();
            });

            req.flash("successMessage", [{ msg: "CHECK YOUR MAIL BOX" }]);
            res.redirect("/login");

        } else {
            req.flash("validateError", [{ msg: "NO SUCH USER" }]);
            res.redirect("/forgetPassword");
        }
    }
}
const newPasswordFormShow = async (req, res, next) => {
    const linkid = req.params.id;
    const linktoken = req.params.token;

    if (linkid && linktoken) {

        const bulunanUser = await userModule.findOne({ _id: linkid });
        const secret = process.env.RESET_PASSWORD_SECRET + "-" + bulunanUser.password;
        try {
            jwt.verify(linktoken, secret, async (e, decoded) => { // gelen id ile bu tokendeki id uyusuyor mu
                if (e) { // HATA VAR İSE
                    req.flash("validateError", [{ msg: "CODE INCORRECT OR EXPIRED" }]);
                    res.redirect("/forgetPassowrd");
                } else { // 
                    res.render("new_password", { id: linkid, token: linktoken, layout: "./layout/authLayout" }) // id ve token degerini kaybetmemek için o sayfaya yolluyoruz , ordanda aynı degerleri post ediyoruz gizli şekilde
                }
            });
        } catch (error) {
            next(error)
        }

    } else { // token veya id yok ise
        req.flash("validateError", [{ msg: "NO TOKEN OR ID" }]);
        res.redirect("/forgetPassowrd");
    }
}
const newPasswordFormPost = async (req, res, next) => {
    const errorr = validationResult(req);
    if (!errorr.isEmpty()) {
        req.flash("validateError", errorr.array());
        res.redirect("/reset-password/" + req.body.id + "/" + req.body.token);

    } else { // PASSWORD UPDATE FIELD
        const bulunanUserr = await userModule.findOne({ _id: req.body.id, emailActive: true }); // CONTROLS WHAT FORM IT COME FROM
        const secret = process.env.RESET_PASSWORD_SECRET + "-" + bulunanUserr.password;
        try {
            jwt.verify(req.body.token, secret, async (e, decoded) => {
                if (e) {
                    req.flash("error", "FAULTY CODE");
                    res.redirect("/forgetPassword");
                } else {
                    const hashPassowrd = await bcrypt.hash(req.body.password, 10);
                    const dataUser = await userModule.findByIdAndUpdate(req.body.id, { password: hashPassowrd });
                    if (dataUser) {
                        req.flash("successMessage", [{ msg: "PASSWORD UPDATED" }]);
                        res.redirect("/login")
                    } else {
                        req.flash("error", "PLEASE SEND A PASSWORD RESET REQUEST AGAIN");
                        res.redirect("/login");
                    }
                }
            });
        } catch (error) {
            next(error);
        }

    }
}

// VERİFY EMAİL
const verify = (req, res, next) => {
    const token = req.query.id; // TOKEN IN URL
    if (token) {
        try { // WE WILL VERIFY THE TOKEN AND ACTIVATE THE EMAIL FIELD

            jwt.verify(token, process.env.JWT_SECRET_KEY, async (e, decoded) => {
                if (e) {
                    req.flash("validateError", [{ msg: "FAULTY CODE" }]);
                    res.redirect("/login");

                } else {  // IF THERE ARE NO ERRORS, WE WILL ACTIVATE THE EMAIL
                    const userID = decoded.id;
                    const updateEmail = await userModule.findByIdAndUpdate(userID, { emailActive: true });
                    if (updateEmail) {
                        req.flash("successMessage", [{ msg: "EMAİL İS VERİFY , LETS LOGİN" }]);
                        res.redirect("/login");
                    }
                }

            });


        } catch (error) {
            next(error)
        }

    } else {
        req.flash("validateError", [{ msg: "TOKEN İS NOT FOUND" }]);
        res.redirect("/login");
    }
}

// HOME PAGE
const homePage = (req, res, next) => {
    res.render("index", { layout: "./layout/homePagee.ejs" });
};

// LOGOUT
const logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.destroy((error) => {
            res.clearCookie("connect.sid");
            // req.flash("success_message",[{msg:"ÇIKIŞ YAPILDI"}]);
            res.render('login', { layout: "./layout/authLayout.ejs", successMessage: [{ msg: "LOGOUT İS SUCCESFULY" }] });
            //res.send("çıkış yapıldı")
        })
    });

}

module.exports = {
    loginFormShow, loginFormPost,
    registerFormShow, registerFormPost,
    forgetPasswordFormShow, forgetPasswordFormPost,
    verify, homePage, logout,
    newPasswordFormShow,
    newPasswordFormPost
}