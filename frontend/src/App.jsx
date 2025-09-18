import './App.css'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import Navbar from './componants/common/Navbar'
import Footer from './componants/common/Footer'

function App() {
  return (
    <div className='bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col'>
      <Navbar />

      <main className="flex-1">
        <Routes>
          {routes.map((route, index) => {
            if (route.children) {
              return (
                <Route key={index} path={route.path} element={route.element}>
                  {route.children.map((child, cIdx) => (
                    <Route
                      key={cIdx}
                      path={child.path}
                      element={child.element}
                    />
                  ))}
                </Route>
              )
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            )
          })}
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
