const express = require("express");
const factoryAuth = (req, res, next) => {
  // 🔑 Superadmin সব জায়গায় access পাবে
  if (req.user.role === "superadmin") {
    return next(); // superadmin সব factory থেকে transfer করতে পারবে
  }
  const userFactoryId = String(req.user?.factoryId || "");
  const targetFactoryId = String(
    req.body?.fromFactory || // transfer এর জন্য
      req.body?.factoryId || // maintenance
      // req.query?.factoryId || // getMaintenances filter
      ""
  );

  if (!userFactoryId) {
    return res.status(400).json({ message: "User factory not assigned" });
  }
  if (!targetFactoryId) {
    return res.status(400).json({ message: "❌ Target factory not provided" });
  }
  if (userFactoryId !== targetFactoryId) {
    return res.status(403).json({
      message: "❌ You can only perform this action for your assigned factory",
    });
  }
  next();
};

module.exports = factoryAuth;
