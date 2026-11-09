import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './CreateReceipt.css'

export default function CreateReceipt() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Basic info state (Title, Category, Date, My Name)
  const [formData, setFormData] = useState({
    title: '',
    category: 'GROCERY',
    date: '',
    myName: ''
  })

  // Roomie list state (Starts with one empty slot)
  const [roomies, setRoomies] = useState([''])

  // Function to add a new roomie input field
  const handleAddRoomie = () => {
    setRoomies([...roomies, ''])
  }

  // Function to handle changes in roomie input fields
  const handleRoomieChange = (index, value) => {
    const newRoomies = [...roomies]
    newRoomies[index] = value
    setRoomies(newRoomies)
  }

  const handleCreate = async () => {
    // 1. Validation: Check if required fields are filled
    if (!formData.date) return alert('PLEASE ENTER THE DATE! 📅')
    if (!formData.myName) return alert('PLEASE ENTER YOUR NAME! 👤')
    
    // Check if at least one roomie name is entered
    const validRoomies = roomies.filter(name => name.trim() !== '')
    if (validRoomies.length === 0) return alert('PLEASE ENTER AT LEAST ONE ROOMIE! 👯‍♀️')
    
    setLoading(true)
    try {
      // 2. Create the receipt + participants (me first, then roomies) in one secure call
      //    (see supabase/v2_security.sql → create_receipt)
      const { data: receiptId, error } = await supabase.rpc('create_receipt', {
        p_title: formData.title || 'GROCERY RUN',
        p_category: formData.category,
        p_date: formData.date,
        p_names: [formData.myName, ...validRoomies]
      })

      if (error) throw error

      // 3. Navigate to the detail/share page
      navigate(`/share/${receiptId}`)

    } catch (error) {
      alert('ERROR: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-container">
      
      {/* 🏠 Home Button */}
      <button className="home-btn" onClick={() => navigate('/')}>
        𖠿 HOME
      </button>

      {/* LEFT SECTION: Input Form */}
      <div className="left-section">
        
        <div className="section-header">CREATE A NEW RECEIPT</div>

        {/* 1. RECEIPT TYPE */}
        <div>
          <div className="label-pill">RECEIPT TYPE</div>
          <div className="input-box" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {['GROCERY', 'FURNITURE', 'TRIP'].map(cat => (
              <button 
                key={cat}
                className={`cat-btn ${formData.category === cat ? 'active' : ''}`}
                onClick={() => setFormData({...formData, category: cat})}
              >
                {cat}{formData.category === cat ? ',' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* 2. DATE (Required) */}
        <div>
          <div className="label-pill">DATE</div>
          <input 
            className="input-box"
            placeholder="YYYY/MM/DD"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>

        {/* 3. MY NAME (Required) */}
        <div>
          <div className="label-pill">MY NAME</div>
          <input 
            className="input-box"
            placeholder="EX) LUCY"
            value={formData.myName}
            onChange={(e) => setFormData({...formData, myName: e.target.value})}
          />
        </div>

        {/* 4. ROOMIE NAME (Dynamic List) */}
        <div>
          {roomies.map((roomie, index) => (
            <div key={index}>
              <div className="label-pill">ROOMIE NAME {index + 1}</div>
              <input 
                className="input-box"
                placeholder={`EX) ROOMIE ${index + 1}`}
                value={roomie}
                onChange={(e) => handleRoomieChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Add Roomie Button */}
        <button className="add-roomie-btn" onClick={handleAddRoomie}>
          + ADD ANOTHER ROOMIE
        </button>

        {/* CREATE Button */}
        <button className="create-btn" onClick={handleCreate} disabled={loading}>
          {loading ? 'CREATING...' : 'CREATE! ><'}
        </button>

      </div>

      {/* RIGHT SECTION: History (Placeholder) */}
      <div className="right-section">
  <div className="section-header">VIEW HISTORIES</div>
  
  {/* 👇 버튼에 클릭 이벤트(onClick) 추가! */}
  <button 
    className="history-pill" 
    onClick={() => navigate('/history', { state: { category: 'GROCERY' } })}
  >
    GROCERY
  </button>

  <button 
    className="history-pill" 
    onClick={() => navigate('/history', { state: { category: 'FURNITURE' } })}
  >
    FURNITURE
  </button>

  <button 
    className="history-pill" 
    onClick={() => navigate('/history', { state: { category: 'TRIP' } })}
  >
    TRIP
  </button>

  {/* 전체 보기 버튼도 하나 있으면 좋겠죠? (선택사항) */}
  <button 
    className="history-pill" 
    style={{ background: '#eee', marginTop: '10px' }}
    onClick={() => navigate('/history', { state: { category: 'ALL' } })}
  >
    VIEW ALL 📂
  </button>
</div>

    </div>
  )
}