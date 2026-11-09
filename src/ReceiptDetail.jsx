import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './ReceiptDetail.css'
import { toCents, formatCents, splitEqually, unassignedCents } from './splitMath'

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
  // Who covers leftover cents in an equal split (defaults to the first selected person)
  const [remainderTo, setRemainderTo] = useState(null)

  // ✨ 저장 완료 여부 (화면 전환용)
  const [isSaved, setIsSaved] = useState(false)

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch ONE receipt by its ID (see supabase/v2_security.sql → get_receipt)
        const { data, error } = await supabase.rpc('get_receipt', { p_id: id })
        if (error) throw error
        if (!data || !data.receipt) throw new Error('Receipt not found')

        const receiptData = data.receipt
        const participantsData = data.participants
        setReceipt(receiptData)
        // 기존에 저장된 총액이 있으면 불러오기
        if (receiptData.total_amount) setTotalAmount(receiptData.total_amount)

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

  // 💰 All money math happens in integer cents (see splitMath.js)
  const totalCents = toCents(totalAmount)
  const equalSplit = splitEqually(totalCents, selectedIds, remainderTo)
  const remainderReceiver = selectedIds.includes(remainderTo) ? remainderTo : selectedIds[0]
  const leftToAssign = unassignedCents(totalCents, manualAmounts, selectedIds)

  // Final amount (in cents) each person owes under the current split mode
  const getAmountCents = (pid) => {
    if (!selectedIds.includes(pid)) return 0
    return splitType === 'EQUALLY' ? equalSplit.amounts[pid] : toCents(manualAmounts[pid])
  }

  const canSave =
    totalCents > 0 &&
    selectedIds.length > 0 &&
    (splitType === 'EQUALLY' || leftToAssign === 0)

  const handleManualChange = (id, value) => {
    let newAmounts = { ...manualAmounts, [id]: value }

    // With exactly 2 people, typing one amount auto-fills the other
    if (selectedIds.length === 2 && totalCents > 0) {
      const otherId = selectedIds.find(pid => pid !== id)
      if (otherId) {
        const remaining = Math.max(totalCents - toCents(value), 0)
        newAmounts[otherId] = formatCents(remaining)
      }
    }
    setManualAmounts(newAmounts)
  }

  // 💾 SAVE FUNCTION (DB 업데이트)
  const handleSave = async () => {
    if (totalCents <= 0) return alert("PLEASE ENTER AMOUNT! 💸")
    if (selectedIds.length === 0) return alert("PLEASE SELECT AT LEAST ONE PERSON! 👯")
    if (splitType === 'DIFFERENTLY' && leftToAssign !== 0) {
      return alert(`AMOUNTS MUST ADD UP TO $${formatCents(totalCents)}!`)
    }

    try {
      setLoading(true)

      // Save total + everyone's share in one secure call.
      // The server double-checks the shares add up (see supabase/v2_security.sql → save_split)
      const { error: saveError } = await supabase.rpc('save_split', {
        p_id: id,
        p_total: totalCents / 100,
        p_amounts: participants.map(p => ({ id: p.id, amount: getAmountCents(p.id) / 100 }))
      })
      if (saveError) throw saveError

      const saveToLocalHistory = (receiptData) => {
        const history = JSON.parse(localStorage.getItem('myReceipts') || '[]')
        if (!history.find(r => r.id === receiptData.id)) {
            const newEntry = {
                id: receiptData.id,
                category: receiptData.category,
                date: receiptData.receipt_date,
                total: formatCents(totalCents)
            }
            localStorage.setItem('myReceipts', JSON.stringify([newEntry, ...history]))
        }
    }

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
Total: $${formatCents(totalCents)}

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
                        {selectedIds.includes(person.id) ? `= $${formatCents(getAmountCents(person.id))}` : '-'}
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

            {/* 🪙 Equal split: show leftover cents and who covers them */}
            {splitType === 'EQUALLY' && equalSplit.remainder > 0 && (
              <div className="remainder-note" aria-live="polite">
                <label htmlFor="remainder-to">
                  {equalSplit.remainder}¢ LEFT OVER — WHO COVERS IT?
                </label>
                <select
                  id="remainder-to"
                  value={remainderReceiver}
                  onChange={(e) => setRemainderTo(e.target.value)}
                >
                  {participants
                    .filter(p => selectedIds.includes(p.id))
                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {/* ⚖️ Custom split: live counter until amounts match the total */}
            {splitType === 'DIFFERENTLY' && totalCents > 0 && (
              <p className="assign-status" aria-live="polite">
                {leftToAssign === 0
                  ? '✔ ALL ASSIGNED'
                  : leftToAssign > 0
                    ? `$${formatCents(leftToAssign)} LEFT TO ASSIGN`
                    : `$${formatCents(-leftToAssign)} OVER THE TOTAL`}
              </p>
            )}

            <button className="action-btn" onClick={handleSave} disabled={loading || !canSave}>
              {loading ? 'SAVING...' : 'SAVE & SPLIT! 💸'}
            </button>
          </>
        ) : (
          /* ================= [RESULT / SHARE MODE] ================= */
          <div className="result-view">
            <div className="success-icon">✨ SAVED! ✨</div>
            
            <div className="total-display">
              TOTAL: ${formatCents(totalCents)}
            </div>

            {/* 결과 리스트 */}
            <div className="result-list">
              {participants.map(p => {
                return (
                  <div key={p.id} className="result-row">
                    <span className="result-name">{p.name}</span>
                    <span className="result-amount">${formatCents(getAmountCents(p.id))}</span>
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