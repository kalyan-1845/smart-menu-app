export const roleAuth = (role) => (req, res, next) => {
  if (req.headers.role !== role)
    return res.status(403).json({ msg: "Access denied" });
  next();
};
