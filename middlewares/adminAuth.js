/* eslint-disable no-empty */
/* eslint-disable indent */

const isLogin = async (req, res, next) => {
    try {
        if (req.session.loggedIn) {
            next()
        } else {
            res.render('login')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout = async (req, res, next) => {
    console.log('z')
    console.log(req.session.loggedIn)
    try {
        if (req.session.loggedIn === false) {
            console.log('x')
            res.render('login')
        } else {
            console.log('y')
            res.render('home')
        }
        next()
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}
