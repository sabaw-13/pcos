import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock(
  'react-router-dom',
  () => {
    const React = require('react');
    const navigate = jest.fn();

    return {
      BrowserRouter: ({ children }) => <div>{children}</div>,
      Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
          {children}
        </a>
      ),
      Route: () => null,
      Routes: ({ children }) => {
        const routes = React.Children.toArray(children);
        const indexRoute = routes.find((route) => route.props.path === '/');
        return indexRoute ? indexRoute.props.element : null;
      },
      useLocation: () => ({ pathname: '/' }),
      useNavigate: () => navigate
    };
  },
  { virtual: true }
);

jest.mock('./context/authcontext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: null,
    authLoading: false,
    isAdmin: false,
    isCustomer: false,
    logout: jest.fn()
  })
}));

test('renders the cafe info page as the index route', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /savor the flavor/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /open user account/i })).toBeInTheDocument();
  expect(screen.getByText(/persimmonay signature experience/i)).toBeInTheDocument();
});
