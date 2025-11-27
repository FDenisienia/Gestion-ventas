import Header from './Header'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

