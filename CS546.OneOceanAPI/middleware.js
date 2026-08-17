// Expose the logged-in session user to all rendered views via res.locals.
// Runs after the session middleware so req.session is available, and before
// routes so every res.render() call can read `user` in its template.
export const exposeUserToViews = (req, res, next) => {
  res.locals.user = (req.session && req.session.user) || null;
  next();
};

// Request logging middleware
export const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toUTCString();
  const method = req.method;
  const route = req.originalUrl;
  const authStatus = req.session && req.session.user ? 'Authenticated User' : 'Non-Authenticated User';

  console.log(`[${timestamp}]: ${method} ${route} (${authStatus})`);
  next();
};

// Global Express Error Handling Middleware
// Express requires all 4 parameters: (err, req, res, next)
export const globalErrorHandler = (err, req, res, next) => {
  console.error('🔥 Global Error Middleware Caught:', err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = typeof err === 'string' ? err : err.message || 'An internal server error occurred.';

  // If request is AJAX/API call expecting JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(statusCode).json({ error: errorMessage });
  }

  // Otherwise render user-friendly HTML error template
  return res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode: statusCode,
    error: errorMessage
  });
};