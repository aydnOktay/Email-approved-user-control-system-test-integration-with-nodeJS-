
const loggedOut = (req,res,next)=>{
    if (req.isAuthenticated()) {
        return next();
    }else{
        req.flash("validateError",[{msg:"PLEASE LOGİN"}]);
        res.redirect("/login")
    }
}

const loggedIn = (req,res,next) =>{
    if (!req.isAuthenticated()) {
        return next();
    }else{
        res.redirect("/homePage")
    }
}

module.exports={
    loggedOut,
    loggedIn
}