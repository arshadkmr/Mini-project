/* eslint-disable indent */
const isLogin = async (req, res, next) => {
    console.log(req.session.isLoggedIn)
    try {
        console.log(' isLogin try')
        if (req.session.isLoggedIn) {
            console.log(req.session.isLoggedIn)
            next()
        } else {
            console.log('isLogin catch')
            res.render('login')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.isLoggedIn) {
            res.render('/')
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
