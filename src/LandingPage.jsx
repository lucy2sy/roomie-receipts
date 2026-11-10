import { useNavigate } from 'react-router-dom'
import './LandingPage.css' 
import logoImg from './assets/logo.png'
import paperImg from './assets/paper.png'
import starImg from './assets/star-icon.png'
import step1Img from './assets/step1.png'
import step2Img from './assets/step2.png'
import step3Img from './assets/step3.png'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="main-wrapper">
      
      {/* 🏠 집 전체 컨테이너 */}
      <div className="house-container">
        
        {/* ✨ 흰색 점 (지붕 꼭대기) */}
        <div className="roof-window"></div>

        {/* 1. 지붕 섹션 (삼각형) */}
        <div className="house-roof"></div>

        {/* 2. 몸통 섹션 (직사각형) */}
        <div className="house-body">

          {/* 로고 */}
          {/* Page title for screen readers; the logo image shows the same words visually */}
          <h1 className="visually-hidden">Roomie Receipts</h1>
          <img src={logoImg} alt="" className="logo-img" />

          {/* 메인 비주얼 (종이 + 별) */}
          <div className="paper-wrapper">
            <img src={starImg} className="star star-left" alt="" />
            <img src={paperImg} className="paper-img" alt="" />
            <div className="paper-text">
              Roomie Receipts is a personal project by Lucy Lee: a bill-splitting tool that helps college roommates and housemates manage shared household costs.
            </div>
            <img src={starImg} className="star star-right" alt="" />
          </div>

          {/* HOW IT WORKS 버튼 */}
          <div className="btn-container">
            <button
              type="button"
              className="how-to-btn"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              HOW IT WORKS
            </button>
          </div>

          {/* 설명 섹션 (3단계로 축소됨!) */}
          <div className="content-section" id="how-it-works">
            
            {/* Step 1: CREATE & ADD */}
            <div className="info-block">
              <div className="text-box">
                <h2 className="step-title">CREATE & ADD <span aria-hidden="true">🛒</span></h2>
                <p className="step-desc">No login required. Just create a receipt and add your roomies. It's that simple!</p>
              </div>
              <div className="img-placeholder">
                <img
                src={step1Img} 
                alt="Create receipt screen: pick a type, date and roommates"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

            {/* Step 2: SPLIT YOUR WAY (이미지 왼쪽) */}
            <div className="info-block reverse">
              <div className="img-placeholder">
                <img
                src={step2Img} 
                alt="Split screen: choose who to include and split equally or by exact amounts"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
              <div className="text-box">
                <h2 className="step-title">SPLIT YOUR WAY <span aria-hidden="true">⚡️</span></h2>
                <p className="step-desc">Select who ate what. Split equally or by exact amounts. “I didn’t eat that pizza!” No problem.</p>
              </div>
            </div>

            {/* Step 3: SETTLE UP */}
            <div className="info-block">
              <div className="text-box">
                <h2 className="step-title">SETTLE UP <span aria-hidden="true">💸</span></h2>
                <p className="step-desc">See exactly who owes what. We do the math, down to the last cent. You just pay back and enjoy your life.</p>
              </div>
              <div className="img-placeholder">
                 <img
                src={step3Img} 
                alt="Result screen: each roommate's share with buttons to copy a share link"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

          </div> 
          {/* content-section 끝 */}

          {/* 3. 하단 푸터 (START 버튼) */}
          <div className="footer-section">
            <button type="button" className="start-btn" onClick={() => navigate('/create')}>
              START!
            </button>
          </div>

        </div> 
        {/* house-body 끝 */}

      </div>
    </div>
  )
}