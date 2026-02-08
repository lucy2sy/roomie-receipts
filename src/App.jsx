import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'    
import CreateReceipt from './CreateReceipt'
import ReceiptDetail from './ReceiptDetail'
import History from './History' 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/create" element={<CreateReceipt />} />
        
        <Route path="/share/:id" element={<ReceiptDetail />} />

        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App