'use strict';

const express = require('express');
const { asyncHandler } = require('./middleware/async-handler');
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');
const { noExtendLeft } = require('sequelize/dist/lib/operators');

// Construct a router instance
const router = express.Router();

//Route to return current authenticated user for GET /users requests
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  // Filter out password, created_at, and updated_at
  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddress: user.emailAddress
  });
}));

// Route to create a new user for POST /users requests
router.post('/users', asyncHandler(async (req, res) => {
  try {
    await User.create(req.body);
    res.location('/');
    res.status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// Route to get all courses
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    // Filter out created_at and updated_at
    attributes: [
      'title', 
      'description', 
      'estimatedTime', 
      'materialsNeeded',
       'userId'
    ]
  });
  res.json(courses);
}));

// Route to get a specific course
router.get('/courses/:id', asyncHandler(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);
  if (course) {
    // Filter out created_at and updated_at
    res.json({
      title: course.title,
      description: course.description,
      estimatedTime: course.estimatedTime,
      materialsNeeded: course.materialsNeeded,
      userId: course.userId,
    });
  } else {
    next();
  }
}));

// Route to create a course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.location(`/courses/${course.id}`);
    res.status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// Route to update a course with a PUT request
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      // Course instructor must be current auth'd user
      if (course.userId === req.currentUser.id) {
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).json({ message: 'Access Denied' });
      }
    } else {
      next();
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// Route to update a course with a DELETE request
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      // Course instructor must be current auth'd user
      if (course.userId === req.currentUser.id) {
        await course.destroy();
        res.status(204).end();
      } else {
        res.status(403).json({ message: 'Access Denied' });
      }
    } else {
      next();
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));



module.exports = router;