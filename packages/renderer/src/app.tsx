import './app.scss';
import './styles.scss';

import { useLocation, useRoutes } from 'solid-app-router';
import { Component } from 'solid-js';

import { routes } from './routes';

const App: Component = () => {
  const location = useLocation();
  const Route = useRoutes(routes);

  return (
    <>
      <Route />
    </>
  );
};

export default App;
