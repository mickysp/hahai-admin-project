module.exports = {
    devServer: {
      setupMiddlewares: (middlewares, devServer) => {
        console.log('Middleware setup complete');
        return middlewares;
      }
    }
  };
  