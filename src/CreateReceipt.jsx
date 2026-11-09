import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './CreateReceipt.css'

const CATEGORIES = ['GROCERY', 'FURNITURE', 'TRIP']

// Today's date as YYYY-MM-DD in the user's own time zone (for the date picker's max)
function todayISO() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Inline error message tied to a field (read out by screen readers via aria-describedby)
function FieldError({ id, message }) {
  if (!message) return null
  return <p id={id} className="field-error">{message}</p>
}

export default function CreateReceipt() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const today = todayISO()

  // Basic info state (Category, Date, My Name)
  const [formData, setFormData] = useState({
    title: '',
    category: 'GROCERY',
    date: today,
    myName: ''
  })

  // Roomie list state (Starts with one empty slot)
  const [roomies, setRoomies] = useState([''])

  // Inline errors: { date, myName, roomies, submit }
  const [errors, setErrors] = useState({})

  const handleAddRoomie = () => {
    setRoomies([...roomies, ''])
  }

  const handleRoomieChange = (index, value) => {
    const newRoomies = [...roomies]
    newRoomies[index] = value
    setRoomies(newRoomies)
  }

  const validate = () => {
    const next = {}
    if (!formData.date) {
      next.date = 'Please pick the date of the purchase.'
    } else if (formData.date > today) {
      next.date = "The date can't be in the future."
    }
    if (!formData.myName.trim()) {
      next.myName = 'Please enter your name.'
    }
    if (roomies.every(name => name.trim() === '')) {
      next.roomies = 'Please add at least one roomie.'
    }
    return next
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first field with a problem
      const firstId = { date: 'receipt-date', myName: 'my-name', roomies: 'roomie-0' }[Object.keys(found)[0]]
      document.getElementById(firstId)?.focus()
      return
    }

    const validRoomies = roomies.map(n => n.trim()).filter(Boolean)

    setLoading(true)
    try {
      // Create the receipt + participants (me first, then roomies) in one secure call
      // (see supabase/v2_security.sql → create_receipt)
      const { data: receiptId, error } = await supabase.rpc('create_receipt', {
        p_title: formData.title || 'GROCERY RUN',
        p_category: formData.category,
        p_date: formData.date,
        p_names: [formData.myName.trim(), ...validRoomies]
      })

      if (error) throw error

      navigate(`/share/${receiptId}`)

    } catch (error) {
      console.error(error)
      setErrors({ submit: "Couldn't create the receipt. Please check your connection and try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-container">

      {/* 🏠 Home Button */}
      <button type="button" className="home-btn" onClick={() => navigate('/')}>
        <span aria-hidden="true">𖠿 </span>HOME
      </button>

      {/* LEFT SECTION: Input Form */}
      <form className="left-section" onSubmit={handleCreate} noValidate>

        <h1 className="section-header">CREATE A NEW RECEIPT</h1>

        {/* 1. RECEIPT TYPE */}
        <fieldset className="field-group">
          <legend className="label-pill">RECEIPT TYPE</legend>
          <div className="input-box" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat}
                className={`cat-btn ${formData.category === cat ? 'active' : ''}`}
                aria-pressed={formData.category === cat}
                onClick={() => setFormData({ ...formData, category: cat })}
              >
                {cat}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 2. DATE (Required, not in the future) */}
        <div>
          <label htmlFor="receipt-date" className="label-pill">DATE</label>
          <input
            id="receipt-date"
            type="date"
            className="input-box"
            max={today}
            required
            value={formData.date}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'receipt-date-error' : undefined}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <FieldError id="receipt-date-error" message={errors.date} />
        </div>

        {/* 3. MY NAME (Required) */}
        <div>
          <label htmlFor="my-name" className="label-pill">MY NAME</label>
          <input
            id="my-name"
            className="input-box"
            placeholder="EX) LUCY"
            autoComplete="given-name"
            required
            value={formData.myName}
            aria-invalid={!!errors.myName}
            aria-describedby={errors.myName ? 'my-name-error' : undefined}
            onChange={(e) => setFormData({ ...formData, myName: e.target.value })}
          />
          <FieldError id="my-name-error" message={errors.myName} />
        </div>

        {/* 4. ROOMIE NAME (Dynamic List) */}
        <div>
          {roomies.map((roomie, index) => (
            <div key={index}>
              <label htmlFor={`roomie-${index}`} className="label-pill">ROOMIE NAME {index + 1}</label>
              <input
                id={`roomie-${index}`}
                className="input-box"
                placeholder={`EX) ROOMIE ${index + 1}`}
                value={roomie}
                aria-invalid={index === 0 && !!errors.roomies}
                aria-describedby={index === 0 && errors.roomies ? 'roomies-error' : undefined}
                onChange={(e) => handleRoomieChange(index, e.target.value)}
              />
            </div>
          ))}
          <FieldError id="roomies-error" message={errors.roomies} />
        </div>

        {/* Add Roomie Button */}
        <button type="button" className="add-roomie-btn" onClick={handleAddRoomie}>
          + ADD ANOTHER ROOMIE
        </button>

        {/* Form-level error (network etc.) */}
        <div role="alert">
          {errors.submit && <p className="field-error">{errors.submit}</p>}
        </div>

        {/* CREATE Button */}
        <button type="submit" className="create-btn" disabled={loading}>
          {loading ? 'CREATING...' : 'CREATE!'}
        </button>

      </form>

      {/* RIGHT SECTION: History shortcuts */}
      <nav className="right-section" aria-labelledby="history-heading">
        <h2 id="history-heading" className="section-header">VIEW HISTORIES</h2>

        {CATEGORIES.map(cat => (
          <button
            type="button"
            key={cat}
            className="history-pill"
            onClick={() => navigate('/history', { state: { category: cat } })}
          >
            {cat}
          </button>
        ))}

        <button
          type="button"
          className="history-pill"
          style={{ background: '#eee', marginTop: '10px' }}
          onClick={() => navigate('/history', { state: { category: 'ALL' } })}
        >
          VIEW ALL <span aria-hidden="true">📂</span>
        </button>
      </nav>

    </div>
  )
}
