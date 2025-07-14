document.addEventListener('DOMContentLoaded', () => {
    const setupView = document.getElementById('setup-view');
    const workoutView = document.getElementById('workout-view');
    const progressView = document.getElementById('progress-view');

    const setupBtn = document.getElementById('setup-btn');
    const progressBtn = document.getElementById('progress-btn');
    const workoutForm = document.getElementById('workout-form');
    const endWorkoutBtn = document.getElementById('end-workout-btn');

    let exercises = [];
    let currentWorkout = [];
    let currentExerciseIndex = 0;
    let workoutTimer;
    let restTimer;
    let exerciseTimer;
    let restDuration;
    let workoutStartTime;

    // Load exercises from JSON
    fetch('exercises.json')
        .then(response => response.json())
        .then(data => {
            exercises = data.exercises;
        });

    // Navigation
    setupBtn.addEventListener('click', () => {
        setupView.classList.remove('hidden');
        workoutView.classList.add('hidden');
        progressView.classList.add('hidden');
    });

    progressBtn.addEventListener('click', () => {
        setupView.classList.add('hidden');
        workoutView.classList.add('hidden');
        progressView.classList.remove('hidden');
        displayProgress();
    });

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
            startWorkout();
        }
    });

    endWorkoutBtn.addEventListener('click', () => {
        endWorkout();
    });

    function generateWorkout(duration, difficulty, bodyParts) {
        const exerciseDuration = 45; // seconds per exercise
        const totalExercises = Math.floor((duration * 60) / (exerciseDuration + parseInt(document.getElementById('rest-duration').value)));

        let filteredExercises = exercises.filter(ex => {
            const difficultyMatch = ex.difficulty === difficulty;
            const bodyPartMatch = bodyParts.includes('full body') || ex.bodyPart.some(bp => bodyParts.includes(bp));
            return difficultyMatch && bodyPartMatch;
        });

        // Add variations
        const exercisesWithVariations = [];
        filteredExercises.forEach(ex => {
            exercisesWithVariations.push(ex);
            if (ex.variations && ex.variations.length > 0) {
                ex.variations.forEach(variationName => {
                    const variation = {
                        ...ex, // Copy original exercise properties
                        name: variationName,
                        isVariation: true
                    };
                    exercisesWithVariations.push(variation);
                });
            }
        });

        // Simple shuffle and slice
        const shuffled = exercisesWithVariations.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, totalExercises);
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

        const exercise = currentWorkout[currentExerciseIndex];
        document.getElementById('exercise-name').textContent = exercise.name;
        document.getElementById('exercise-image').src = exercise.image;
        document.getElementById('exercise-description').textContent = exercise.description;

        const nextExercise = currentWorkout[currentExerciseIndex + 1];
        if (nextExercise) {
            document.getElementById('next-exercise-name').textContent = nextExercise.name;
        } else {
            document.getElementById('next-exercise-name').textContent = 'Cool-down';
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

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function endWorkout() {
        clearInterval(exerciseTimer);
        clearInterval(restTimer);
        workoutView.classList.add('hidden');
        setupView.classList.remove('hidden');
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

        const workoutsByDate = {};
        history.forEach(workout => {
            const date = new Date(workout.date).toLocaleDateString();
            if (!workoutsByDate[date]) {
                workoutsByDate[date] = [];
            }
            workoutsByDate[date].push(workout);
        });

        for (const date in workoutsByDate) {
            const dayCard = document.createElement('div');
            dayCard.className = 'chart';
            
            const title = document.createElement('h3');
            title.textContent = date;
            dayCard.appendChild(title);

            const workoutList = document.createElement('ul');
            workoutsByDate[date].forEach(workout => {
                const listItem = document.createElement('li');
                listItem.textContent = `- ${workout.duration} minutes: ${workout.exercises.join(', ')}`;
                workoutList.appendChild(listItem);
            });

            dayCard.appendChild(workoutList);
            progressCharts.appendChild(dayCard);
        }
    }
});
