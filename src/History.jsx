import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom' // 👈 useLocation 추가!
import './CreateReceipt.css'

export default function History() {
  const navigate = useNavigate()
  const location = useLocation() // 👈 넘어온 데이터 받기용
  
  const [myReceipts, setMyReceipts] = useState([])
  const [filter, setFilter] = useState('ALL') // 👈 필터 상태 추가 (기본값: 전체)

  useEffect(() => {
    // 1. 로컬 스토리지에서 데이터 가져오기
    const saved = localStorage.getItem('myReceipts')
    if (saved) {
      setMyReceipts(JSON.parse(saved))
    }

    // 2. Create 페이지에서 넘어올 때 "특정 카테고리"를 요청했는지 확인
    if (location.state && location.state.category) {
      setFilter(location.state.category) // 필터 적용!
    }
  }, [location])

  // 🧹 필터링된 리스트 계산
  const filteredList = filter === 'ALL' 
    ? myReceipts 
    : myReceipts.filter(r => r.category === filter)

  return (
    <main className="create-container">
      
      {/* 🏠 홈 버튼 */}
      <button type="button" className="home-btn" onClick={() => navigate('/')}>
        <span aria-hidden="true">𖠿 </span>HOME
      </button>

      <div className="left-section" style={{ flex: 'none', maxWidth: '600px', margin: '0 auto' }}>
        
        <h1 className="section-header">
          {filter === 'ALL' ? 'MY RECEIPT HISTORY' : `MY ${filter} HISTORY`}
        </h1>

        {/* 🏷️ 필터 탭 (여기서도 바꿀 수 있게!) */}
        <div role="group" aria-label="Filter by category" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['ALL', 'GROCERY', 'FURNITURE', 'TRIP'].map(cat => (
            <button
              type="button"
              key={cat}
              aria-pressed={filter === cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '8px 15px',
                borderRadius: '20px',
                border: '1px solid black',
                background: filter === cat ? 'var(--purple)' : 'white',
                color: filter === cat ? 'white' : 'black',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* 📭 기록이 없을 때 */}
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '2px dashed #ccc', borderRadius: '15px' }}>
            NO {filter !== 'ALL' ? filter : ''} RECEIPTS YET! <br/> 
            <span style={{ fontSize: '2rem', display: 'block', marginTop: '10px' }}>🤷‍♀️</span>
          </div>
        ) : (
          /* 📜 리스트 보여주기 */
 
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px', listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredList.map((item, index) => (
              <li key={index}>
              <button
                type="button"
                className="input-box" 
                aria-label={`${item.category} receipt, ${item.date}, total $${item.total || '0.00'}. Open receipt`}
                style={{ 
                  width: '100%',
                  textAlign: 'left',
                  color: 'inherit',
                  background: 'white',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: '2px solid black',
                  borderRadius: '15px',
                  boxShadow: '4px 4px 0 rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s'
                }}
                onClick={() => navigate(`/share/${item.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>
                  <span style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    <span aria-hidden="true">
                      {item.category === 'GROCERY' && '🛒 '}
                      {item.category === 'FURNITURE' && '🪑 '}
                      {item.category === 'TRIP' && '✈️ '}
                    </span>
                    {item.category}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>{item.date}</span>
                </span>
                <span style={{ fontWeight: 'bold', color: 'var(--purple)', fontSize: '1.2rem' }}>
                  ${item.total || '0.00'} <span aria-hidden="true">&gt;</span>
                </span>
              </button>
              </li>
            ))}
          </ul>
        )}

        {/* 🗑 전체 삭제 버튼 */}
        {myReceipts.length > 0 && (
          <button 
            type="button"
            style={{ 
              marginTop: '30px', 
              background: 'transparent', 
              border: 'none', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              color: 'var(--text-muted)',
              width: '100%'
            }}
            onClick={() => {
              if(window.confirm('REALLY CLEAR ALL HISTORY? 🧹')) {
                localStorage.removeItem('myReceipts')
                setMyReceipts([])
              }
            }}
          >
            🗑 CLEAR ALL HISTORY
          </button>
        )}
        
      </div>
    </main>
  )
}