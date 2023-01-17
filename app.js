if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();

}
const mongoose = require('mongoose')
mongoose.connect(process.env.mongo)

const express = require('express')
const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')
const nocache = require('nocache')

const app = express()

const session = require('express-session')
const config = require('./config/config')
app.use(session({ secret: config.sessionSecret, saveUninitialized: true, resave: true }))
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use('/admin', express.static('public'))

app.use(express.static('public'))
app.use('/', express.static('public/'))

app.use(nocache())


app.use('/', userRoute)

app.use('/admin', adminRoute)

app.get('*',function (req, res) {
  res.status(404).render('users/404')
})

app.listen(3000, function () {
  console.log('server is running...')
})
