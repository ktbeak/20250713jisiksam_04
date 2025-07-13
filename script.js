// 급식정보 조회 웹앱 JavaScript

class MealInfoApp {
    constructor() {
        this.baseUrl = 'https://open.neis.go.kr/hub/mealServiceDietInfo';
        this.schoolCode = '7531100'; // 서울특별시교육청
        this.officeCode = 'J10'; // 서울특별시교육청 코드
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const mealDateInput = document.getElementById('mealDate');

        searchBtn.addEventListener('click', () => this.searchMealInfo());
        mealDateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMealInfo();
            }
        });
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('mealDate').value = formattedDate;
    }

    async searchMealInfo() {
        const selectedDate = document.getElementById('mealDate').value;
        
        if (!selectedDate) {
            this.showError('날짜를 선택해주세요.');
            return;
        }

        this.showLoading();
        
        try {
            const mealData = await this.fetchMealInfo(selectedDate);
            this.displayMealInfo(selectedDate, mealData);
        } catch (error) {
            console.error('급식정보 조회 오류:', error);
            this.showError('급식정보를 불러오는 중 오류가 발생했습니다.');
        }
    }

    async fetchMealInfo(date) {
        const formattedDate = date.replace(/-/g, '');
        const url = `${this.baseUrl}?ATPT_OFCDC_SC_CODE=${this.officeCode}&SD_SCHUL_CODE=${this.schoolCode}&MLSV_YMD=${formattedDate}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return this.parseMealData(data);
    }

    parseMealData(data) {
        // API 응답 구조 확인
        if (data.RESULT && data.RESULT.CODE === 'INFO-200') {
            // 급식정보가 없는 경우
            return null;
        }

        if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]) {
            const mealInfo = data.mealServiceDietInfo[1].row;
            return mealInfo;
        }

        throw new Error('급식정보를 찾을 수 없습니다.');
    }

    displayMealInfo(date, mealData) {
        this.hideAllSections();

        if (!mealData || mealData.length === 0) {
            this.showNoMeal();
            return;
        }

        const formattedDate = this.formatDate(date);
        document.getElementById('mealDateTitle').textContent = `${formattedDate} 급식정보`;

        const lunchMenu = document.getElementById('lunchMenu');
        lunchMenu.innerHTML = '';

        // 중식 정보 찾기
        const lunchData = mealData.find(meal => meal.MMEAL_SC_CODE === '2');
        
        if (lunchData && lunchData.DDISH_NM) {
            const menuItems = this.parseMenuItems(lunchData.DDISH_NM);
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.textContent = item.trim();
                lunchMenu.appendChild(menuItem);
            });
        } else {
            const noMenuItem = document.createElement('div');
            noMenuItem.className = 'menu-item';
            noMenuItem.textContent = '급식 메뉴 정보가 없습니다.';
            lunchMenu.appendChild(noMenuItem);
        }

        this.showMealInfo();
    }

    parseMenuItems(menuString) {
        // 메뉴 문자열을 개별 메뉴로 분리
        // 일반적으로 <br/> 태그나 특수문자로 구분됨
        return menuString
            .replace(/<br\s*\/?>/gi, '\n') // <br> 태그를 줄바꿈으로 변환
            .replace(/&lt;/g, '<') // HTML 엔티티 변환
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .split('\n')
            .filter(item => item.trim() !== '');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];

        return `${year}년 ${month}월 ${day}일 (${weekday})`;
    }

    showLoading() {
        this.hideAllSections();
        document.getElementById('loading').classList.remove('hidden');
    }

    showError(message, details = '') {
        this.hideAllSections();
        const errorElement = document.getElementById('error');
        const errorDetails = errorElement.querySelector('.error-details');
        
        errorElement.querySelector('p').textContent = message;
        errorDetails.textContent = details;
        
        errorElement.classList.remove('hidden');
    }

    showMealInfo() {
        this.hideAllSections();
        document.getElementById('mealInfo').classList.remove('hidden');
    }

    showNoMeal() {
        this.hideAllSections();
        document.getElementById('noMeal').classList.remove('hidden');
    }

    hideAllSections() {
        const sections = ['loading', 'error', 'mealInfo', 'noMeal'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MealInfoApp();
});

// 추가 기능: 오늘 날짜로 자동 조회
document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 시 오늘 날짜의 급식정보 자동 조회
    setTimeout(() => {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.click();
        }
    }, 500);
});
