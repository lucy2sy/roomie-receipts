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

  // Inline messages (instead of alert pop-ups)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

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
        setLoadError("We couldn't find this receipt. Please check the link.")
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
    if (totalCents <= 0) {
      setSaveError('Please enter the total amount.')
      document.getElementById('total-amount')?.focus()
      return
    }
    if (selectedIds.length === 0) {
      return setSaveError('Please select at least one person.')
    }
    if (splitType === 'DIFFERENTLY' && leftToAssign !== 0) {
      return setSaveError(`The amounts need to add up to $${formatCents(totalCents)}.`)
    }
    setSaveError('')

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
      setSaveError("Couldn't save. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // 🔗 COPY LINK FUNCTION
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setStatusMsg('Link copied! Share it with your roomies.')
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
  setStatusMsg('Reminder copied! Paste it into your group chat.')
}

  return (
    <main className="detail-container">
      
      {/* 🔙 BACK Button */}
      <button 
        type="button"
        className="home-btn" 
        style={{top: '30px', left: '30px', position: 'absolute'}}
        onClick={() => navigate('/create')}
      >
        <span aria-hidden="true">← </span>BACK
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

        {/* 🌟 조건부 렌더링: 불러오기 실패 / 저장 전 / 저장 후 */}
        {loadError ? (
          <p className="form-error" role="alert">{loadError}</p>
        ) : !isSaved ? (
          /* ================= [EDIT MODE] ================= */
          <>
 
            <div className="amount-section">
              <label htmlFor="total-amount" className="input-label">HOW MUCH?</label>
              <input 
                id="total-amount"
                className="input-field big-input" 
                type="number" 
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="$ 0.00" 
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="split-tabs" role="group" aria-label="How to split">
              <button 
                type="button"
                className={`tab-btn ${splitType === 'EQUALLY' ? 'active' : ''}`}
                aria-pressed={splitType === 'EQUALLY'}
                onClick={() => setSplitType('EQUALLY')}
              >
                SPLIT EQUALLY
              </button>
              <button 
                type="button"
                className={`tab-btn ${splitType === 'DIFFERENTLY' ? 'active' : ''}`}
                aria-pressed={splitType === 'DIFFERENTLY'}
                onClick={() => setSplitType('DIFFERENTLY')}
              >
                SPLIT DIFFERENTLY
              </button>
            </div>

            <div className="split-list-container">
              <div className="split-row header-row">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="visually-hidden"
                    checked={participants.length > 0 && selectedIds.length === participants.length}
                    onChange={toggleAll}
                  />
                  <span aria-hidden="true" className={`custom-checkbox ${selectedIds.length === participants.length ? 'checked' : ''}`}>
                    {selectedIds.length === participants.length && '✔'}
                  </span>
                  <span className="row-name">ALL</span>
                </label>
              </div>

              {participants.map((person) => (
                <div key={person.id} className="split-row">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      className="visually-hidden"
                      checked={selectedIds.includes(person.id)}
                      onChange={() => toggleSelection(person.id)}
                    />
                    <span aria-hidden="true" className={`custom-checkbox ${selectedIds.includes(person.id) ? 'checked' : ''}`}>
                      {selectedIds.includes(person.id) && '✔'}
                    </span>
                    <span className="row-name">{person.name}</span>
                  </label>

                  <div className="row-right">
                    {splitType === 'EQUALLY' ? (
                      <span className="split-result">
                        {selectedIds.includes(person.id) ? `= $${formatCents(getAmountCents(person.id))}` : '-'}
                      </span>
                    ) : (
                      selectedIds.includes(person.id) && (
                        <div className="manual-input-wrapper">
                          <span className="currency-symbol" aria-hidden="true">$</span>
                          <input 
                            className="small-input"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            aria-label={`${person.name}'s amount in dollars`}
                            value={manualAmounts[person.id] || ''}
                            onChange={(e) => handleManualChange(person.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="clear-x-btn"
                            aria-label={`Clear ${person.name}'s amount`}
                            onClick={() => handleManualChange(person.id, '')}
                          >×</button>
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

            <div role="alert">
              {saveError && <p className="form-error">{saveError}</p>}
            </div>

            <button type="button" className="action-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE & SPLIT!'}
            </button>
          </>
        ) : (
          /* ================= [RESULT / SHARE MODE] ================= */
          <div className="result-view">
            <h2 className="success-icon" role="status">
              <span aria-hidden="true">✨ </span>SAVED!<span aria-hidden="true"> ✨</span>
            </h2>
            
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
              <p>SEND A GENTLE REMINDER <span aria-hidden="true">🔔</span></p>
              {/* 1. 링크만 복사 */}
              <button type="button" className="copy-link-btn" onClick={handleCopyLink} style={{marginBottom: '10px'}}>
                <span aria-hidden="true">🔗 </span>COPY LINK ONLY
              </button>
  
              {/* 2. 친절한 메시지 복사 (핵심 기능!) */}
              <button type="button" className="copy-msg-btn" onClick={handleCopyMessage}>
                <span aria-hidden="true">💌 </span>COPY FRIENDLY MSG
              </button>

              {/* 🔒 Plain-language privacy note: the link is the key */}
              <p className="privacy-note">
                <span aria-hidden="true">🔒 </span>
                Anyone with this link can view and edit this receipt, so only share it with your roomies.
              </p>

              {/* Announced to screen readers when a copy succeeds */}
              <p className="status-message" aria-live="polite">{statusMsg}</p>
            </div>

            {/* 히스토리로 이동 */}
            <button type="button" className="history-btn" onClick={() => navigate('/history')}>
              <span aria-hidden="true">📂 </span>GO TO HISTORY
            </button>
            
            {/* 다시 수정하기 (선택 사항) */}
            <button type="button" className="edit-again-btn" onClick={() => { setIsSaved(false); setStatusMsg('') }}>
              <span aria-hidden="true">✎ </span>EDIT AGAIN
            </button>
          </div>
        )}

      </div>
    </main>
  )
}