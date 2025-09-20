const express = require("express");
const factoryAuth = (req, res, next) => {
  const userFactoryId = String(req.user?.factoryId || "");
  const fromFactoryId = String(req.body?.fromFactory || "");

  if (!userFactoryId) {
    return res.status(400).json({ message: "User factory not assigned" });
  }

  if (userFactoryId !== fromFactoryId) {
    return res.status(403).json({
      message: "❌ You can only transfer from your registered factory",
    });
  }
  next();
};

module.exports = factoryAuth;
