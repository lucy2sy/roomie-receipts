import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './ReceiptDetail.css'

export default function ReceiptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [receipt, setReceipt] = useState(null)
  const [totalAmount, setTotalAmount] = useState('') 
  const [splitType, setSplitType] = useState('EQUALLY') 
  
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([]) 
  const [manualAmounts, setManualAmounts] = useState({})

  // ✨ 저장 완료 여부 (화면 전환용)
  const [isSaved, setIsSaved] = useState(false)

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', id)
          .single()
        if (receiptError) throw receiptError
        setReceipt(receiptData)
        // 기존에 저장된 총액이 있으면 불러오기
        if (receiptData.total_amount) setTotalAmount(receiptData.total_amount)

        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('receipt_id', id)
        if (participantsError) throw participantsError
        
        if (participantsData) {
          setParticipants(participantsData)
          setSelectedIds(participantsData.map(p => p.id)) 
          
          // 기존에 저장된 금액이 있으면 불러오기 (없으면 빈칸)
          const initialAmounts = {}
          participantsData.forEach(p => initialAmounts[p.id] = p.amount_owed || '')
          setManualAmounts(initialAmounts)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // ... (Toggle 함수들은 그대로 유지) ...
  const toggleSelection = (pid) => {
    if (selectedIds.includes(pid)) {
      setSelectedIds(selectedIds.filter(id => id !== pid))
      const newAmounts = { ...manualAmounts, [pid]: '' }
      setManualAmounts(newAmounts)
    } else {
      setSelectedIds([...selectedIds, pid])
    }
  }

  const toggleAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]) 
      setManualAmounts({}) 
    } else {
      setSelectedIds(participants.map(p => p.id)) 
    }
  }

  const getSplitAmount = () => {
    const total = parseFloat(totalAmount) || 0
    const count = selectedIds.length
    if (total === 0 || count === 0) return '0.00'
    return (total / count).toFixed(2) // 문자열 반환
  }

  const handleManualChange = (id, value) => {
    let newAmounts = { ...manualAmounts, [id]: value }
    const total = parseFloat(totalAmount) || 0
    const val = parseFloat(value) || 0

    if (selectedIds.length === 2 && total > 0) {
      const otherId = selectedIds.find(pid => pid !== id)
      if (otherId) {
        const remaining = total - val
        newAmounts[otherId] = remaining > 0 ? parseFloat(remaining.toFixed(2)) : 0
      }
    }
    setManualAmounts(newAmounts)
  }

  // 💾 SAVE FUNCTION (DB 업데이트)
  const handleSave = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) return alert("PLEASE ENTER AMOUNT! 💸")

    try {
      setLoading(true)

      // 1. 총액 업데이트 (Receipts)
      await supabase
        .from('receipts')
        .update({ total_amount: totalAmount })
        .eq('id', id)

      // 2. 각자 낼 돈 계산 및 업데이트 (Participants)
      const updates = participants.map(p => {
        let amount = 0
        if (selectedIds.includes(p.id)) {
          if (splitType === 'EQUALLY') {
            amount = parseFloat(getSplitAmount())
          } else {
            amount = parseFloat(manualAmounts[p.id]) || 0
          }
        }
        
        return supabase
          .from('participants')
          .update({ amount_owed: amount })
          .eq('id', p.id)
      })

      const saveToLocalHistory = (receiptData) => {
        const history = JSON.parse(localStorage.getItem('myReceipts') || '[]')
        if (!history.find(r => r.id === receiptData.id)) {
            const newEntry = {
                id: receiptData.id,
                category: receiptData.category,
                date: receiptData.receipt_date,
                total: totalAmount
            }
            localStorage.setItem('myReceipts', JSON.stringify([newEntry, ...history]))
        }
    }

      await Promise.all(updates)
      saveToLocalHistory(receipt) // 👈 여기에 추가! (내 컴퓨터에 기록 남기기)
      setIsSaved(true) // 화면 전환!
      // alert("SAVED SUCCESSFULLY! 🎉") 

    } catch (error) {
      console.error(error)
      alert("SAVE FAILED 😭")
    } finally {
      setLoading(false)
    }
  }

  // 🔗 COPY LINK FUNCTION
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("LINK COPIED! 📋 SHARE IT WITH YOUR ROOMIES!")
  }

  const handleCopyMessage = () => {
  const url = window.location.href
  const msg = `
Hello Roomies! 🏡
The receipt for ${receipt.category} is ready! 🧾
Total: $${parseFloat(totalAmount).toFixed(2)}

👇 Check who owes what here:
${url}

Let's settle up! 💸
  `.trim()
  
  navigator.clipboard.writeText(msg)
  alert("FRIENDLY REMINDER COPIED! 💌 PASTE IT TO YOUR GROUP CHAT!")
}

  return (
    <div className="detail-container">
      
      {/* 🔙 BACK Button */}
      <button 
        className="home-btn" 
        style={{top: '30px', left: '30px', position: 'absolute'}}
        onClick={() => navigate('/create')}
      >
        ← BACK
      </button>

      <div className="receipt-card">
        
        {/* Header */}
        <div className="receipt-header">
          <h1 className="receipt-title">
            RECEIPT: {receipt ? receipt.category : 'LOADING...'}
          </h1>
          <p className="receipt-date">
            DATE: {receipt ? receipt.receipt_date : '...'}
          </p>
        </div>

        {/* 🌟 조건부 렌더링: 저장 전 vs 저장 후 */}
        {!isSaved ? (
          /* ================= [EDIT MODE] ================= */
          <>
            <div className="scan-area" onClick={() => alert("OCR Coming Soon! 🚧")}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🧾 📷</div>
              <div className="scan-text">SCAN YOUR RECEIPT</div>
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>
                Automatically fill in the amount
              </div>
            </div>

            <div className="separator-text">- OR ENTER MANUALLY -</div>

            <div className="amount-section">
              <label className="input-label">HOW MUCH?</label>
              <input 
                className="input-field big-input" 
                type="number" 
                placeholder="$ 0.00" 
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="split-tabs">
              <button 
                className={`tab-btn ${splitType === 'EQUALLY' ? 'active' : ''}`}
                onClick={() => setSplitType('EQUALLY')}
              >
                SPLIT EQUALLY
              </button>
              <button 
                className={`tab-btn ${splitType === 'DIFFERENTLY' ? 'active' : ''}`}
                onClick={() => setSplitType('DIFFERENTLY')}
              >
                SPLIT DIFFERENTLY
              </button>
            </div>

            <div className="split-list-container">
              <div className="split-row header-row">
                <div className="checkbox-wrapper" onClick={toggleAll}>
                  <div className={`custom-checkbox ${selectedIds.length === participants.length ? 'checked' : ''}`}>
                    {selectedIds.length === participants.length && '✔'}
                  </div>
                  <span className="row-name">ALL</span>
                </div>
              </div>

              {participants.map((person) => (
                <div key={person.id} className="split-row">
                  <div className="checkbox-wrapper" onClick={() => toggleSelection(person.id)}>
                    <div className={`custom-checkbox ${selectedIds.includes(person.id) ? 'checked' : ''}`}>
                      {selectedIds.includes(person.id) && '✔'}
                    </div>
                    <span className="row-name">{person.name}</span>
                  </div>

                  <div className="row-right">
                    {splitType === 'EQUALLY' ? (
                      <span className="split-result">
                        {selectedIds.includes(person.id) ? `= $${getSplitAmount()}` : '-'}
                      </span>
                    ) : (
                      selectedIds.includes(person.id) && (
                        <div className="manual-input-wrapper">
                          <span className="currency-symbol">$</span>
                          <input 
                            className="small-input"
                            type="number"
                            placeholder="0"
                            value={manualAmounts[person.id] || ''}
                            onChange={(e) => handleManualChange(person.id, e.target.value)}
                          />
                          <button className="clear-x-btn" onClick={() => handleManualChange(person.id, '')}>×</button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="action-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE & SPLIT! 💸'}
            </button>
          </>
        ) : (
          /* ================= [RESULT / SHARE MODE] ================= */
          <div className="result-view">
            <div className="success-icon">✨ SAVED! ✨</div>
            
            <div className="total-display">
              TOTAL: ${parseFloat(totalAmount).toFixed(2)}
            </div>

            {/* 결과 리스트 */}
            <div className="result-list">
              {participants.map(p => {
                // 저장된 값(또는 계산된 값) 보여주기
                let amount = 0
                if (selectedIds.includes(p.id)) {
                  amount = splitType === 'EQUALLY' ? getSplitAmount() : (manualAmounts[p.id] || 0)
                }
                return (
                  <div key={p.id} className="result-row">
                    <span className="result-name">{p.name}</span>
                    <span className="result-amount">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>

            {/* 공유 섹션 */}
            <div className="share-section">
              <p>SEND A GENTLE REMINDER 🔔</p>
              {/* 1. 링크만 복사 */}
              <button className="copy-link-btn" onClick={handleCopyLink} style={{marginBottom: '10px'}}>
                🔗 COPY LINK ONLY
              </button>
  
              {/* 2. 친절한 메시지 복사 (핵심 기능!) */}
              <button className="copy-msg-btn" onClick={handleCopyMessage}>
                💌 COPY FRIENDLY MSG
              </button>
            </div>

            {/* 히스토리로 이동 */}
            <button className="history-btn" onClick={() => navigate('/history')}>
              📂 GO TO HISTORY
            </button>
            
            {/* 다시 수정하기 (선택 사항) */}
            <button className="edit-again-btn" onClick={() => setIsSaved(false)}>
              ✎ EDIT AGAIN
            </button>
          </div>
        )}

      </div>
    </div>
  )
}