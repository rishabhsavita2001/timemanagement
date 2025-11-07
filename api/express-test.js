// Express test endpoint
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const express = require('express');
    res.status(200).json({
      status: 'Express loaded successfully',
      message: 'Express is available and ready to use'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Express failed to load',
      error: error.message
    });
  }
};