document.addEventListener('DOMContentLoaded', () => {
    const setupView = document.getElementById('setup-view');
    const workoutView = document.getElementById('workout-view');
    const progressView = document.getElementById('progress-view');
    const allExercisesView = document.getElementById('all-exercises-view');
    const workoutPreviewView = document.getElementById('workout-preview-view');

    const setupBtn = document.getElementById('setup-btn');
    const progressBtn = document.getElementById('progress-btn');
    const allExercisesBtn = document.getElementById('all-exercises-btn');
    const workoutForm = document.getElementById('workout-form');
    const endWorkoutBtn = document.getElementById('end-workout-btn');
    const startWorkoutBtn = document.getElementById('start-workout-btn');

    let exercises = [];
    let currentWorkout = [];
    let currentExerciseIndex = 0;
    let workoutTimer;
    let restTimer;
    let exerciseTimer;
    let restDuration;
    let workoutStartTime;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Load exercises from JSON
    fetch('exercises.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            exercises = data.exercises;
        });

    const navButtons = [setupBtn, progressBtn, allExercisesBtn];

    function setActiveView(activeBtn) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');

        [setupView, progressView, allExercisesView, workoutView, workoutPreviewView].forEach(view => view.classList.add('hidden'));

        if (activeBtn === setupBtn) setupView.classList.remove('hidden');
        if (activeBtn === progressBtn) progressView.classList.remove('hidden');
        if (activeBtn === allExercisesBtn) allExercisesView.classList.remove('hidden');
    }

    // Navigation
    setupBtn.addEventListener('click', () => {
        setActiveView(setupBtn);
    });

    progressBtn.addEventListener('click', () => {
        setActiveView(progressBtn);
        displayProgress();
    });

    allExercisesBtn.addEventListener('click', () => {
        setActiveView(allExercisesBtn);
        displayAllExercises();
    });

    setActiveView(setupBtn);

    // Workout form submission
    workoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const duration = document.getElementById('duration').value;
        const difficulty = document.getElementById('difficulty').value;
        const bodyParts = document.getElementById('body-parts').value.split(',').map(s => s.trim());
        const rest = document.getElementById('rest-duration').value;
        restDuration = parseInt(rest);

        currentWorkout = generateWorkout(duration, difficulty, bodyParts);
        if (currentWorkout.length > 0) {
            displayWorkoutPreview();
        }
    });

    startWorkoutBtn.addEventListener('click', () => {
        workoutPreviewView.classList.add('hidden');
        startWorkout();
    });

    endWorkoutBtn.addEventListener('click', () => {
        endWorkout();
    });

    function generateWorkout(duration, difficulty, bodyParts) {
        const warmUpDuration = 5 * 60; // 5 minutes
        const coolDownDuration = 5 * 60; // 5 minutes
        const mainWorkoutDuration = (duration * 60) - warmUpDuration - coolDownDuration;
        const exerciseDuration = 45; // seconds per exercise
        const rest = parseInt(document.getElementById('rest-duration').value);

        const warmUpExercises = getExercisesByBodyPart(['full body'], 'easy', Math.floor(warmUpDuration / (exerciseDuration + rest)));
        const coolDownExercises = getExercisesByBodyPart(['full body'], 'easy', Math.floor(coolDownDuration / (exerciseDuration + rest)));
        const mainWorkoutExercises = getExercisesByBodyPart(bodyParts, difficulty, Math.floor(mainWorkoutDuration / (exerciseDuration + rest)));

        return [...warmUpExercises, ...mainWorkoutExercises, ...coolDownExercises];
    }

    function getExercisesByBodyPart(bodyParts, difficulty, count) {
        let filteredExercises = exercises.filter(ex => {
            const difficultyMatch = ex.difficulty === difficulty;
            const bodyPartMatch = bodyParts.includes('full body') || ex.bodyPart.some(bp => bodyParts.includes(bp));
            return difficultyMatch && bodyPartMatch;
        });

        const shuffled = filteredExercises.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function startWorkout() {
        setupView.classList.add('hidden');
        workoutView.classList.remove('hidden');
        currentExerciseIndex = 0;
        workoutStartTime = new Date();
        displayExercise();
    }

    function displayExercise() {
        if (currentExerciseIndex >= currentWorkout.length) {
            endWorkout();
            return;
        }

        // Clear previous phase title
        const existingPhaseTitle = document.querySelector('#workout-view > h2');
        if (existingPhaseTitle) {
            existingPhaseTitle.remove();
        }

        const phaseTitle = document.createElement('h2');
        if (currentExerciseIndex < 5) {
            phaseTitle.textContent = 'Warm-up';
        } else if (currentExerciseIndex >= currentWorkout.length - 5) {
            phaseTitle.textContent = 'Cool-down';
        } else {
            phaseTitle.textContent = 'Main Workout';
        }
        document.getElementById('workout-view').prepend(phaseTitle);

        const exercise = currentWorkout[currentExerciseIndex];
        document.getElementById('exercise-name').textContent = exercise.name;
        document.getElementById('exercise-image').src = exercise.image;
        document.getElementById('exercise-description').textContent = exercise.instructions.join('\n');

        const nextExercise = currentWorkout[currentExerciseIndex + 1];
        if (nextExercise) {
            document.getElementById('next-exercise-name').textContent = nextExercise.name;
        } else {
            document.getElementById('next-exercise-name').textContent = 'Workout Complete!';
        }

        const timerDisplay = document.getElementById('timer');
        let exerciseTime = 45; // seconds
        timerDisplay.textContent = formatTime(exerciseTime);

        exerciseTimer = setInterval(() => {
            exerciseTime--;
            timerDisplay.textContent = formatTime(exerciseTime);
            if (exerciseTime <= 0) {
                clearInterval(exerciseTimer);
                startRest();
            }
        }, 1000);
    }

    function startRest() {
        const timerDisplay = document.getElementById('timer');
        let restTime = restDuration;
        timerDisplay.textContent = formatTime(restTime);
        document.getElementById('exercise-name').textContent = "Rest";
        document.getElementById('exercise-image').style.display = 'none';
        document.getElementById('exercise-description').textContent = "Take a break. The next exercise is coming up.";

        restTimer = setInterval(() => {
            restTime--;
            timerDisplay.textContent = formatTime(restTime);
            if (restTime <= 0) {
                clearInterval(restTimer);
                currentExerciseIndex++;
                document.getElementById('exercise-image').style.display = 'block';
                displayExercise();
            }
        }, 1000);
    }

    function displayWorkoutPreview() {
        setupView.classList.add('hidden');
        workoutPreviewView.classList.remove('hidden');
        const previewList = document.getElementById('workout-preview-list');
        previewList.innerHTML = ''; // Clear previous content

        const warmUpSection = document.createElement('div');
        warmUpSection.innerHTML = '<h3>Warm-up</h3>';
        currentWorkout.slice(0, 5).forEach(exercise => {
            const li = document.createElement('li');
            li.textContent = exercise.name;
            warmUpSection.appendChild(li);
        });
        previewList.appendChild(warmUpSection);


        const mainWorkoutSection = document.createElement('div');
        mainWorkoutSection.innerHTML = '<h3>Main Workout</h3>';
        currentWorkout.slice(5, currentWorkout.length - 5).forEach(exercise => {
            const li = document.createElement('li');
            li.textContent = exercise.name;
            mainWorkoutSection.appendChild(li);
        });
        previewList.appendChild(mainWorkoutSection);

        const coolDownSection = document.createElement('div');
        coolDownSection.innerHTML = '<h3>Cool-down</h3>';
        currentWorkout.slice(currentWorkout.length - 5).forEach(exercise => {
            const li = document.createElement('li');
            li.textContent = exercise.name;
            coolDownSection.appendChild(li);
        });
        previewList.appendChild(coolDownSection);
    }

    function displayAllExercises() {
        const exerciseList = document.getElementById('exercise-list');
        exerciseList.innerHTML = '';
        exercises.forEach(exercise => {
            const item = document.createElement('div');
            item.className = 'exercise-item';
            item.innerHTML = `
                <h3>${exercise.name}</h3>
                <img src="${exercise.image}" alt="${exercise.name}" onerror="this.style.display='none'">
                <p>${exercise.instructions.join('\n')}</p>
            `;
            exerciseList.appendChild(item);
        });
    }

    function endWorkout() {
        clearInterval(exerciseTimer);
        clearInterval(restTimer);
        // Clear phase title
        const existingPhaseTitle = document.querySelector('#workout-view > h2');
        if (existingPhaseTitle) {
            existingPhaseTitle.remove();
        }
        workoutView.classList.add('hidden');
        setActiveView(setupBtn);
        saveWorkout();
        alert('Workout Complete!');
    }

    function saveWorkout() {
        const workoutLog = {
            date: new Date().toISOString(),
            duration: Math.round((new Date() - workoutStartTime) / 1000 / 60), // in minutes
            exercises: currentWorkout.map(ex => ex.name)
        };

        let history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
        history.push(workoutLog);
        localStorage.setItem('workoutHistory', JSON.stringify(history));
    }

    function displayProgress() {
        const progressCharts = document.getElementById('progress-charts');
        const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];

        if (history.length === 0) {
            progressCharts.innerHTML = '<p>No workout history yet. Complete a workout to see your progress!</p>';
            return;
        }

        progressCharts.innerHTML = ''; // Clear previous content

        // Duration Chart
        const durationChartContainer = document.createElement('div');
        durationChartContainer.className = 'chart';
        durationChartContainer.innerHTML = '<h3>Workout Duration (minutes)</h3>';
        const durationData = history.map(w => w.duration);
        const durationSvg = createBarChart(durationData);
        durationChartContainer.appendChild(durationSvg);
        progressCharts.appendChild(durationChartContainer);

        // Body Part Chart
        const bodyPartChartContainer = document.createElement('div');
        bodyPartChartContainer.className = 'chart';
        bodyPartChartContainer.innerHTML = '<h3>Body Parts Trained</h3>';
        const bodyPartData = getBodyPartData(history);
        const bodyPartSvg = createPieChart(bodyPartData);
        bodyPartChartContainer.appendChild(bodyPartSvg);
        progressCharts.appendChild(bodyPartChartContainer);
    }

    function createBarChart(data) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const barWidth = 30;
        const barMargin = 10;
        const chartHeight = 200;
        const maxValue = Math.max(...data);

        svg.setAttribute('width', data.length * (barWidth + barMargin));
        svg.setAttribute('height', chartHeight);

        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', index * (barWidth + barMargin));
            rect.setAttribute('y', chartHeight - barHeight);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', '#007aff');
            svg.appendChild(rect);
        });

        return svg;
    }

    function getBodyPartData(history) {
        const bodyPartCounts = {};
        history.forEach(workout => {
            workout.exercises.forEach(exerciseName => {
                const exercise = exercises.find(ex => ex.name === exerciseName);
                if (exercise) {
                    exercise.bodyPart.forEach(bp => {
                        bodyPartCounts[bp] = (bodyPartCounts[bp] || 0) + 1;
                    });
                }
            });
        });
        return bodyPartCounts;
    }

    function createPieChart(data) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const size = 200;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2;

        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        let total = 0;
        for (const key in data) {
            total += data[key];
        }

        let startAngle = 0;
        const colors = ['#34c759', '#ff9500', '#ff3b30', '#5856d6', '#007aff', '#ff2d55'];
        let colorIndex = 0;

        for (const key in data) {
            const value = data[key];
            const sliceAngle = (value / total) * 360;
            const endAngle = startAngle + sliceAngle;

            const path = document.createElementNS(svgNS, 'path');
            const d = `M ${centerX},${centerY} L ${centerX + radius * Math.cos(startAngle * Math.PI / 180)},${centerY + radius * Math.sin(startAngle * Math.PI / 180)} A ${radius},${radius} 0 ${sliceAngle > 180 ? 1 : 0},1 ${centerX + radius * Math.cos(endAngle * Math.PI / 180)},${centerY + radius * Math.sin(endAngle * Math.PI / 180)} Z`;
            path.setAttribute('d', d);
            path.setAttribute('fill', colors[colorIndex % colors.length]);
            svg.appendChild(path);

            startAngle = endAngle;
            colorIndex++;
        }

        return svg;
    }
});
