const feedbackElement = document.getElementById('feedback');
const guessListElement = document.getElementById('previousGuesses');
const muteButton = document.getElementById("muteButton");
let suggestionsBox = document.getElementById("suggestions");
let pokemonDataMap = {};
let hasPlayedMusic = false;
let isMuted = false;

let guessesRemaining = 6;
let guessesMade = 0;
const maxGuesses = 6;

let encounterMusic = new Audio('sounds/gamestartSound.mp3');
const winSound = document.getElementById("winSound");
const lossSound = document.getElementById("lossSound");

const guessTrackerElement = document.getElementById('guessTracker');
const numberOfPokemons = 1025;
const debuggingMode = false;

let pokemonData = [];
let targetPokemon = null;
let pokemonNames = []; 
let evolutionStagesData = [];
let previousGuessed = [];

// Function to open the rules modal
function openRulesModal() {
    const modal = document.getElementById('rulesModal');
    modal.style.display = 'block';
}

// Function to close the modal and play music
const closeRulesModal = () => {
    const modal = document.getElementById("rulesModal"); // Replace with your actual modal ID
    modal.style.display = "none"; // Close the modal

    // Check if music has not been played yet
    if (!hasPlayedMusic && !isMuted) {
        encounterMusic.play(); // Play the music
        hasPlayedMusic = true; // Set the flag to true to prevent replay
    }
};

// Event listeners on startup
document.addEventListener('DOMContentLoaded', async () => {
    openRulesModal(); 
    await loadEvolutionData();
    await loadPokemonData();
    await getPokemonNames();
    initializeGame();

    // Close the modal when the close button is clicked
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', closeRulesModal);
});


const loadPokemonData = async () => {
    const response = await fetch('reduced_pokemon_data.json'); // Path to local JSON
    if (!response.ok) throw new Error('Network response was not ok');
    pokemonData = await response.json();
    console.log(`Loaded ${pokemonData.length} Pokémon data entries.`);
    
    // Grab names after loading data
    const pokemonNames = getPokemonNames();
    
};

//Fetch evolution data from local JSON
const loadEvolutionData = async () => {
    const response = await fetch('pokemon_evolution_data.json');
    if (!response.ok) throw new Error('Network response was not ok');
    evolutionStagesData = await response.json();
    console.log(`Loaded ${evolutionStagesData.length} Pokémon data entries.`);
}

//Return names from data, ignore alternate forms
const getPokemonNames = async () => {
    return pokemonData.map(pokemon => pokemon.name);
};

//Grab random index for target pokemon
const fetchRandomPokemon = () => {
    randomIndex = Math.floor(Math.random() * 1025);

    return pokemonData[randomIndex];
};

//Fill suggestions, get target pokemon and silhouette
const initializeGame = async () => {
    targetPokemon = fetchRandomPokemon(); 
    pokemonNames = await getPokemonNames();
    const silhouetteElement = document.getElementById('pokemonSilhouette'); //silhouette of target
    pokemonData.forEach(pokemon => {
        pokemonDataMap[pokemon.name.toLowerCase()] = pokemon.id; //load names for suggestions
    });
    
    // Access the silhouette URL from local data
    silhouetteElement.style.backgroundImage = `url(${targetPokemon.image})`; 

    //add debugg info if in debugging mode
    if (debuggingMode) {
        const debugInfoElement = document.getElementById('debugInfo');
        debugInfoElement.style.display = 'block';
        updateDebugInfo();
    }

};

//Grab stats of target pokemon for testing
const updateDebugInfo = () => {
    const debugInfoElement = document.getElementById('debugInfo');
    
    if (targetPokemon && debuggingMode) {
        const { name, id, type = [], baseStats = {}, height = 0, weight = 0, generation = '', evolutionStage = 0 } = targetPokemon;

        const types = Array.isArray(type) ? type.join(', ') : 'N/A';
        const hp = baseStats.hp || 'N/A';
        const attack = baseStats.attack || 'N/A';
        const defense = baseStats.defense || 'N/A';

        debugInfoElement.innerHTML = `
            <h3>Debug Info</h3>
            <p><strong>Name:</strong> ${name || 'N/A'}</p>
            <p><strong>ID:</strong> ${id || 'N/A'}</p>
            <p><strong>Types:</strong> ${types}</p>
            <p><strong>HP:</strong> ${hp}</p>
            <p><strong>Attack:</strong> ${attack}</p>
            <p><strong>Defense:</strong> ${defense}</p>
            <p><strong>Height:</strong> ${height} m</p>
            <p><strong>Weight:</strong> ${weight} kg</p>
            <p><strong>Generation:</strong> ${generation}</p>
            <p><strong>Evolution Stage:</strong> ${evolutionStage}</p>
        `;
    } else {
        debugInfoElement.innerHTML = '';
    }
};

//Get Pokemon generation using id
const getGeneration = (id) => {
    if (id >= 1 && id <= 151) return "1";
    else if (id >= 152 && id <= 251) return "2";
    else if (id >= 252 && id <= 386) return "3";
    else if (id >= 387 && id <= 493) return "4";
    else if (id >= 494 && id <= 649) return "5";
    else if (id >= 650 && id <= 721) return "6";
    else if (id >= 722 && id <= 809) return "7";
    else return "8";
};

//Fill suggestions box with all pokemon names
const populateSuggestionsBox = (filteredNames) => {
    suggestionsBox.innerHTML = '';
    filteredNames.forEach(name => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerText = name; // Use the formatted name
        suggestionsBox.appendChild(suggestionItem); //Add to suggestions
    });
    suggestionsBox.style.display = filteredNames.length ? 'block' : 'none';
};

//Logic for guess submission
const submitGuess = async (pokemonId) => {
    if (!pokemonId) return;

    if (previousGuessed.includes(pokemonId)) {
        alert("Oak's words echoed... \"There's a time and place for everything but not now!\"");
        return; //Repeated guess
    }

    const guessData = pokemonData[pokemonId-1]; // Retrieve Pokémon data from local map
    if (!guessData) {
        console.error(`No data found for Pokémon ID: ${pokemonId}`);
        return;
    }

    addFeedbackOnSubmit(guessData, targetPokemon);

    previousGuessed.push(pokemonId); //Add to previous guesses

    //Increment/ decrement guess variables
    guessesRemaining--;
    guessesMade++;
    document.getElementById('guessTracker').textContent = `Guesses Remaining: ${guessesRemaining}`;

    //Check game over
    if (guessesRemaining === 0) {
        gameOver(false);
    } else if (guessData.name === targetPokemon.name) {
        gameOver(true);
    }

    document.getElementById('guessInput').value = '';
    document.getElementById('suggestions').style.display = 'none';

    updateDebugInfo(); // Update debug info after a guess
};

//Creates single feedback box (excpet Types)
function createSingleFeedbackBox(labelText, guessedValue, targetValue) {
    console.log(`Guessed Value: ${guessedValue} (Type: ${typeof guessedValue}), Target Value: ${targetValue} (Type: ${typeof targetValue})`);
    
    // Create a container for both label and the feedback box
    const container = document.createElement('div');
    container.classList.add('feedback-container'); 
    
    // Create the label element (outside the box)
    const label = document.createElement('label');
    label.textContent = labelText;  
    label.style.fontWeight = 'bold';  
    label.style.display = 'block';  
    label.style.textAlign = 'center';  
    
    // Create the actual feedback box
    const box = document.createElement('div');
    box.classList.add('feedback-box');
    
    const content = document.createElement('div');
    const arrow = getArrow(guessedValue, targetValue);
    
    const difference = Math.abs(guessedValue - targetValue);
    const percentageDifference = (difference / targetValue) * 100;
    
    // Set the box color based on comparison
    if (guessedValue === targetValue) {
        box.style.backgroundColor = '#90EE90';  // Set green for exact match
        console.log("Exact match, setting box color to green.");
    } else if (percentageDifference <= 15) {
        box.style.backgroundColor = '#FFFFE0';  // Set yellow for close match
        console.log("Close match, setting box color to yellow.");
    } else {
        box.style.backgroundColor = '#FF7F7F';  // Set red for large difference
        console.log("Large difference, setting box color to red.");
    }
    
    content.textContent = `${guessedValue} ${arrow}`; //Arrow for comparison
    
    // Append content to the feedback box
    box.appendChild(content);
    
    // Append label and box to the container
    container.appendChild(label);   
    container.appendChild(box);     
    
    return container;  // Return the container, which includes both label and box
}

//Creation of types feedback box
function createTypeFeedbackBox(guessedTypes, targetTypes) {
    
    const container = document.createElement('div');
    container.classList.add('feedback-container'); 
    
    // Create the label element (outside the box)
    const label = document.createElement('label');
    label.textContent = 'Types';  
    label.style.fontWeight = 'bold';  
    label.style.display = 'block';  
    label.style.textAlign = 'center';  
    
    // Create the actual feedback box
    const box = document.createElement('div');
    box.classList.add('feedback-box');
    
    const content = document.createElement('div');
    content.textContent = guessedTypes
    .map(type => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) // Capitalize each type
    .join(', ');
    
    // Set the box color based on closeness of match
    if (guessedTypes.length === targetTypes.length && guessedTypes.every((type, index) => type === targetTypes[index])) {
        box.style.backgroundColor = '#90EE90';  // Full match
    } else if (guessedTypes.some(type => targetTypes.includes(type))) {
        box.style.backgroundColor = '#FFD580';  // Partial match
    } else {
        box.style.backgroundColor = '#FF7F7F';  // No match
    }
    
    // Append content to the feedback box
    box.appendChild(content);
    
    // Append label and box to the container
    container.appendChild(label);   
    container.appendChild(box);     
    
    return container;  // Return the container, which includes both label and box
}

//Combines individual feedback boxes into one encompassing feedback box for guess
function combineFeedback(guessedPokemon, targetPokemon) {
    const feedbackContainer = document.createElement('div');
    feedbackContainer.classList.add('feedback-container'); 
    
    // Create a div to hold the name and image in a single line
    const nameImageContainer = document.createElement('div');
    nameImageContainer.classList.add('name-image-container');

    // Create and append the Pokémon name
    const nameBox = document.createElement('h2');
    nameBox.textContent = guessedPokemon.name.charAt(0).toUpperCase() + guessedPokemon.name.slice(1).toLowerCase(); //Capitalize


    // Create and append the Pokémon image
    const imgBox = document.createElement('img');
    imgBox.src = guessedPokemon.image; 
    imgBox.alt = `${guessedPokemon.name} image`;
    imgBox.classList.add('pokemon-image'); // Optional class for image styling

    // Append both name and image to the nameImageContainer
    nameImageContainer.appendChild(imgBox);
    nameImageContainer.appendChild(nameBox);

    // Append the nameImageContainer to the feedbackContainer
    feedbackContainer.appendChild(nameImageContainer);
    
    // First row (e.g., Type, HP, Attack)
    const firstRow = document.createElement('div');
    firstRow.classList.add('feedback-grid'); // Class to apply grid layout

    const targetTypes = Array.isArray(targetPokemon.types)
    ? targetPokemon.types  
    : [];

    const guessTypes = Array.isArray(guessedPokemon.types)
    ? guessedPokemon.types  
    : [];

    const typeBox = createTypeFeedbackBox(guessTypes, targetTypes);
    
    // Accessing target Pokémon stats
    const targetHp = targetPokemon.hp;
    const targetAttack = targetPokemon.attack;
    const targetDefense = targetPokemon.defense;

    // Accessing guessed Pokémon stats (similar structure assumed)
    const guessHp = guessedPokemon.hp;
    const guessAttack = guessedPokemon.attack;
    const guessDefense = guessedPokemon.defense;

    const hpBox = createSingleFeedbackBox('HP', guessHp, targetHp);
    const attackBox = createSingleFeedbackBox('Atk', guessAttack, targetAttack);
    const defenseBox = createSingleFeedbackBox('Def', guessDefense, targetDefense);
    
    firstRow.appendChild(typeBox);
    firstRow.appendChild(hpBox);
    firstRow.appendChild(attackBox);
    firstRow.appendChild(defenseBox);
    
    // Second row (Height, Weight, Generation, Evolution Stage)
    const secondRow = document.createElement('div');
    secondRow.classList.add('feedback-grid'); // Ensure both rows use the same grid layout

    const generationGuess = getGeneration(guessedPokemon.id);
    const generationTarget = getGeneration(targetPokemon.id);

    const guessName = guessedPokemon.name;
    const targetName = targetPokemon.name;

    const guessEvolutionStages = evolutionStagesData.find(stageData => stageData.name === guessName)?.evolution_stages || [];
    const targetEvolutionStages = evolutionStagesData.find(stageData => stageData.name === targetName)?.evolution_stages || [];

    const guessEvolutionStage = guessEvolutionStages.find(stage => stage.name === guessName)?.stage || -1;
    const targetEvolutionStage = targetEvolutionStages.find(stage => stage.name === targetName)?.stage || -1;
    
    const heightBox = createSingleFeedbackBox('Ht', guessedPokemon.height, targetPokemon.height);
    const weightBox = createSingleFeedbackBox('Wt', guessedPokemon.weight, targetPokemon.weight);
    const generationBox = createSingleFeedbackBox('Gen', generationGuess, generationTarget);
    const evoStageBox = createSingleFeedbackBox('Evo', guessEvolutionStage, targetEvolutionStage);
    
    secondRow.appendChild(heightBox);
    secondRow.appendChild(weightBox);
    secondRow.appendChild(generationBox);
    secondRow.appendChild(evoStageBox);
    
    // Append both rows to the feedbackContainer, below the name and image
    feedbackContainer.appendChild(firstRow);
    feedbackContainer.appendChild(secondRow);
    
    return feedbackContainer;
}

//Add Feedback for guess
function addFeedbackOnSubmit(guessedPokemon, targetPokemon) {
    const feedbackContainer = combineFeedback(guessedPokemon, targetPokemon);
    const feedbackSection = document.getElementById('feedback-section');

    if (!feedbackSection) {
        console.error('Feedback section not found! Make sure the HTML contains a div with id="feedback-section".');
        return;
    }

    // Prepend the new feedback to show the most recent guess at the top
    feedbackSection.prepend(feedbackContainer);

    // Trigger the shake animation
    setTimeout(() => {
        feedbackContainer.classList.add('shake');
    }, 10); // Small delay to allow DOM insertion
}

//Arrows for feedback
const getArrow = (guess, target) => {
    return guess < target ? '↑' : guess > target ? '↓' : '';
};

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const gameOver = (isWin) => {
    // Show the game over popup
    const gameOverPopup = document.getElementById("gameOverPopup");
    gameOverPopup.style.display = "block";
    const correctPokemonInfo = document.getElementById("correctPokemonInfo");
    correctPokemonInfo.innerHTML = `It's... <strong>${capitalizeFirstLetter(targetPokemon.name)}</strong>!`;

    // Display a congratulatory message or a "Good try!" message
    const message = isWin ? "Congratulations!" : "Good try!";
    const messageElement = document.createElement('p'); // Create a new paragraph element
    messageElement.textContent = message; // Set the message text
    correctPokemonInfo.appendChild(messageElement); // Append the message to the correctPokemonInfo div
    
    if (!isMuted) { // Check if the game is not muted
        if (isWin) {
            winSound.play(); // Play win sound
        } else {
            lossSound.play(); // Play loss sound
        }
    }

    // Call the reveal function
    revealSilhouette();

    // Get the question mark element
    const questionMark = document.getElementById("questionMark");

    // Add the flip class to the question mark
    questionMark.classList.add("flip");

    // Wait for the flip animation to finish before changing text
    setTimeout(() => {
        // Update the text to the Pokémon name
        questionMark.textContent = capitalizeFirstLetter(targetPokemon.name); 
    }, 600); // Match the duration of the CSS transition

    // Set up the play again button event listener
    playAgainButton.addEventListener('click', () => {
        console.log('Play Again button clicked.');
        gameOverPopup.style.display = 'none'; // Hide popup
        resetGame(); // Reset game
    });
};


//Reveal silhouette at game end
const revealSilhouette = () => {
    const silhouette = document.getElementById("pokemonSilhouette");
    let brightness = 0; // Start from fully black

    const interval = setInterval(() => {
        brightness += 0.05; // Increase brightness
        silhouette.style.filter = `brightness(${brightness})`;

        // Stop the interval when the silhouette is fully revealed
        if (brightness >= 1) {
            clearInterval(interval);
        }
    }, 50); // Adjust the speed of the reveal by changing the interval time
};

//Reset game structure
const resetGame = () => {
    console.log('Resetting game...');

    // Ensure feedbackSection is correctly selected
    const feedbackSection = document.getElementById('feedback-section');

    if (!feedbackSection) {
        console.error('Feedback section not found!');
        return;
    }

    // Reset game state
    guessesRemaining = maxGuesses;
    guessesMade = 0;
    guessTrackerElement.textContent = `Guesses Remaining: ${guessesRemaining}`;

    // Reset any game-specific state variables like guessed Pokémon
    previousGuessed = [];

    // Clear input, suggestions, and feedback
    guessInput.value = '';
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';

    // Clear feedback section (remove all children)
    while (feedbackSection.firstChild) {
        feedbackSection.removeChild(feedbackSection.firstChild);
    }
    
    // Reset silhouette brightness to fully dark (hidden)
    document.getElementById("pokemonSilhouette").style.filter = "brightness(0)"; 
    
    // Fetch a new target Pokémon from local data
    const randomIndex = Math.floor(Math.random() * 1025);
    targetPokemon = pokemonData[randomIndex]; // Retrieve the random Pokémon data

    console.log('New target Pokémon:', targetPokemon);

    // Set silhouette image using the local data
    const silhouetteElement = document.getElementById('pokemonSilhouette');
    silhouetteElement.style.backgroundImage = `url(${targetPokemon.image}`; // Assuming silhouette property exists in your local data

    // Reset the question mark back to "?" and remove the flip class
    const questionMark = document.getElementById("questionMark");
    questionMark.textContent = "?"; 
    questionMark.classList.remove("flip"); // Remove the flip effect

    if (!isMuted) {
        encounterMusic.play();
    }

    updateDebugInfo(); // Update debug info with the new target Pokémon

    console.log('Game reset complete.');
};



//populating suggestions box
guessInput.addEventListener('input', () => {
    const query = guessInput.value.toLowerCase();
    const filteredNames = pokemonNames.filter(name => name.toLowerCase().startsWith(query)); // Filter by the start of the name
    populateSuggestionsBox(filteredNames);
});

//If name clicked, submit as guess
suggestionsBox.addEventListener('click', (event) => {
    if (event.target.classList.contains('suggestion-item')) {
        const selectedPokemon = event.target.innerText.toLowerCase();
        guessInput.value = event.target.innerText;
        suggestionsBox.style.display = 'none';

        const pokemonId = pokemonDataMap[selectedPokemon];
        if (pokemonId) {
            submitGuess(pokemonId);
        } else {
            console.error(`No ID found for Pokémon: ${selectedPokemon}`);
        }
    }
});

// Add event listener to the document
document.addEventListener('click', (event) => {
    // Check if the click is outside the suggestions box and the guess input
    if (!suggestionsBox.contains(event.target) && event.target !== guessInput) {
        suggestionsBox.style.display = 'none';  // Hide the suggestions box
    }
});

muteButton.addEventListener('click', () => {
    isMuted = !isMuted; // Toggle mute status

    // Change button icon based on mute status
    if (isMuted) {
        muteButton.innerHTML = `<span class="iconify" data-icon="mdi:volume-off"></span>`; // Muted icon
        encounterMusic.pause(); // Pause encounter music
    } else {
        muteButton.innerHTML = `<span class="iconify" data-icon="mdi:volume-high"></span>`; // Unmuted icon
    }
});