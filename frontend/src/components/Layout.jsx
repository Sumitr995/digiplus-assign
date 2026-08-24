import { NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">DigiPlus Log Analyzer</h1>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/logs">Logs</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}