/* eslint-disable no-new-wrappers */
/* eslint-disable no-undef */
const mongoose = require('mongoose')
const product = require('../models/productModel')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  is_verified: {
    type: Number,
    default: 0
  },
  is_admin: {
    type: Number,
    required: true
  },
  address: {
    Details: [
      {
        addId: {
          type: mongoose.Types.ObjectId,
          ref: 'Address'
        }
      }
    ]
  },
  cart: {
    item: [{
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      qty: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }],
    totalPrice: {
      type: Number,
      default: 0
    },
    totalQty: {
      type: Number,
      default: 0
    }
  },
  wishlist: {
    item: [{
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      qty: {
        type: Number,
        required: true
      },
      price: {
        type: Number
      }
    }],
    totalQty: {
      type: Number,
      default: 0
    }
  }

})

userSchema.methods.addToCart = function (product) {
  try {
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems => {
      // eslint-disable-next-line no-new-wrappers
      return new String(objInItems.productId).trim() === new String(product._id).trim()
    })
    if (isExisting >= 0) {
      cart.item[isExisting].qty += 1
    } else {
      cart.item.push({ productId: product._id, name: product.name, qty: 1, price: product.price })
    }
    cart.totalPrice += product.price
    cart.totalQty += 1
    console.log('User in schema : ', this)
    return this.save()
  } catch (error) {
    console.log(error.message)
  }
}

userSchema.methods.addToWishlist = function (product) {
  try {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(objInItems => {
      return new String(objInItems.productId).trim() === new String(product._id).trim()
    })
    if (isExisting >= 0) {
      wishlist.item[isExisting].qty += 1
    } else {
      wishlist.item.push({ productId: product._id, name: product.name, qty: 1, price: product.price })
    }
    wishlist.totalQty += 1
    console.log('User in schema : ', this)
    return this.save()
  } catch (error) {
    console.log(error.message)
  }
}

userSchema.methods.removeFromCart = async function (productId) {
  try {
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems => new String(objInItems.productId).trim() === new String(productId).trim())
    if (isExisting >= 0) {
      const prod = await product.findById(productId)
      cart.totalPrice -= prod.price * cart.item[isExisting].qty
      cart.totalQty -= cart.item[isExisting].qty
      cart.item.splice(isExisting, 1)
      console.log('User in Schema', this)
      return this.save()
    }
  } catch (error) {
    console.log(error.message)
  }
}

userSchema.methods.removeFromWishlist = async function (productId) {
  try {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(onjInItems => new String(onjInItems.productId).trim() === new String(productId).trim())
    if (isExisting >= 0) {
      const prod = await product.findById(productId)
      console.log('prod : ' + prod)
      wishlist.totalQty -= wishlist.item[isExisting].qty
      wishlist.item.splice(isExisting, 1)
      console.log('User in Schema', this)
      return this.save()
    }
  } catch (error) {
    console.log(error.message)
  }
}
module.exports = mongoose.model('User', userSchema)
