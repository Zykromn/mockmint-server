const authCheck = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    return res.status(401).json({ code: 'AUTH_REQUIRED' });
};

export default authCheck;