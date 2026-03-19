const ELEMENTS = [
    { name: 'lithný', symbol: 'Li', valency: 1 },
    { name: 'sodný', symbol: 'Na', valency: 1 },
    { name: 'draselný', symbol: 'K', valency: 1 },
    { name: 'stříbrný', symbol: 'Ag', valency: 1 },
    { name: 'vápenatý', symbol: 'Ca', valency: 2 },
    { name: 'hořečnatý', symbol: 'Mg', valency: 2 },
    { name: 'zinečnatý', symbol: 'Zn', valency: 2 },
    { name: 'měďnatý', symbol: 'Cu', valency: 2 },
    { name: 'železnatý', symbol: 'Fe', valency: 2 },
    { name: 'hlinitý', symbol: 'Al', valency: 3 },
    { name: 'železitý', symbol: 'Fe', valency: 3 },
    { name: 'boritý', symbol: 'B', valency: 3 },
    { name: 'uhličitý', symbol: 'C', valency: 4 },
    { name: 'křemičitý', symbol: 'Si', valency: 4 },
    { name: 'olovičitý', symbol: 'Pb', valency: 4 },
    { name: 'siřičitý', symbol: 'S', valency: 4 },
    { name: 'dusičný', symbol: 'N', valency: 5 },
    { name: 'fosforečný', symbol: 'P', valency: 5 },
    { name: 'chlorečný', symbol: 'Cl', valency: 5 },
    { name: 'sírový', symbol: 'S', valency: 6 },
    { name: 'chromový', symbol: 'Cr', valency: 6 },
    { name: 'wolframový', symbol: 'W', valency: 6 },
    { name: 'manganistý', symbol: 'Mn', valency: 7 },
    { name: 'chloristý', symbol: 'Cl', valency: 7 },
    { name: 'osmičelý', symbol: 'Os', valency: 8 }
];

let currentQuestion = null;
let score = 0;
let streak = 0;
let gameMode = 'mix'; // mix, name2formula, formula2name, test

// Test state
let testActive = false;
let testCount = 0;
let maxTestQuestions = 10;
let testTimeLimit = 5; // minutes
let testTimeLeft = 0; // seconds
let timerInterval = null;
let testResults = [];

// DOM Elements
const qTypeText = document.getElementById('q-type');
const qText = document.getElementById('q-text');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const timerEl = document.getElementById('timer');
const skipBtn = document.getElementById('skip-btn');
const modeBtn = document.getElementById('mode-btn');
const menuOverlay = document.getElementById('menu-screen');
const testOptionsOverlay = document.getElementById('test-options-screen');
const resultsOverlay = document.getElementById('results-screen');
const cardEl = document.getElementById('question-card');
const finalGradeEl = document.getElementById('final-grade');
const resultsSummaryEl = document.getElementById('results-summary');
const closeResultsBtn = document.getElementById('close-results');

const suffixes = ["-", "ný", "natý", "itý", "ičitý", "ičný/ečný", "ový", "istý", "ičelý"];

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

function generateFormula(element, valency) {
    let eIdx = 2;
    let oIdx = valency;
    const common = gcd(eIdx, oIdx);
    eIdx /= common;
    oIdx /= common;
    const ePart = eIdx === 1 ? element : `${element}${eIdx}`;
    const oPart = oIdx === 1 ? 'O' : `O${oIdx}`;
    return ePart + oPart;
}

function formatFormula(formula) {
    return formula.replace(/(\d+)/g, '<sub>$1</sub>');
}

function getExplanation(q) {
    const el = q.element;
    const v = el.valency;
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"][v];

    if (q.type === 'name2formula') {
        let eIdx = 2;
        let oIdx = v;
        const common = gcd(2, v);
        let explanation = `Postup: 1) Suffix "${el.name.split(' ').pop()}" odpovídá valenci ${roman} (${v}). `;
        explanation += `2) Křížové pravidlo: ${el.symbol}${roman} + O-II -> ${el.symbol}2O${v}. `;
        if (common > 1) {
            explanation += `3) Indexy 2 a ${v} lze zkrátit číslem ${common}. Výsledek: ${q.answer}.`;
        } else {
            explanation += `3) Indexy nelze zkrátit. Výsledek: ${q.answer}.`;
        }
        return explanation;
    } else {
        return `Postup: 1) Kyslík (O) má vždy oxidační číslo -II. 2) Součet oxidačních čísel musí být 0. 3) Ve vzorci ${q.question} vychází na prvek ${el.symbol} oxidační číslo ${roman} (${v}), což odpovídá koncovce -${suffixes[v]}.`;
    }
}

function nextQuestion() {
    if (testActive && testCount >= maxTestQuestions) {
        showResults();
        return;
    }

    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answerInput.value = '';
    answerInput.placeholder = testActive ? `Otázka ${testCount + 1} z ${maxTestQuestions}` : "Tvoje odpověď...";
    answerInput.focus();

    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const formula = generateFormula(element.symbol, element.valency);
    const name = `oxid ${element.name}`;

    let type = gameMode;
    if (gameMode === 'mix' || gameMode === 'test') {
        type = Math.random() > 0.5 ? 'name2formula' : 'formula2name';
    }

    currentQuestion = { 
        question: type === 'name2formula' ? name : formula, 
        answer: type === 'name2formula' ? formula : name,
        type: type,
        element: element
    };

    if (type === 'name2formula') {
        qText.textContent = currentQuestion.question;
        qTypeText.textContent = 'Napiš vzorec:';
    } else {
        qText.innerHTML = formatFormula(currentQuestion.question);
        qTypeText.textContent = 'Napiš název:';
    }

    if (testActive) testCount++;
}

function calculateGrade(correct) {
    const pct = (correct / maxTestQuestions) * 100;
    if (pct >= 90) return 1;
    if (pct >= 75) return 2;
    if (pct >= 60) return 3;
    if (pct >= 40) return 4;
    return 5;
}

function checkAnswer() {
    const userGuess = answerInput.value.trim().toLowerCase().replace(/\s/g, '');
    const correctAnswer = currentQuestion.answer.toLowerCase().replace(/\s/g, '');
    const normalize = (str) => str.replace('ičný', 'ečný');
    const isCorrect = userGuess === correctAnswer || normalize(userGuess) === normalize(correctAnswer);

    if (testActive) {
        testResults.push({
            question: qText.innerHTML,
            user: answerInput.value,
            correct: currentQuestion.answer,
            isCorrect: isCorrect,
            explanation: getExplanation(currentQuestion)
        });
        
        feedbackEl.textContent = 'Uloženo...';
        feedbackEl.className = 'feedback';
        setTimeout(nextQuestion, 500);
    } else {
        if (isCorrect) {
            feedbackEl.textContent = 'Správně! ✨';
            feedbackEl.className = 'feedback success';
            score += 10 + (streak * 2);
            streak += 1;
            cardEl.classList.add('bounce');
            setTimeout(() => cardEl.classList.remove('bounce'), 400);
            setTimeout(nextQuestion, 1000);
        } else {
            feedbackEl.innerHTML = `Špatně. Správně: ${currentQuestion.answer}<div class="explanation">${getExplanation(currentQuestion)}</div>`;
            feedbackEl.className = 'feedback error';
            streak = 0;
            cardEl.classList.add('shake');
            setTimeout(() => cardEl.classList.remove('shake'), 400);
        }
        updateStats();
    }
}

function startTimer() {
    testTimeLeft = testTimeLimit * 60;
    updateTimerDisplay();
    timerEl.classList.remove('hidden', 'warning');
    
    timerInterval = setInterval(() => {
        testTimeLeft--;
        updateTimerDisplay();
        
        if (testTimeLeft <= 30) {
            timerEl.classList.add('warning');
        }
        
        if (testTimeLeft <= 0) {
            clearInterval(timerInterval);
            showResults(true); // true means time out
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(testTimeLeft / 60);
    const secs = testTimeLeft % 60;
    timerEl.textContent = `Čas: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerEl.classList.add('hidden');
}

function showResults(timedOut = false) {
    stopTimer();
    testActive = false;
    resultsOverlay.classList.remove('hidden');
    const correctCount = testResults.filter(r => r.isCorrect).length;
    const grade = calculateGrade(correctCount);
    finalGradeEl.textContent = grade;
    
    resultsSummaryEl.innerHTML = '';
    
    if (timedOut) {
        const timeoutMsg = document.createElement('div');
        timeoutMsg.className = 'feedback error';
        timeoutMsg.style.marginBottom = '15px';
        timeoutMsg.textContent = 'Čas vypršel! ⏱️';
        resultsSummaryEl.appendChild(timeoutMsg);
    } else {
        const timeToFinish = (testTimeLimit * 60) - testTimeLeft;
        const mins = Math.floor(timeToFinish / 60);
        const secs = timeToFinish % 60;
        const timeMsg = document.createElement('div');
        timeMsg.className = 'feedback';
        timeMsg.style.marginBottom = '10px';
        timeMsg.style.fontSize = '0.9rem';
        timeMsg.textContent = `Dokončeno v čase ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        resultsSummaryEl.appendChild(timeMsg);
    }

    testResults.forEach((res, i) => {
        const div = document.createElement('div');
        div.className = 'mistake-item';
        div.innerHTML = `
            <div><strong>${i+1}. ${res.question}</strong></div>
            <div class="${res.isCorrect ? 'mistake-a' : 'mistake-q'}">Tvoje: ${res.user || '(prázdné)'}</div>
            ${!res.isCorrect ? `<div class="mistake-a">Správně: ${res.correct}</div><div class="explanation">${res.explanation}</div>` : '<div>Správně!</div>'}
        `;
        resultsSummaryEl.appendChild(div);
    });
}

function updateStats() {
    scoreEl.textContent = `Skóre: ${score}`;
    streakEl.textContent = `Série: ${streak}`;
}

// Event Listeners
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });
skipBtn.addEventListener('click', nextQuestion);
modeBtn.addEventListener('click', () => {
    stopTimer();
    menuOverlay.classList.remove('hidden');
});
closeResultsBtn.addEventListener('click', () => resultsOverlay.classList.add('hidden'));

// Test Setup Logic
const testSetupBtn = document.getElementById('test-setup-btn');
const startTestBtn = document.getElementById('start-test-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

testSetupBtn.addEventListener('click', () => {
    menuOverlay.classList.add('hidden');
    testOptionsOverlay.classList.remove('hidden');
});

backToMenuBtn.addEventListener('click', () => {
    testOptionsOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
});

document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const group = e.target.parentElement;
        group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        if (e.target.dataset.questions) {
            maxTestQuestions = parseInt(e.target.dataset.questions);
        } else if (e.target.dataset.time) {
            testTimeLimit = parseInt(e.target.dataset.time);
        }
    });
});

startTestBtn.addEventListener('click', () => {
    testOptionsOverlay.classList.add('hidden');
    gameMode = 'test';
    score = 0;
    streak = 0;
    testActive = true;
    testCount = 0;
    testResults = [];
    updateStats();
    startTimer();
    nextQuestion();
});

document.querySelectorAll('.mode-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
        gameMode = e.target.getAttribute('data-mode');
        menuOverlay.classList.add('hidden');
        score = 0;
        streak = 0;
        testActive = false;
        testCount = 0;
        testResults = [];
        stopTimer();
        updateStats();
        nextQuestion();
    });
});

nextQuestion();
