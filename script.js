document.addEventListener('DOMContentLoaded', () => {
    const maxRingValue = 1200;
    const targetFootprint = 350;
    const globalAverage = 860;
    const ring = document.getElementById('ring-progress');
    const totalFootprintEl = document.getElementById('total-footprint');
    const carbonStatusEl = document.getElementById('carbon-status');
    const insightList = document.getElementById('insights-list');
    const dashboardInsight = document.getElementById('dashboard-insight');
    const activeHabitsPanel = document.getElementById('active-habits-panel');
    const reductionTotalEl = document.getElementById('reduction-total');
    const reductionBarEl = document.getElementById('reduction-bar');
    const nextStepLabel = document.getElementById('next-step-label');
    const targetMarker = document.getElementById('target-marker');

    const state = {
        homeEnergy: 350,
        renewable: false,
        heatIntensity: 1,
        carDistance: 120,
        transitDays: 3,
        remote: true,
        dietPattern: 'balanced',
        foodWaste: 20,
        localProduce: true,
        committedSavings: new Map(),
        quizIndex: 0,
        quizScore: 0,
        quizAnswered: false,
    };

    const refs = {
        homeEnergy: document.getElementById('home-energy'),
        renewableSwitch: document.getElementById('renewable-switch'),
        heatIntensity: document.getElementById('heat-intensity'),
        heatIntensityLabel: document.getElementById('heat-intensity-label'),
        homeEnergyValue: document.getElementById('home-energy-value'),
        carDistance: document.getElementById('car-distance'),
        transitDays: document.getElementById('transit-days'),
        remoteSwitch: document.getElementById('remote-switch'),
        dietPattern: document.getElementById('diet-pattern'),
        foodWaste: document.getElementById('food-waste'),
        localSwitch: document.getElementById('local-switch'),
        carDistanceValue: document.getElementById('car-distance-value'),
        transitDaysValue: document.getElementById('transit-days-value'),
        dietLabel: document.getElementById('diet-label'),
        foodWasteValue: document.getElementById('food-waste-value'),
        totalFootprint: document.getElementById('total-footprint'),
        homeValue: document.getElementById('home-value'),
        travelValue: document.getElementById('travel-value'),
        foodValue: document.getElementById('food-value'),
        homeBar: document.getElementById('home-bar'),
        travelBar: document.getElementById('travel-bar'),
        foodBar: document.getElementById('food-bar'),
        benchmarkUser: document.getElementById('benchmark-user'),
        benchmarkGlobal: document.getElementById('benchmark-global'),
        benchmarkTarget: document.getElementById('benchmark-target'),
        benchmarkUserBar: document.getElementById('benchmark-user-bar'),
        benchmarkGlobalBar: document.getElementById('benchmark-global-bar'),
        benchmarkTargetBar: document.getElementById('benchmark-target-bar'),
        mixBars: document.getElementById('mix-bars'),
        quizProgress: document.getElementById('quiz-progress'),
        quizScore: document.getElementById('quiz-score'),
        quizQuestion: document.getElementById('quiz-question'),
        quizOptions: document.getElementById('quiz-options'),
        quizNextBtn: document.getElementById('quiz-next-btn'),
        quizFeedbackTitle: document.getElementById('quiz-feedback-title'),
        quizFeedbackText: document.getElementById('quiz-feedback-text'),
        quizResults: document.getElementById('quiz-results'),
        quizFinalScore: document.getElementById('quiz-final-score'),
        quizFinalMessage: document.getElementById('quiz-final-message'),
        quizRestartBtn: document.getElementById('quiz-restart-btn'),
    };

    const quizQuestions = [
        {
            question: 'Which change usually reduces household emissions the fastest?',
            options: [
                { text: 'Switching one lightbulb', correct: false },
                { text: 'Improving heating and electricity use', correct: true },
                { text: 'Buying a new phone case', correct: false },
            ],
            explanation: 'Home energy is often a large, recurring source of emissions, so efficiency changes add up quickly.'
        },
        {
            question: 'What is a high-impact transport habit?',
            options: [
                { text: 'Replacing a few solo car trips with transit or biking', correct: true },
                { text: 'Washing the car more often', correct: false },
                { text: 'Keeping the same commute every day', correct: false },
            ],
            explanation: 'Fewer fuel-burning miles usually creates the clearest monthly reduction.'
        },
        {
            question: 'Which food choice is generally lower carbon?',
            options: [
                { text: 'More plant-based meals', correct: true },
                { text: 'More beef-heavy meals', correct: false },
                { text: 'Throwing away leftovers', correct: false },
            ],
            explanation: 'Plant-rich meals and less waste both reduce the footprint attached to food.'
        },
    ];

    const habitCards = Array.from(document.querySelectorAll('.habit-card'));
    const commitButtons = Array.from(document.querySelectorAll('.btn-commit'));
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const calcTabs = Array.from(document.querySelectorAll('.calc-tab'));
    const calcPanels = Array.from(document.querySelectorAll('.calc-panel'));

    const formatNumber = (value) => Math.round(value).toLocaleString();

    const setRing = (value) => {
        const radius = 96;
        const circumference = 2 * Math.PI * radius;
        const progress = Math.min(value / maxRingValue, 1);
        ring.style.strokeDasharray = circumference.toFixed(2);
        ring.style.strokeDashoffset = (circumference * (1 - progress)).toFixed(2);
    };

    const getHomeFootprint = () => {
        const base = state.homeEnergy * 0.28 * state.heatIntensity;
        const renewableFactor = state.renewable ? 0.72 : 1;
        return base * renewableFactor;
    };

    const getTravelFootprint = () => {
        const monthlyCarKm = state.carDistance * 4.33;
        const carFootprint = monthlyCarKm * 0.16;
        const transitCredit = state.transitDays * 5;
        const remoteCredit = state.remote ? 18 : 0;
        return Math.max(carFootprint - transitCredit - remoteCredit, 0);
    };

    const getFoodFootprint = () => {
        const dietFactor = {
            'high-meat': 1.9,
            'balanced': 1.2,
            'vegetarian': 0.9,
            'vegan': 0.65,
        }[state.dietPattern];
        const foodBase = 110 * dietFactor;
        const wastePenalty = state.foodWaste * 1.2;
        const localCredit = state.localProduce ? 12 : 0;
        return Math.max(foodBase + wastePenalty - localCredit, 0);
    };

    const getCommittedSavings = () => Array.from(state.committedSavings.values()).reduce((sum, value) => sum + value, 0);

    const getFootprintBreakdown = () => {
        const home = getHomeFootprint();
        const travel = getTravelFootprint();
        const food = getFoodFootprint();
        return { home, travel, food, total: home + travel + food };
    };

    const buildInsightItems = (breakdown) => {
        const highest = [
            ['home', breakdown.home],
            ['travel', breakdown.travel],
            ['food', breakdown.food],
        ].sort((a, b) => b[1] - a[1])[0][0];

        const insights = {
            home: [
                'Home energy is your largest lever. A renewable tariff and moderate heating can reduce the month quickly.',
                'LEDs, insulation, and lower thermostat settings are the easiest home wins.',
            ],
            travel: [
                'Transport is leading your footprint. Replace a few solo car trips with transit, biking, or remote work.',
                'Trip consolidation and fewer low-occupancy drives can create a fast monthly drop.',
            ],
            food: [
                'Food is carrying a lot of weight. More plant-based meals and less waste will help immediately.',
                'Meal planning keeps groceries from becoming emissions in the bin.',
            ],
        };

        const messages = insights[highest];
        insightList.innerHTML = messages.map((message, index) => `
            <div class="active-habit-row">
                <span class="active-habit-name">${index === 0 ? 'Top opportunity' : 'Secondary tip'}</span>
                <span class="active-habit-savings">${message}</span>
            </div>
        `).join('');

        dashboardInsight.textContent = `Your biggest opportunity is ${highest}. Focus there first for the fastest monthly drop.`;
    };

    const updateComparisonBars = (total) => {
        const benchmarkMax = 1000;
        refs.benchmarkUser.textContent = `${formatNumber(total)} kg`;
        refs.benchmarkGlobal.textContent = `${formatNumber(globalAverage)} kg`;
        refs.benchmarkTarget.textContent = `${formatNumber(targetFootprint)} kg`;
        refs.benchmarkUserBar.style.width = `${Math.min((total / benchmarkMax) * 100, 100)}%`;
        refs.benchmarkGlobalBar.style.width = `${Math.min((globalAverage / benchmarkMax) * 100, 100)}%`;
        refs.benchmarkTargetBar.style.width = `${Math.min((targetFootprint / benchmarkMax) * 100, 100)}%`;
        targetMarker.style.left = `${Math.min((targetFootprint / benchmarkMax) * 100, 100)}%`;
        reductionBarEl.style.width = `${Math.min((getCommittedSavings() / 120) * 100, 100)}%`;
        reductionTotalEl.textContent = `${formatNumber(getCommittedSavings())} kg`;
        nextStepLabel.textContent = getCommittedSavings() > 50 ? 'Great momentum' : 'Pick a high-impact habit';
    };

    const updateMixChart = (breakdown) => {
        const data = [
            { label: 'Home', value: breakdown.home, color: '#10b981' },
            { label: 'Travel', value: breakdown.travel, color: '#06b6d4' },
            { label: 'Food', value: breakdown.food, color: '#f59e0b' },
        ];
        const maxValue = Math.max(...data.map((item) => item.value), 100);
        const barWidth = 120;
        const gap = 50;
        const baseline = 190;

        refs.mixBars.innerHTML = data.map((item, index) => {
            const height = Math.max((item.value / maxValue) * 120, 18);
            const x = 70 + index * (barWidth + gap);
            const y = baseline - height;
            return `
                <g>
                    <rect x="${x}" y="${baseline}" width="${barWidth}" height="10" rx="5" fill="rgba(255,255,255,0.06)"></rect>
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="18" fill="${item.color}" opacity="0.92"></rect>
                    <text x="${x + barWidth / 2}" y="${baseline + 30}" fill="#9ca3af" font-size="14" text-anchor="middle">${item.label}</text>
                    <text x="${x + barWidth / 2}" y="${y - 12}" fill="#f3f4f6" font-size="18" font-weight="700" text-anchor="middle">${formatNumber(item.value)}</text>
                </g>
            `;
        }).join('');
    };

    const updateDashboard = () => {
        const breakdown = getFootprintBreakdown();
        const total = breakdown.total;
        const statusText = total <= 350 ? 'On track' : total <= 700 ? 'Needs attention' : 'High impact';
        const statusClass = total <= 350 ? '' : total <= 700 ? 'warning' : 'danger';

        totalFootprintEl.textContent = formatNumber(total);
        carbonStatusEl.textContent = statusText;
        carbonStatusEl.className = `carbon-status-badge ${statusClass}`.trim();

        refs.homeEnergyValue.textContent = state.homeEnergy;
        refs.carDistanceValue.textContent = state.carDistance;
        refs.transitDaysValue.textContent = `${state.transitDays} day${state.transitDays === 1 ? '' : 's'}`;
        refs.foodWasteValue.textContent = state.foodWaste;

        const labelMap = {
            'high-meat': 'High meat',
            balanced: 'Balanced',
            vegetarian: 'Vegetarian',
            vegan: 'Vegan',
        };
        refs.dietLabel.textContent = labelMap[state.dietPattern];
        refs.heatIntensityLabel.textContent = refs.heatIntensity.value === '0.85' ? 'Mild' : refs.heatIntensity.value === '1.25' ? 'Cold' : 'Moderate';

        refs.homeValue.textContent = `${formatNumber(breakdown.home)} kg`;
        refs.travelValue.textContent = `${formatNumber(breakdown.travel)} kg`;
        refs.foodValue.textContent = `${formatNumber(breakdown.food)} kg`;

        refs.homeBar.style.width = `${Math.min((breakdown.home / 600) * 100, 100)}%`;
        refs.travelBar.style.width = `${Math.min((breakdown.travel / 600) * 100, 100)}%`;
        refs.foodBar.style.width = `${Math.min((breakdown.food / 600) * 100, 100)}%`;

        setRing(total);
        updateComparisonBars(total);
        buildInsightItems(breakdown);
        updateMixChart(breakdown);
    };

    const setActiveSection = (sectionId) => {
        document.querySelectorAll('.content-section').forEach((section) => {
            section.classList.toggle('active', section.id === sectionId);
        });
        navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === sectionId));
    };

    navItems.forEach((item) => {
        item.addEventListener('click', () => setActiveSection(item.dataset.target));
    });

    calcTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            calcTabs.forEach((otherTab) => otherTab.classList.toggle('active', otherTab === tab));
            calcPanels.forEach((panel) => panel.classList.toggle('active', panel.id === tab.dataset.panel));
        });
    });

    const syncStateFromInputs = () => {
        state.homeEnergy = Number(refs.homeEnergy.value);
        state.renewable = refs.renewableSwitch.checked;
        state.heatIntensity = Number(refs.heatIntensity.value);
        state.carDistance = Number(refs.carDistance.value);
        state.transitDays = Number(refs.transitDays.value);
        state.remote = refs.remoteSwitch.checked;
        state.dietPattern = refs.dietPattern.value;
        state.foodWaste = Number(refs.foodWaste.value);
        state.localProduce = refs.localSwitch.checked;
    };

    [
        refs.homeEnergy,
        refs.renewableSwitch,
        refs.heatIntensity,
        refs.carDistance,
        refs.transitDays,
        refs.remoteSwitch,
        refs.dietPattern,
        refs.foodWaste,
        refs.localSwitch,
    ].forEach((input) => {
        input.addEventListener('input', () => {
            syncStateFromInputs();
            updateDashboard();
        });
        input.addEventListener('change', () => {
            syncStateFromInputs();
            updateDashboard();
        });
    });

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((otherButton) => otherButton.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            habitCards.forEach((card) => {
                const matches = filter === 'all' || card.dataset.category === filter;
                card.style.display = matches ? 'flex' : 'none';
            });
        });
    });

    commitButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.habit-card');
            const title = card.querySelector('.habit-title').textContent;
            const savings = Number(button.dataset.savings);
            const key = title.toLowerCase();

            if (state.committedSavings.has(key)) {
                state.committedSavings.delete(key);
                button.classList.remove('committed');
                button.innerHTML = '<span>Commit</span>';
            } else {
                state.committedSavings.set(key, savings);
                button.classList.add('committed');
                button.innerHTML = '<span>Committed</span>';
            }

            updateDashboard();
        });
    });

    const renderQuiz = () => {
        const question = quizQuestions[state.quizIndex];
        refs.quizProgress.textContent = `Question ${state.quizIndex + 1} of ${quizQuestions.length}`;
        refs.quizScore.textContent = state.quizScore;
        refs.quizQuestion.textContent = question.question;
        refs.quizOptions.innerHTML = question.options.map((option, index) => `
            <button class="quiz-option" type="button" data-index="${index}">${option.text}</button>
        `).join('');
        refs.quizFeedbackTitle.textContent = 'Why this matters';
        refs.quizFeedbackTitle.className = 'explanation-heading success';
        refs.quizFeedbackText.textContent = 'Simple decisions add up quickly when you repeat them each week.';
        refs.quizResults.hidden = true;
        refs.quizNextBtn.textContent = state.quizIndex === quizQuestions.length - 1 ? 'Finish' : 'Next';
        state.quizAnswered = false;

        Array.from(refs.quizOptions.querySelectorAll('.quiz-option')).forEach((optionButton) => {
            optionButton.addEventListener('click', () => {
                if (state.quizAnswered) {
                    return;
                }
                state.quizAnswered = true;
                const selectedIndex = Number(optionButton.dataset.index);
                const selectedQuestion = quizQuestions[state.quizIndex];
                selectedQuestion.options.forEach((option, index) => {
                    const currentButton = refs.quizOptions.querySelector(`[data-index="${index}"]`);
                    currentButton.disabled = true;
                    if (option.correct) {
                        currentButton.classList.add('correct');
                    } else if (index === selectedIndex) {
                        currentButton.classList.add('incorrect');
                    }
                });

                const isCorrect = selectedQuestion.options[selectedIndex].correct;
                if (isCorrect) {
                    state.quizScore += 1;
                }
                refs.quizScore.textContent = state.quizScore;
                refs.quizFeedbackTitle.textContent = isCorrect ? 'Correct answer' : 'Good try';
                refs.quizFeedbackTitle.className = `explanation-heading ${isCorrect ? 'success' : 'error'}`;
                refs.quizFeedbackText.textContent = selectedQuestion.explanation;
            });
        });
    };

    refs.quizNextBtn.addEventListener('click', () => {
        if (!state.quizAnswered) {
            refs.quizFeedbackTitle.textContent = 'Pick an answer first';
            refs.quizFeedbackTitle.className = 'explanation-heading error';
            refs.quizFeedbackText.textContent = 'The explanation appears after you choose an option.';
            return;
        }

        if (state.quizIndex < quizQuestions.length - 1) {
            state.quizIndex += 1;
            renderQuiz();
        } else {
            refs.quizQuestion.textContent = 'Quiz complete';
            refs.quizOptions.innerHTML = '';
            refs.quizProgress.textContent = 'Finished';
            refs.quizResults.hidden = false;
            refs.quizFinalScore.textContent = state.quizScore;
            refs.quizFinalMessage.textContent = state.quizScore === 3
                ? 'You have a strong handle on the biggest levers: home energy, travel, and food.'
                : 'You now know where to focus first: reduce energy waste, replace some car miles, and trim food waste.';
            refs.quizNextBtn.disabled = true;
        }
    });

    refs.quizRestartBtn.addEventListener('click', () => {
        state.quizIndex = 0;
        state.quizScore = 0;
        refs.quizNextBtn.disabled = false;
        renderQuiz();
    });

    syncStateFromInputs();
    updateDashboard();
    renderQuiz();
});