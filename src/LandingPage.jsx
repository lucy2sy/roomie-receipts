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
          <img src={logoImg} alt="Roomie Receipts" className="logo-img" />

          {/* 메인 비주얼 (종이 + 별) */}
          <div className="paper-wrapper">
            <img src={starImg} className="star star-left" alt="" />
            <img src={paperImg} className="paper-img" alt="Background Paper" />
            <div className="paper-text">
              ROOMIE RECEIPTS IS A PERSONAL PROJECT BY LUCY LEE. IT IS A BILL-SPLITTING TOOL DESIGNED TO HELP COLLEGE ROOMMATES OR HOUSEMATES MANAGE HOUSEHOLD COSTS.
            </div>
            <img src={starImg} className="star star-right" alt="" />
          </div>

          {/* HOW IT WORKS 버튼 */}
          <div className="btn-container">
            <button className="how-to-btn">HOW IT WORKS</button>
          </div>

          {/* 설명 섹션 (3단계로 축소됨!) */}
          <div className="content-section">
            
            {/* Step 1: CREATE & ADD */}
            <div className="info-block">
              <div className="text-box">
                <h1>CREATE & ADD 🛒</h1>
                <h2>NO LOGIN REQUIRED. JUST CREATE A ROOM AND ADD YOUR EXPENSES. IT'S THAT SIMPLE!</h2>
              </div>
              <div className="img-placeholder">
                <img
                src={step1Img} 
                alt="Create Step"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

            {/* Step 2: SPLIT YOUR WAY (이미지 왼쪽) */}
            <div className="info-block reverse">
              <div className="img-placeholder">
                <img
                src={step2Img} 
                alt="Split Step"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
              <div className="text-box">
                <h1>SPLIT YOUR WAY ⚡️</h1>
                <h2>SELECT WHO ATE WHAT. SPLIT EQUALLY OR BY EXACT AMOUNTS. "I DIDN'T EAT THAT PIZZA!" → NO PROBLEM.</h2>
              </div>
            </div>

            {/* Step 3: SETTLE UP */}
            <div className="info-block">
              <div className="text-box">
                <h1>SETTLE UP 💸</h1>
                <h2>SEE EXACTLY WHO OWES WHO. WE DO THE MATH, YOU JUST PAY BACK AND ENJOY YOUR LIFE.</h2>
              </div>
              <div className="img-placeholder">
                 <img
                src={step3Img} 
                alt="Settle Step"
                style={{ width: '100%', borderRadius: '15px', border: '2px solid black', boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

          </div> 
          {/* content-section 끝 */}

          {/* 3. 하단 푸터 (START 버튼) */}
          <div className="footer-section">
            <button className="start-btn" onClick={() => navigate('/create')}>
              START!
            </button>
          </div>

        </div> 
        {/* house-body 끝 */}

      </div>
    </div>
  )
}