const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')
const Order = require('../models/orderModel')
const bcrypt = require('bcrypt')
const objectId = require("mongodb").ObjectId
const excelJs = require('exceljs')

let adminSession = false

const { ObjectId } = require("mongodb")

const loadLogin = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      res.redirect('/admin/home')
    } else {
      res.render('login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadDashboard = async (req, res) => {
  try {
    console.log("admin")
    adminSession = req.session
    if (adminSession.adminId) {
      const productData = await Product.find()
      const userData = await User.find({ is_admin: 0 })
      const categoryData = await Category.find()
      const categoryArray = []
      const orderCount = []
      for (let key of categoryData) {
        categoryArray.push(key.names);
        orderCount.push(0);
      }
      const completeOrder = [];
      const orderData = await Order.find();
      const orderItems = orderData.map((item) => item.products.item);
      let productIds = [];
      orderItems.forEach((orderItem) => {
        orderItem.forEach((item) => {
          productIds.push(item.productId.toString());
        });
      });
      const s = [...new Set(productIds)];
      const uniqueProductObjs = s.map((id) => {
        return { id: ObjectId(id), qty: 0 };
      });
      orderItems.forEach((orderItem) => {
        orderItem.forEach((item) => {
          uniqueProductObjs.forEach((idObj) => {
            if (item.productId.toString() === idObj.id.toString()) {
              idObj.qty += item.qty;
            }
          });
        });
      });
      for (let key of orderData) {
        const append = await key.populate("products.item.productId");
        completeOrder.push(append);
      }
      completeOrder.forEach((order) => {
        order.products.item.forEach((it) => {
          uniqueProductObjs.forEach((obj) => {
            if (it.productId._id.toString() === obj.id.toString()) {
              uniqueProductObjs.forEach((ss) => {
                if (ss.id.toString() !== it.productId._id.toString()) {
                  obj.name = it.productId.name;
                }
              });
            }
          });
        });
      });
      const salesCount = [];
      const productName = productData.map((product) => product.name);
      for (let i = 0; i < productName.length; i++) {
        for (let j = 0; j < uniqueProductObjs.length; j++) {
          if (productName[i] === uniqueProductObjs[j].name) {
            salesCount.push(uniqueProductObjs[j].qty);
          } else {
            salesCount.push(0);
          }
        }
      }
      console.log(salesCount);
      console.log(productName);
      for (let i = 0; i < completeOrder.length; i++) {
        for (let j = 0; j < completeOrder[i].products.item.length; j++) {
          const categoryData = completeOrder[i].products.item[j].productId.category;
          const isExisting = categoryArray.findIndex((category) => {
            return category === categoryData;
          });
          orderCount[isExisting]++;
          console.log(categoryData);
          console.log(orderCount);
        }
      }
      if (productName && salesCount) {
        res.render("home", {
          products: productData,
          users: userData,
          category: categoryArray,
          count: orderCount,
          pname: productName,
          pcount: salesCount,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password
    const userData = await User.findOne({ email })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_admin === 1) {
          adminSession = req.session
          adminSession.adminId = userData._id
          res.redirect('home')
          console.log('Admin logged in')
        }
      } else {
        res.render('login', { message: 'Password mismatch' })
      }
    } else {
      res.render('login', { message: 'Email and password not valid' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

// const loadDashboard = async (req, res) => {
//   try {
//     adminSession = req.session
//     if (adminSession.adminId) {
//       res.render('home')
//     } else {
//       res.redirect('/admin/login')
//     }
//   } catch (error) {
//     console.log(error.message)
//   }
// }

const adminDashboard = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const usersData = await User.find({ is_admin: 0 })
      res.render('dashboard', { users: usersData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const blockUser = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const usersData = await User.findOneAndUpdate({ _id: req.query.id }, { $set: { is_verified: 1 } })
      if (usersData) {
        res.redirect('/admin/dashboard')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const unBlockUser = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const usersData = await User.findOneAndUpdate({ _id: req.query.id }, { $set: { is_verified: 0 } })
      if (usersData) {
        res.redirect('/admin/dashboard')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const categoryData = await Category.find()
      console.log(categoryData)
      res.render('addproduct', { category: categoryData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const insertProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const files = req.files
      const ID = req.body.category
      console.log(ID)
      const categoryName = await Category.findById({ _id: ID })
      console.log(categoryName.names)

      const product = Product({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        image: files.map((x) => x.filename)
      })
      const categoryData = await Category.find()
      const productData = await product.save()
      if (productData) {
        res.render('addproduct', { messages: 'Product added successfully', category: categoryData })
      } else {
        res.render('addproduct', { message: 'product added failed', category: categoryData })
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const products = await Product.find()
      res.render('productlist', { products })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const showProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const productData = await Product.findOneAndUpdate({ _id: req.query.id }, { $set: { isAvailable: 1 } })
      if (productData) {
        console.log('block working')
        console.log(productData)
        res.redirect('/admin/productlist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const blockProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const productData = await Product.findOneAndUpdate({ _id: req.query.id }, { $set: { isAvailable: 0 } })
      if (productData) {
        console.log('show working')
        console.log(productData)
        res.redirect('/admin/productlist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const editProduct = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const productId = req.query.id
      const productData = await Product.findById(productId)
      const categoryData = await Category.find()
      if (productData) {
        res.render('editProduct', { product: productData, category: categoryData })
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateProduct = async (req, res) => {
  try {
    adminSession = req.session
    const productId = req.params.id
    if (adminSession.adminId) {
      const files = req.files
      const productData = await Product.findByIdAndUpdate({ _id: productId },
        {
          name: req.body.name,
          category: req.body.category,
          price: req.body.price,
          description: req.body.description,
          stock: req.body.stock,
          image: files.map((x) => x.filename)
        }
      )
      if (productData) {
        res.redirect('/admin/productlist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log('error')
    console.log(error.message)
  }
}

const addCategory = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      res.render('addcategory')
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const insertCategory = async (req, res) => {
  const category = req.body.category
  const categoryData = await Category.findOne({ names: category })
  if (categoryData) {
    res.render('addcategory', { message: 'Category already exists' })
  } else {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const category = Category({
          names: req.body.category
        })
        const categoryData = await category.save()
        if (categoryData) {
          console.log(categoryData)
          console.log('category saved successfully')
          res.render('addcategory', { messages: 'category saved successfully' })
        } else {
          console.log('Failed to save category')
          res.render('addcategory', { message: 'Failed to save category' })
        }
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
}



const loadCategory = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const categoryData = await Category.find({})
      console.log(categoryData)
      res.render('categorylist', { category: categoryData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const showCategory = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { isAvailable: 1 } })
      if (categoryData) {
        res.redirect('/admin/categorylist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const blockCategory = async (req, res) => {
  console.log('show category')
  try {
    console.log('try show')
    adminSession = req.session
    if (adminSession.adminId) {
      console.log('show admin Session')
      const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { isAvailable: 0 } })
      if (categoryData) {
        console.log('show category data')
        res.redirect('/admin/categorylist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log('show catch')
    console.log(error.message)
  }
}

const editCategory = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const id = req.query.id
      const categoryData = await Category.findById({ _id: id })
      res.render('editcategory', { category: categoryData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateCategory = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const id = req.params.id
      console.log(id)
      const categoryData = await Category.findByIdAndUpdate({ _id: id }, { names: req.body.category })
      if (categoryData) {
        res.redirect('/admin/categorylist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadCoupon = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const offerData = await Offer.find({})
      console.log(offerData)
      res.render('couponlist', { coupon: offerData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addCoupon = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      res.render('addcoupon')
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const insertCoupon = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const offer = Offer({
        name: req.body.name,
        type: req.body.type,
        discount: req.body.discount
      })
      const offerData = await offer.save()
      if (offerData) {
        res.render('addcoupon', { messages: 'Coupon saved successfully' })
      } else {
        res.render('addcoupon', { message: 'Something went wrong' })
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const blockCoupon = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const Id = req.query.id
      const couponData = await Offer.findByIdAndUpdate({ _id: Id }, { $set: { isAvailable: 0 } })
      if (couponData) {
        res.redirect('/admin/couponlist')
      } else {
        res.redirect('/admin/couponlist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const showCoupon = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const Id = req.query.id
      const couponData = await Offer.findByIdAndUpdate({ _id: Id }, { $set: { isAvailable: 1 } })
      if (couponData) {
        res.redirect('/admin/couponlist')
      } else {
        res.redirect('/admin/couponlist')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadOrder = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const orderData = await Order.find()
      res.render('adminOrder', { orderData })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      let orderId = req.body.orderid;
      console.log(orderId)
      const orderData = await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: req.body.status } })
      if (orderData) {
        console.log('Order updated')
        res.redirect("/admin/orderdetails")
      } else {
        console.log('Order error')
        res.redirect("/admin/orderdetails")
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message);
  }
}

const orderDownload = async function (req, res) {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      const workBook = new excelJs.Workbook();
      const workSheet = workBook.addWorksheet("My Orders");
      workSheet.columns = [
        { header: "S no.", key: "s_no" },
        { header: "Name", key: "firstname" },
        { header: "Payment", key: "payment" },
        { header: "Country", key: "country" },
        { header: "Address", key: "address" },
        { header: "State", key: "state" },
        { header: "City", key: "city" },
        { header: "Zip", key: "zip" },
        { header: "Date", key: "createdAt" },
        { header: "Status", key: "status" }
      ]
      let counter = 1;
      const orderData = await Order.find({});
      orderData.forEach(function (orders) {
        orders.s_no = counter;
        workSheet.addRow(orders);
        counter++;
      })
      workSheet.getRow(1).eachCell(function (cell) {
        cell.font = { bold: true };
      })
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      res.setHeader(
        "Content-Disposition", `attachment;filename=orders.xlsx`
      )
      return workBook.xlsx.write(res).then(function () {
        res.status(200);
      })
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const adminLogout = async (req, res) => {
  console.log('logout')
  try {
    console.log('logout try')
    adminSession = req.session
    adminSession.adminId = null
    console.log('admin logged out')
    res.redirect('/admin/login')
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  loadLogin,
  verifyLogin,
  adminLogout,
  loadDashboard,
  adminDashboard,
  blockUser,
  unBlockUser,
  addProduct,
  insertProduct,
  loadProduct,
  blockProduct,
  showProduct,
  addCategory,
  loadCategory,
  insertCategory,
  blockCategory,
  showCategory,
  editProduct,
  updateProduct,
  editCategory,
  updateCategory,
  loadCoupon,
  addCoupon,
  insertCoupon,
  blockCoupon,
  showCoupon,
  loadOrder,
  updateOrderStatus,
  orderDownload
}
