const express = require('express')
const userRoute = express()
const userController = require('../controller/userController')
const auth = require('../middlewares/userAuth')

// userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/users')

userRoute.use(express.json())
userRoute.use(express.urlencoded({ extended: true }))

userRoute.get('/', userController.loadHome)
userRoute.get('/register', auth.isLogout, userController.loadRegister)
userRoute.get('/login', auth.isLogout, userController.loadLogin)
userRoute.get('/home', userController.loadHome)
userRoute.get('/cart', userController.loadCart)
userRoute.get('/addtocart', userController.addToCart)
userRoute.get('/delete-cart', userController.deleteCart)
userRoute.get('/wishlist', userController.loadWishlist)
userRoute.get('/addtowishlist', userController.addToWishlist)
userRoute.get('/delete-wishlist', userController.deleteWishlist)
userRoute.get('/addToCartDeleteWishlist', userController.addToCartDeleteWishlist)
userRoute.get('/shop', userController.loadIndex)
userRoute.get('/checkout', userController.loadCheckout)
userRoute.post('/checkout', userController.storeOrder)
userRoute.get('/single-product', userController.singleProduct)
userRoute.get('/userprofile', userController.loadProfile)
userRoute.post('/address', userController.addAddress)
userRoute.post('/razorpay', userController.razorpayCheckout)

userRoute.get('/orderSuccess', userController.loadSuccess)
userRoute.get('/viewOrder', userController.viewOrder)
userRoute.get('/cancelOrder', userController.cancelOrder)
userRoute.get('/returnProduct',userController.returnOrder)
userRoute.post('/addcoupon', userController.addCoupon)

userRoute.get('/category-products', userController.loadFilterProduct)
userRoute.post('/changeProductQty', userController.changeProductQty)

userRoute.post('/login', userController.verifyLogin)
userRoute.post('/register', userController.insertUser)
userRoute.get('/logout', userController.userLogout)
userRoute.get('/forgotpassword', userController.userForgotPassword)
userRoute.post('/forgotpassword', userController.checkUser)
userRoute.post('/forgotpasswordotp', userController.sentOtp)
userRoute.post('/forgotpasswordchange', userController.changepassword)

userRoute.get('/verifyOtp', userController.loadOtp)
userRoute.post('/verifyOtp', userController.verifyOtp)

// userRoute.get('/', userController.notFound)
// userRoute.get('*',function(req,res){
//     res.render('/404')
// })

module.exports = userRoute
