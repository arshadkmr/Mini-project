/* eslint-disable prefer-const */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();

}
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const Offer = require('../models/offerModel')
const fast2sms = require('fast-two-sms')
const Razorpay = require('razorpay')

let userSession = false || {}
let isLoggedIn = false
let newUser
let newOtp
let userEmail

let offer = {
  name: 'None',
  type: 'none',
  discount: 0,
  usedBy: false
}
let couponTotal = 0
let nocoupon
let currentOrder

const express = require('express')
const app = express()
const cors = require('cors');
const { ObjectID } = require('bson');
app.use(cors())


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.log(error.message)
  }
}

const sendMessage = function (mobile, res) {
  let randomOTP = Math.floor(Math.random() * 10000)
  let options = {
    authorization: process.env.otpkey,
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile]
  }
  // send message
  fast2sms.sendMessage(options)
    .then((response) => {
      console.log('otp sent successfully')
    }).catch((error) => {
      console.log(error)
    })
  return randomOTP
}

const loadOtp = async (req, res) => {
  const userData = await User.findById({ _id: newUser })
  const otp = sendMessage(userData.mobile, res)
  newOtp = otp
  console.log('otp:', otp)
  res.render('../otpVerify', { otp, user: newUser })
}

const verifyOtp = async (req, res) => {
  try {
    const otp = newOtp
    const userData = await User.findById({ _id: req.body.user })
    // eslint-disable-next-line eqeqeq
    if (otp == req.body.otp) {
      userData.is_verified = 1
      const user = await userData.save()
      if (user) {
        res.redirect('/login')
      }
    } else {
      res.render('../otpVerify', { message: 'Invalid OTP' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadLogin = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const productData = await Product.find({ isAvailable: 1 })
        const categoryData = await Category.find({ isAvailable: 1 })
        res.render('home', { isLoggedIn: true, products: productData, category: categoryData })
      } else {
        res.render('login', { isLoggedIn: false })
      }
    } else {
      res.render('login', { isLoggedIn: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadRegister = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        res.render('home')
      } else {
        res.render('login', { isLoggedIn: false })
      }
    } else {
      res.render('register', { isLoggedIn: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const userForgotPassword = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        res.render('home',)
      } else {
        res.render('login')
      }
    } else {
      res.render('forgotpassword', { isLoggedIn: false, forgotpassword: true, checkuser: false, otp: false, user: false, changepassword: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const checkUser = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const email = req.body.email
      userEmail = email
      const userDataOne = await User.findOne({ email: email })
      userOne = userDataOne
      if (userDataOne) {
        const otp = sendMessage(userDataOne.mobile, res)
        newOtp = otp
        console.log('otp:', otp)
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: false, changepassword: false })
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: true, checkuser: false, otp: false, user: false, message: 'User not found', changepassword: false })
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const sentOtp = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const otp = newOtp
      console.log(otp)
      const userData = req.body.user
      const otpBody = req.body.otp
      if (otpBody == otp) {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: false, otp: true, user: userData, changepassword: true })
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Invalid Otp' })

      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const changepassword = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const password1 = req.body.password1
      const password2 = req.body.password2
      const user = userEmail
      console.log('userEmail: ' + user)
      if (password1 === password2) {
        const sPassword = await securePassword(password1)
        const userData = await User.findOneAndUpdate({ email: user }, {
          $set: {
            password: sPassword
          }
        })
        if (userData) {
          res.redirect('login')
        }
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Passwords mismatch' })
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}


const insertUser = async (req, res) => {
  const userData = await User.findOne({ email: req.body.email })
  if (userData) {
    console.log(userData + 'User already exists')
    res.render('register', { message: 'User already exists' })
  } else if (req.body.password === req.body.cPassword) {
    try {
      const sPassword = await securePassword(req.body.password)
      const user = new User({
        name: req.body.name,
        lname: req.body.lname,
        email: req.body.email,
        mobile: req.body.mno,
        password: sPassword,
        cPassword: req.body.cPassword,
        is_admin: 0
      })
      const userData = await user.save()
      newUser = userData._id
      if (userData) {
        res.redirect('/verifyOtp')
      } else {
        res.render('register', { isLoggedIn, message: 'Registration Failure' })
      }
    } catch (error) {
      console.log(error.message)
    }
  } else {
    res.render('register', { isLoggedIn, message: 'Passwords does not matching' })
  }
}

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password
    const userData = await User.findOne({ email })
    const products = await Product.find({ isAvailable: 1 })
    const categoryData = await Category.find({ isAvailable: 1 })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          if (userData.is_verified === 0) {
            res.render('login', { message: 'You Are Blocked!!' })
          } else {
            userSession = req.session
            userSession.userId = userData._id
            res.render('home', { products, isLoggedIn: true, category: categoryData })
          }
        } else {
          res.render('login', { isLoggedIn, message: 'Not an User!!' })
        }
      } else {
        res.render('login', { isLoggedIn, message: 'Email and password is not matching' })
      }
    } else {
      res.render('login', { isLoggedIn, message: 'User not found' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadHome = async (req, res) => {
  try {
    userSession = req.session
    const categoryData = await Category.find({ isAvailable: 1 })
    const keys = Object.keys(categoryData)
    let names = []
    for (let i = 0; i < keys.length; i++) {
      names.push(categoryData[keys[i]]._id)
    }
    console.log(names)
    const productData = await Product.find({ isAvailable: 1, category: names }).sort({ name: 1 })
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        userSession.couponTotal = couponTotal
        userSession.nocoupon = nocoupon
        userSession.offer = offer
        res.render('home', { isLoggedIn: true, products: productData, category: categoryData })
      } else {
        res.render('home', { isLoggedIn: false, products: productData, category: categoryData })
      }
    } else {
      res.render('home', { isLoggedIn: false, products: productData, category: categoryData })
    }

    console.log(isLoggedIn)
  } catch (error) {
    console.log(error.message)
  }
}

const loadCart = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        console.log(userData)
        const completeUser = await userData.populate('cart.item.productId')
        res.render('cart', { isLoggedIn: true, id: userSession.userId, cartProducts: completeUser.cart })
      } else {
        res.render('cart', { isLoggedIn: false })
      }
    } else {
      res.render('cart', { isLoggedIn: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addToCart = async (req, res) => {
  try {
    const productId = req.query.id
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const productData = await Product.findById({ _id: productId })
        userData.addToCart(productData)
        res.redirect('/cart')
      } else {
        res.redirect('/cart')
      }
    } else {
      res.redirect('/cart')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const deleteCart = async (req, res) => {
  try {
    const productId = req.query.id
    userSession = req.session
    const userData = await User.findById({ _id: userSession.userId })
    userData.removeFromCart(productId)
    res.redirect('/cart')
  } catch (error) {
    console.log(error.message)
  }
}

const loadIndex = async (req, res) => {
  try {
    userSession = req.session
    const categoryData = await Category.find({ isAvailable: 1 })
    const keys = Object.keys(categoryData)
    let names = []
    let search = ''
    for (let i = 0; i < keys.length; i++) {
      names.push(categoryData[keys[i]]._id)
    }
    // const products = await Product.find({ isAvailable: 1, category: names })

    let page = 1
    if (req.query.page) {
      page = req.query.page
    }
    const limit = 3
    const products = await Product.find({
      isAvailable: 1, category: names,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    }).sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    const count = await Product.find({
      isAvailable: 1, category: names,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    }).countDocuments()



    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        res.render('index', {
          products, isLoggedIn: true, category: categoryData,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          previous: new Number(page) - 1,
          next: new Number(page) + 1
        })
      } else {
        res.render('index', {
          products, isLoggedIn: false, category: categoryData,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          previous: new Number(page) - 1,
          next: new Number(page) + 1
        })
      }
    } else {
      res.render('index', {
        products, isLoggedIn: false, category: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1
      })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadWishlist = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const completeUser = await userData.populate('wishlist.item.productId')
        console.log(completeUser)
        res.render('shop-cart', { isLoggedIn: true, id: userSession.userId, wishlistProducts: completeUser.wishlist })
      } else {
        res.render('shop-cart', { isLoggedIn: false, id: userSession.userId })
      }
    } else {
      res.render('shop-cart', { isLoggedIn: false, id: userSession.userId })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addToWishlist = async (req, res) => {
  try {
    const productId = req.query.id
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const productData = await Product.findById({ _id: productId })
        userData.addToWishlist(productData)
        res.redirect('home')
      } else {
        res.render('shop-cart', { isLoggedIn: false, id: userSession.userId })
      }
    } else {
      res.render('shop-cart', { isLoggedIn: false, id: userSession.userId })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const deleteWishlist = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const productId = req.query.id
        userData.removeFromWishlist(productId)
        res.redirect('/wishlist')
      } else {
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addToCartDeleteWishlist = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const productId = req.query.id
        const productData = await Product.findById({ _id: productId })
        const add = await userData.addToCart(productData)
        if (add) {
          userData.removeFromWishlist(productId)
          res.redirect('/cart')
        } else {
          res.redirect('/wishlist')
        }
      } else {
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadCheckout = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      if (userData.is_verified === 1) {
        const addressData = await Address.find({ userId: userSession.userId })
        const selectAddress = await Address.findOne({ userId: userData._id })
        const coupon = await Offer.find({})
        console.log(coupon)
        const nocoupon = userSession.nocoupon
        if (userSession.couponTotal === 0) {
          userSession.couponTotal = userData.cart.totalPrice
          res.render('checkout', { isLoggedIn: true, id: userSession.userId, cartProducts: completeUser.cart, userAddress: addressData, addSelect: selectAddress, nocoupon, couponTotal: userSession.couponTotal, offerName: userSession.offer, coupon })
        } else {
          res.render('checkout', { isLoggedIn: true, id: userSession.userId, cartProducts: completeUser.cart, userAddress: addressData, addSelect: selectAddress, nocoupon, couponTotal: userSession.couponTotal, offerName: userSession.offer, coupon })
        }
      } else {
        res.render('checkout', { isLoggedIn: false, id: userSession.userId, nocoupon: false, userAddress: null, addSelect: null, nocoupon: null, couponTotal: null, offerName: false, coupon: false })
      }
    } else {
      res.render('checkout', { isLoggedIn: false, id: userSession.userId, nocoupon: false, userAddress: null, addSelect: null, nocoupon: null, couponTotal: null, offerName: false, coupon: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const storeOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')

      if (completeUser.cart.totalPrice > 0) {
        const order = Order({
          userId: userSession.userId,
          payment: req.body.payment,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          phone: req.body.phone,
          products: completeUser.cart
        })
        const orderProductStatus = []
        // eslint-disable-next-line no-unused-vars
        for (const key of order.products.item) {
          orderProductStatus.push(0)
        }
        order.productReturned = orderProductStatus

        const orderData = await order.save()
        userSession.currentOrder = orderData._id
        currentOrder = orderData.key_id

        if (userSession.offer) {
          const offerUpdate = await Offer.updateOne(
            { name: userSession.offer.name },
            { $push: { usedBy: userSession.userId } }
          )
        }


        const ordern = await Order.findById({ _id: userSession.currentOrder })
        const productDetails = await Product.find({ is_available: 1 })
        for (let i = 0; i < productDetails.length; i++) {
          for (let j = 0; j < ordern.products.item.length; j++) {
            if (productDetails[i]._id.equals(ordern.products.item[j].productId)) {
              productDetails[i].sales += ordern.products.item[j].qty
            }
          } productDetails[i].save()
        }
        console.log('Hello!!!')
        console.log(req.body.payment)
        console.log('!!!!!!!!!!!!!!!!!!!!!')
        if (req.body.payment === 'Cash-on-Delivery') {
          console.log('Hello!!')
          res.redirect('/orderSuccess')
        } else if (req.body.payment === 'RazorPay') {
          res.render('razorpay', {
            isLoggedIn,
            userId: userSession.userId,
            total: completeUser.cart.totalPrice,
            count: userData.cart.totalQty,
            wcount: userData.wishlist.totalQty
          })
        } else {
          res.redirect('/checkout')
        }
      } else {
        res.redirect('/viewProduct')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const viewOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id
      console.log(id)
      const orderData = await Order.findById({ _id: id })
      const userData = await User.findById({ _id: userSession.userId })
      await orderData.populate('products.item.productId')
      console.log(orderData)
      if (orderData) {
        res.render('orderdetails', { order: orderData, user: userData })
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const singleProduct = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id
      const product = await Product.findById({ _id: id })
      const categoryId = product.category
      const categoryData = await Category.findById({ _id: categoryId })
      console.log(categoryId)
      res.render('product-details', { isLoggedIn: true, id: userSession.userId, product, category: categoryData })
    } else {
      const id = req.query.id
      const product = await Product.findById({ _id: id })
      const categoryId = product.category
      console.log(categoryId)
      const categoryData = await Category.findById({ _id: categoryId })
      res.render('product-details', { isLoggedIn: false, id: userSession.userId, product, category: categoryData })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadProfile = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const addressData = await Address.find({ userId: userSession.userId })
      const orderData = await Order.find({ userId: userSession.userId }).sort({ createdAt: -1 })
      console.log(orderData)
      res.render('userprofile', { isLoggedIn: true, id: userSession.userId, user: userData, userAddress: addressData, userOrders: orderData })
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateProfile = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findByIdAndUpdate({ _id: userSession.userId },
        {
          $set: {
            name: req.body.name,
            lname: req.body.lname,
            mobile: req.body.mno
          }
        })
      res.render('userprofile', { isLoggedIn: true, id: userSession.userId, userData, message: 'Updated successfully' })
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const razorpayCheckout = async (req, res) => {
  userSession = req.session
  const userData = await User.findById({ _id: userSession.userId })
  const completeUser = await userData.populate('cart.item.productId')
  const instance = new Razorpay({ key_id: process.env.key_id, key_secret: process.env.key_secret })
  let order = await instance.orders.create({
    amount: completeUser.cart.totalPrice * 100,
    currency: 'INR',
    receipt: 'receipt#1'
  })
  res.status(201).json({
    success: true,
    order
  })
}

const addAddress = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const address = Address({
        userId: userSession.userId,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        country: req.body.country,
        address: req.body.streetAddress,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        phone: req.body.mno
      })
      const addressData = await address.save()
      console.log(addressData)
      if (addressData) {
        res.redirect('/userprofile')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadSuccess = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const productData = await Product.find()
      for (const key of userData.cart.item) {
        for (const prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.stock = prod.stock - key.qty
            await prod.save()
          }
        }
      }
      await Order.find({
        userId: userSession.userId
      })
      await Order.updateOne({
        userId: userSession.userId, _id: userSession.currentOrder
      }, {
        $set: { status: 'Ordered' }
      })
      await User.updateOne({ _id: userSession.userId }, {
        $set: {
          'cart.item': [],
          'cart.totalPrice': 0,
          'cart.totalQty': 0
        }
      }, { multi: true })
      res.render('ordersuccess')
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const cancelOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const id = req.query.id
        const orderData = await Order.findOne({ _id: id })
        if (orderData) {
          res.redirect('/userprofile')
        } else {
          res.redirect('/userprofile')
        }
      } else {
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const returnOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        const id = req.query.id
        console.log()
        console.log(currentOrder)
        const productOrderData = await Order.findById({ _id: currentOrder })
        console.log('dfjkjfgdfh');
        const productData = await Product.findById({ _id: id })
        if (productOrderData) {
          console.log('Product  order data : ' + productOrderData)
          for (let i = 0; i < productOrderData.products.item.length; i++) {
            if (
              new String(productOrderData.products.item[i].productId).trim() ===
              new String(id).trim()
            ) {
              productData.stock += productOrderData.products.item[i].qty;
              productOrderData.productReturned[i] = 1;
              await productData.save().then(() => {
                console.log("productData saved")
              })
              await productOrderData.save().then(() => {
                console.log('productOrderData saved')
              })
            } else {
            }
          }
          res.redirect('/userprofile')
        } else {
          res.redirect('/userprofile')
        }
      } else {
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadFilterProduct = async (req, res) => {
  try {
    userSession = req.session
    const categoryData = await Category.find({ isAvailable: 1 })
    const categoryId = req.query.id
    const products = await Product.find({ category: categoryId })
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        res.render('filterproduct', { isLoggedIn: true, id: userSession.userId, category: categoryData, products })
      } else {
        res.render('filterproduct', { isLoggedIn: false, id: userSession.userId, category: categoryData, products })
      }
    } else {
      res.render('filterproduct', { isLoggedIn: false, id: userSession.userId, category: categoryData, products })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addCoupon = async (req, res) => {
  try {
    console.log('adding coupon')
    userSession = req.session
    if (userSession.userId) {
      console.log('userData')
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      if (userData.is_verified === 1) {
        userSession.offer = offer
        const offerData = await Offer.findOne({ name: req.body.offer })
        const addressData = await Address.find({ userId: userSession.userId })
        const selectAddress = await Address.findOne({ userId: userData._id })
        if (offerData.isAvailable === 1) {
          if (offerData.usedBy.includes(userSession.userId)) {
            nocoupon = true
            res.render('checkout', { isLoggedIn: true, id: userSession.userId, nocoupon: true, cartProducts: completeUser.cart, userAddress: addressData, addSelect: selectAddress, offerName: userSession.offer, couponTotal: userSession.couponTotal, message: 'Coupon already used' })
          } else {
            userSession.offer.name = offerData.name
            userSession.offer.type = offerData.type
            userSession.offer.discount = offerData.discount
            let updatedTotal =
              userData.cart.totalPrice -
              (userData.cart.totalPrice * userSession.offer.discount) / 100
            userSession.couponTotal = updatedTotal
            nocoupon = false
            res.redirect('/checkout')
          }
        } else {
          res.redirect('/checkout')
        }
      } else {
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const changeProductQty = async (req, res) => {
  try {
    userSession = req.session
    const id = req.query.id
    const userData = await User.findById({ _id: userSession.userId })
    const foundProduct = userData.cart.item.findIndex((x) => x.productId == id)
    const qty = { a: parseInt(req.body.qty) }
    userData.cart.item[foundProduct].qty = qty.a
    const price = userData.cart.item[foundProduct].price
    userData.cart.totalPrice = 0
    const totalPrice = userData.cart.item.reduce((acc, curr) => {
      return acc + curr.price * curr.qty
    }, 0)
    userData.cart.totalPrice = totalPrice
    await userData.save()
    res.json({ totalPrice, price })
  } catch (error) {
    console.log(error.message)
  }
}

const userLogout = async (req, res) => {
  try {
    const userSession = req.session
    userSession.userId = null
    isLoggedIn = false
    res.redirect('/home')
  } catch (error) {
    console.log(error.message)
  }
}

// const notFound = async (req, res) => {
//   try {
//     userSession = req.session
//     if (userSession.userId) {
//       res.render('404', { isLoggedIn: true })
//     } else {
//       res.render('404', { isLoggedIn: true })
//     }
//   } catch (error) {
//     console.log(error.message)
//   }
// }

module.exports = {
  loadLogin,
  verifyLogin,
  loadRegister,
  userForgotPassword,
  checkUser,
  sentOtp,
  changepassword,
  insertUser,
  loadHome,
  loadCart,
  loadIndex,
  addToCart,
  deleteCart,
  loadWishlist,
  addToWishlist,
  deleteWishlist,
  addToCartDeleteWishlist,
  loadCheckout,
  sendMessage,
  loadOtp,
  verifyOtp,
  singleProduct,
  loadProfile,
  updateProfile,
  loadSuccess,
  addAddress,
  razorpayCheckout,
  storeOrder,
  viewOrder,
  cancelOrder,
  returnOrder,
  loadFilterProduct,
  addCoupon,
  changeProductQty,
  userLogout,
  // notFound
}
