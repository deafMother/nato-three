const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authController = require('../controllers/authController.js');
const reviewCOntroller = require('../controllers/reviewController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.patch('/updateMe', authController.protect, UserController.updateMe);
router.delete('/deleteMe', authController.protect, UserController.deleteMe);

router
  .route('/')
  .get(UserController.getAllUsers)
  .post(UserController.createUser);
router
  .route('/:id')
  .get(UserController.getUser)
  .patch(UserController.updateUser)
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    UserController.deleteUser
  );

module.exports = router;
