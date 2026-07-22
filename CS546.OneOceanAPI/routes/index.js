const constructorMethod = (app) => {
  app.get('/', (req, res) => {
    res.render('home', { title: 'One Ocean' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
};

export default constructorMethod;
