import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('Frontend Render Tests', () => {
  it('renders without crashing', () => {
    // The App component might try to connect to the backend or use context.
    // For a simple render test, we just check if the shell loads.
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Assuming there's a login screen or loading state initially.
    expect(document.body).toBeInTheDocument();
  });
});
