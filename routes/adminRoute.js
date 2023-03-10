const express = require('express')
const adminRoute = express()
const adminController = require('../controller/adminController')

adminRoute.use(express.json())
adminRoute.use(express.urlencoded({ extended: true }))

adminRoute.set('views', './views/admin')

const multer = require('../util/multer')

adminRoute.get('/', adminController.loadDashboard)
adminRoute.post('/', adminController.verifyLogin)
adminRoute.get('/home', adminController.loadDashboard)
adminRoute.get('/login', adminController.loadLogin)
adminRoute.post('/login', adminController.verifyLogin)
adminRoute.get('/dashboard', adminController.adminDashboard)
adminRoute.get('/block-user', adminController.blockUser)
adminRoute.get('/unblock-user', adminController.unBlockUser)
adminRoute.get('/addproduct', adminController.addProduct)
adminRoute.post('/addproduct', multer.upload.array('uploaded_file', 4), adminController.insertProduct)
adminRoute.get('/productlist', adminController.loadProduct)
adminRoute.get('/show-product', adminController.showProduct)
adminRoute.get('/block-product', adminController.blockProduct)
adminRoute.get('/edit-product', adminController.editProduct)
adminRoute.post('/edit-product/:id', multer.upload.array('uploaded_file', 4), adminController.updateProduct)
adminRoute.get('/categorylist', adminController.loadCategory)
adminRoute.get('/couponlist', adminController.loadCoupon)
adminRoute.get('/addcoupon', adminController.addCoupon)
adminRoute.post('/addcoupon', adminController.insertCoupon)
adminRoute.get('/show-coupon', adminController.showCoupon)
adminRoute.get('/block-coupon', adminController.blockCoupon)
adminRoute.get('/addcategory', adminController.addCategory)
adminRoute.post('/addcategory', adminController.insertCategory)
adminRoute.get('/block-category', adminController.blockCategory)
adminRoute.get('/show-category', adminController.showCategory)
adminRoute.get('/edit-category', adminController.editCategory)
adminRoute.post('/edit-category/:id', adminController.updateCategory)
adminRoute.get('/orderdetails', adminController.loadOrder)
adminRoute.post('/orderdetails', adminController.updateOrderStatus)
adminRoute.get('/orderDownload', adminController.orderDownload)
adminRoute.get('/logout', adminController.adminLogout)


module.exports = adminRoute
